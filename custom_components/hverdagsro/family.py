"""The family: its members, missions, points, rewards and the house. Stored in .storage."""

from __future__ import annotations

from collections.abc import Callable
import copy
from datetime import date, datetime, timedelta
from typing import TYPE_CHECKING, Any
import uuid

from homeassistant.auth.models import User
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import CALLBACK_TYPE, HomeAssistant, callback
from homeassistant.exceptions import HomeAssistantError, ServiceValidationError
from homeassistant.helpers.dispatcher import async_dispatcher_connect, async_dispatcher_send
from homeassistant.helpers.event import async_track_time_change
from homeassistant.helpers.storage import Store
from homeassistant.util import dt as dt_util

from .const import (
    BOARD_SLOTS,
    DEFAULT_KID_FEATURES,
    DEFAULT_MODULES,
    DOMAIN,
    EVERYONE,
    KEEP_COMPLETIONS_DAYS,
    MAX_LEDGER,
    ROLE_CHILD,
    ROLE_PARENT,
    SAVE_DELAY,
    SECTIONS,
    SIGNAL_UPDATED,
    STORAGE_KEY,
    STORAGE_VERSION,
)
from .validation import validate_section

if TYPE_CHECKING:
    from .messages import Notifier
    from .osky import Osky

type HverdagsroConfigEntry = ConfigEntry[Family]


def default_data() -> dict[str, Any]:
    """An empty family: the panel's guide fills it in."""
    return {
        "setup_done": False,
        "family": [],
        "modules": dict(DEFAULT_MODULES),
        "settings": validate_section("settings", {}),
        "missions": [],
        "rewards": [],
        "house": {"name": "", "rooms": [], "walls": [], "areas": [], "items": []},
        "appliances": [],
        "completions": {},
        "points": {},
        "ledger": [],
        "requests": [],
        "quick": [],
        "routines": {"helpers": [], "pickups": {}, "boards": {}, "cards": []},
        "pins": {},
        "board_done": {},
        "game": {},
    }


HOMEWORK_PREFIX = "lektie:"

# Mit værelse: coins for what a child gets done, spent on new things for the room. The experience (xp) is all the
# coins ever earned, and gives the room's level.
COINS_CARD = 3
COINS_ROUTINE = 10
COINS_MISSION = 10
COINS_HOMEWORK = 8
COINS_DAILY = 5
MAX_UNLOCK = 40
MAX_OWNED = 600


class Family:
    """Runtime data of the Hverdagsro config entry."""

    def __init__(self, hass: HomeAssistant, entry: ConfigEntry) -> None:
        self.hass = hass
        self.entry = entry
        self._store: Store[dict[str, Any]] = Store(
            hass, STORAGE_VERSION, STORAGE_KEY.format(entry_id=entry.entry_id), private=True
        )
        self.data: dict[str, Any] = default_data()
        self._unsubs: list[CALLBACK_TYPE] = []
        self._pin_tries: dict[str, list[datetime]] = {}
        self.osky: Osky
        self.notifier: Notifier
        self.listeners: list[Callable[[str, dict[str, Any]], None]] = []

    # ------------------------------------------------------------------ lifecycle

    async def async_initialize(self) -> None:
        stored = await self._store.async_load()
        if stored:
            data = default_data()
            data.update({key: value for key, value in stored.items() if key in data})
            data["modules"] = {**DEFAULT_MODULES, **data.get("modules", {})}
            self.data = data
        self._unsubs.append(async_track_time_change(self.hass, self._async_new_day, hour=0, minute=0, second=5))

    async def async_shutdown(self) -> None:
        for unsub in self._unsubs:
            unsub()
        self._unsubs.clear()
        await self._store.async_save(self.data)

    async def async_remove(self) -> None:
        await self._store.async_remove()

    @callback
    def _async_new_day(self, _now: datetime) -> None:
        """A new day: yesterday's missions are history; prune old days."""
        oldest = (dt_util.now().date() - timedelta(days=KEEP_COMPLETIONS_DAYS)).isoformat()
        self.data["completions"] = {day: done for day, done in self.data["completions"].items() if day >= oldest}
        today = dt_util.now().date().isoformat()
        self.data["board_done"] = {day: done for day, done in self.data["board_done"].items() if day >= today}
        self.data["pins"] = {
            key: pin for key, pin in self.data["pins"].items() if not pin.get("until") or pin["until"] >= today
        }
        self._changed()

    @property
    def signal(self) -> str:
        return SIGNAL_UPDATED.format(entry_id=self.entry.entry_id)

    @callback
    def _emit(self, kind: str, data: dict[str, Any]) -> None:
        """Something happened that a family member may want a message about."""
        for listener in list(self.listeners):
            listener(kind, data)

    @callback
    def async_changed(self) -> None:
        """Something outside the stored data changed (the wish lists): tell the panel."""
        async_dispatcher_send(self.hass, self.signal)

    @callback
    def _changed(self) -> None:
        self._store.async_delay_save(lambda: self.data, SAVE_DELAY)
        async_dispatcher_send(self.hass, self.signal)

    # ------------------------------------------------------------------ members

    @property
    def members(self) -> list[dict[str, Any]]:
        family: list[dict[str, Any]] = self.data["family"]
        return family

    @property
    def children(self) -> list[dict[str, Any]]:
        return [member for member in self.members if member["role"] == ROLE_CHILD]

    def member(self, key: str) -> dict[str, Any] | None:
        """A member by id, name or person entity (case-insensitive)."""
        wanted = str(key).strip().lower()
        for member in self.members:
            if wanted in (member["id"], member["name"].lower(), str(member.get("person") or "").lower()):
                return member
        return None

    def require_member(self, key: str) -> dict[str, Any]:
        member = self.member(key)
        if member is None:
            raise ServiceValidationError(
                translation_domain=DOMAIN, translation_key="member_not_found", translation_placeholders={"member": key}
            )
        return member

    def member_for_user(self, user: User | None) -> dict[str, Any] | None:
        """The member whose person entity belongs to the Home Assistant user."""
        if user is None:
            return None
        for member in self.members:
            person = member.get("person")
            if not person:
                continue
            state = self.hass.states.get(person)
            if state is not None and state.attributes.get("user_id") == user.id:
                return member
        return None

    def can_manage(self, user: User | None) -> bool:
        """Parents and Home Assistant administrators may change everything."""
        if user is None:
            return False
        member = self.member_for_user(user)
        if member is not None:
            return bool(member["role"] == ROLE_PARENT)
        return bool(user.is_admin)

    def check_member_access(self, user: User | None, member_id: str) -> None:
        """Raise unless the user may act for the member (themselves, or a parent for anyone)."""
        self._check_member_access(user, member_id)

    def _check_member_access(self, user: User | None, member_id: str) -> None:
        """A child may only act for itself.

        A user without a member (a shared family tablet) may act for the children, but not for the parents.
        """
        if user is None or self.can_manage(user):
            return
        me = self.member_for_user(user)
        target = self.member(member_id)
        if target is not None:
            if me is None and target["role"] == ROLE_CHILD:
                return
            if me is not None and me["id"] == target["id"]:
                return
        raise HomeAssistantError(translation_domain=DOMAIN, translation_key="not_allowed")

    # ------------------------------------------------------------------ sections

    async def async_save_section(self, section: str, value: Any) -> Any:
        if section not in SECTIONS:
            raise ServiceValidationError(translation_domain=DOMAIN, translation_key="unknown_section")
        if section == "family" and isinstance(value, list):
            # The panel never sees the PINs: a member sent without one keeps the one it has.
            old = {member["id"]: member.get("pin") for member in self.members}
            value = [
                {**item, "pin": old.get(item.get("id"))} if isinstance(item, dict) and "pin" not in item else item
                for item in value
            ]
            # has_pin is what the panel gets instead of the PIN; it is not stored.
            value = [
                {k: v for k, v in item.items() if k != "has_pin"} if isinstance(item, dict) else item for item in value
            ]
        clean = validate_section(section, value)
        if section == "modules":
            clean = {**self.data["modules"], **clean}
        before = self.data.get(section)
        self.data[section] = clean
        if section == "pins":
            for key, pin in clean.items():
                if (before or {}).get(key) != pin:
                    self._emit("pin", {"member": key, "text": pin["text"]})
        if section == "family":
            known = {member["id"] for member in clean}
            self.data["points"] = {key: points for key, points in self.data["points"].items() if key in known}
        self._changed()
        return clean

    @callback
    def async_finish_setup(self) -> None:
        self.data["setup_done"] = True
        self._changed()

    async def async_set_theme(self, user: User | None, member_id: str, skin: str, mode: str) -> None:
        self._check_member_access(user, member_id)
        member = self.require_member(member_id)
        family = copy.deepcopy(self.members)
        for item in family:
            if item["id"] == member["id"]:
                item["skin"], item["mode"] = skin, mode
        await self.async_save_section("family", family)

    def feature(self, member: dict[str, Any], feature: str) -> bool:
        """A child's module (Moduler pr. barn): on for the child and for the family."""
        family_key = {"room": "rooms"}.get(feature, feature)
        if not self.data["modules"].get(family_key, True):
            return False
        if feature == "shop" and not self.feature(member, "points"):
            return False
        if feature == "skema" and member.get("institution") != "skole":
            return False
        return bool({**DEFAULT_KID_FEATURES, **member.get("features", {})}.get(feature, True))

    async def async_set_prefs(self, user: User | None, member_id: str, prefs: dict[str, Any]) -> None:
        """A member's own settings: the + menu, messages, picture, theme and own room. Children may not change messages."""
        self._check_member_access(user, member_id)
        member = self.require_member(member_id)
        if "msg_off" in prefs and user is not None and not self.can_manage(user):
            raise HomeAssistantError(translation_domain=DOMAIN, translation_key="not_allowed")
        allowed = {
            "quick_order",
            "quick_hide",
            "msg_off",
            "photo",
            "skin",
            "mode",
            "goal",
            "playroom",
            "room_prefs",
            "nav",
        }
        family = copy.deepcopy(self.members)
        for item in family:
            if item["id"] == member["id"]:
                item.update({key: value for key, value in prefs.items() if key in allowed})
        await self.async_save_section("family", family)

    def check_pin(self, member_id: str, pin: str) -> bool:
        """A child's PIN on a shared tablet. Members without a PIN need none."""
        member = self.require_member(member_id)
        expected = member.get("pin")
        if not expected:
            return True
        now = dt_util.utcnow()
        tries = [t for t in self._pin_tries.get(member["id"], []) if now - t < timedelta(minutes=5)]
        if len(tries) >= 5:
            raise HomeAssistantError(translation_domain=DOMAIN, translation_key="too_many_tries")
        if str(pin) == expected:
            self._pin_tries.pop(member["id"], None)
            return True
        self._pin_tries[member["id"]] = [*tries, now]
        return False

    async def async_set_board(
        self, member_id: str, slot: str, index: int, done: bool, user: User | None = None
    ) -> list[str]:
        """Tick a card on the child's routine board. A whole part of the day done gives 5 points."""
        self._check_member_access(user, member_id)
        member = self.require_member(member_id)
        if slot not in BOARD_SLOTS:
            raise ServiceValidationError(translation_domain=DOMAIN, translation_key="unknown_section")
        today = dt_util.now().date().isoformat()
        day = self.data["board_done"].setdefault(today, {})
        mine: list[str] = day.setdefault(member["id"], [])
        key = f"{slot}:{int(index)}"
        if done and key not in mine:
            mine.append(key)
            self._add_coins(member["id"], COINS_CARD)
        elif not done and key in mine:
            mine.remove(key)
            self._add_coins(member["id"], -COINS_CARD)
        cards = self.data["routines"].get("boards", {}).get(member["id"], {}).get(slot, [])
        bonus = f"{slot}:bonus"
        if cards and bonus not in mine and all(f"{slot}:{i}" in mine for i in range(len(cards))):
            mine.append(bonus)
            self._add_coins(member["id"], COINS_ROUTINE)
            if self.feature(member, "points"):
                self._add_points(member["id"], 5, "Rutinetavle", None)
        self._changed()
        return mine

    # ------------------------------------------------------------------ missions

    def missions_for(self, member_id: str, day: date | None = None) -> list[dict[str, Any]]:
        """The member's missions on a day, in the order they were made. A child with two homes only gets the
        missions for the home they are in that day."""
        day = day or dt_util.now().date()
        member = self.member(member_id)
        # Missions for everyone are the children's.
        wanted = (member_id, EVERYONE) if member is not None and member["role"] == ROLE_CHILD else (member_id,)
        here = at_home(member, day) if member is not None else True
        return [
            mission
            for mission in self.data["missions"]
            if mission["member"] in wanted
            and day.weekday() in mission["days"]
            and (mission.get("where", "here") == "always" or (mission.get("where", "here") == "away") != here)
        ]

    def is_done(self, mission_id: str, member_id: str, day: date | None = None) -> bool:
        day = day or dt_util.now().date()
        return f"{mission_id}:{member_id}" in self.data["completions"].get(day.isoformat(), {})

    def mission(self, key: str) -> dict[str, Any]:
        wanted = str(key).strip().lower()
        for mission in self.data["missions"]:
            if wanted in (mission["id"], mission["title"].lower()):
                result: dict[str, Any] = mission
                return result
        raise ServiceValidationError(
            translation_domain=DOMAIN, translation_key="mission_not_found", translation_placeholders={"mission": key}
        )

    async def async_set_mission_done(
        self, mission_id: str, member_id: str, done: bool, user: User | None = None, day: date | None = None
    ) -> bool:
        """Mark a mission done or not; gives or takes back its points."""
        self._check_member_access(user, member_id)
        # Homework from the school (Aula) shows as a mission without points: "lektie:<id>".
        virtual = mission_id.startswith(HOMEWORK_PREFIX) and 0 < len(mission_id) <= 120
        mission: dict[str, Any] = {"id": mission_id, "title": "", "points": 0} if virtual else self.mission(mission_id)
        member = self.require_member(member_id)
        day = day or dt_util.now().date()
        key = f"{mission['id']}:{member['id']}"
        today = self.data["completions"].setdefault(day.isoformat(), {})
        if done == (key in today):
            return done
        by = self.member_for_user(user)
        coins = COINS_HOMEWORK if virtual else COINS_MISSION
        if done:
            today[key] = {"at": dt_util.now().isoformat(), "by": by["id"] if by else None}
            self._add_coins(member["id"], coins)
            if not virtual:
                self._emit("mission", {"member": member["id"], "mission": mission})
        else:
            today.pop(key, None)
            self._add_coins(member["id"], -coins)
        if self.data["modules"].get("points", True) and mission["points"]:
            delta = mission["points"] if done else -mission["points"]
            self._add_points(member["id"], delta, mission["title"], by["id"] if by else None)
        self._changed()
        return done

    # ------------------------------------------------------------------ points and shop

    def points(self, member_id: str) -> int:
        return int(self.data["points"].get(member_id, 0))

    def _add_points(self, member_id: str, delta: int, reason: str, by: str | None) -> None:
        before = self.points(member_id)
        goal = self.goal(member_id)
        self.data["points"][member_id] = max(0, before + int(delta))
        self._emit(
            "points", {"member": member_id, "delta": int(delta), "reason": reason, "points": self.points(member_id)}
        )
        if goal is not None and before < goal["cost"] <= self.points(member_id):
            self._emit("goal", {"member": member_id, "reward": goal})
        self.data["ledger"].append(
            {"at": dt_util.now().isoformat(), "member": member_id, "delta": int(delta), "reason": reason[:80], "by": by}
        )
        del self.data["ledger"][:-MAX_LEDGER]

    async def async_add_points(self, member_id: str, delta: int, reason: str, user: User | None = None) -> int:
        if user is not None and not self.can_manage(user):
            raise HomeAssistantError(translation_domain=DOMAIN, translation_key="not_allowed")
        member = self.require_member(member_id)
        by = self.member_for_user(user)
        self._add_points(member["id"], delta, reason or "", by["id"] if by else None)
        self._changed()
        return self.points(member["id"])

    def reward(self, reward_id: str) -> dict[str, Any]:
        for reward in self.data["rewards"]:
            if reward["id"] == reward_id:
                result: dict[str, Any] = reward
                return result
        raise ServiceValidationError(translation_domain=DOMAIN, translation_key="reward_not_found")

    async def async_request_reward(self, member_id: str, reward_id: str, user: User | None = None) -> dict[str, Any]:
        """A child wants a reward; a parent approves it before the points are taken."""
        self._check_member_access(user, member_id)
        member = self.require_member(member_id)
        reward = self.reward(reward_id)
        if reward["member"] not in (EVERYONE, member["id"]):
            raise ServiceValidationError(translation_domain=DOMAIN, translation_key="reward_not_found")
        if self.points(member["id"]) < reward["cost"]:
            raise ServiceValidationError(translation_domain=DOMAIN, translation_key="not_enough_points")
        if any(
            r["member"] == member["id"] and r["reward"] == reward_id and r["status"] == "pending" for r in self.requests
        ):
            raise ServiceValidationError(translation_domain=DOMAIN, translation_key="already_requested")
        request = {
            "id": uuid.uuid4().hex[:10],
            "member": member["id"],
            "reward": reward_id,
            "at": dt_util.now().isoformat(),
            "status": "pending",
        }
        self.data["requests"].append(request)
        del self.data["requests"][:-100]
        if self.can_manage(user):
            await self.async_decide(request["id"], True, user)
        else:
            self._emit("shop", {"member": member["id"], "reward": reward})
            self._changed()
        return request

    @property
    def requests(self) -> list[dict[str, Any]]:
        requests: list[dict[str, Any]] = self.data["requests"]
        return requests

    async def async_decide(self, request_id: str, approve: bool, user: User | None = None) -> None:
        if user is not None and not self.can_manage(user):
            raise HomeAssistantError(translation_domain=DOMAIN, translation_key="not_allowed")
        request = next((r for r in self.requests if r["id"] == request_id and r["status"] == "pending"), None)
        if request is None:
            raise ServiceValidationError(translation_domain=DOMAIN, translation_key="request_not_found")
        reward = next((r for r in self.data["rewards"] if r["id"] == request["reward"]), None)
        if approve and reward is not None:
            if self.points(request["member"]) < reward["cost"]:
                raise ServiceValidationError(translation_domain=DOMAIN, translation_key="not_enough_points")
            by = self.member_for_user(user)
            self._add_points(request["member"], -reward["cost"], reward["title"], by["id"] if by else None)
        request["status"] = "approved" if approve and reward is not None else "declined"
        self._changed()

    def goal(self, member_id: str) -> dict[str, Any] | None:
        """The child's chosen goal (Gør til mål), else the cheapest reward the child cannot afford yet."""
        member = self.member(member_id)
        chosen = member.get("goal") if member else None
        for reward in self.data["rewards"]:
            if chosen and reward["id"] == chosen and reward["member"] in (EVERYONE, member_id):
                result: dict[str, Any] = reward
                return result
        points = self.points(member_id)
        options = [r for r in self.data["rewards"] if r["member"] in (EVERYONE, member_id) and r["cost"] > points]
        return min(options, key=lambda r: r["cost"], default=None)

    # ------------------------------------------------------------------ Mit værelse: coins and things

    def game(self, member_id: str) -> dict[str, Any]:
        """A member's coins, experience and the things they have unlocked for their room."""
        state: dict[str, Any] = self.data["game"].setdefault(member_id, {"coins": 0, "xp": 0, "owned": []})
        state.setdefault("coins", 0)
        state.setdefault("xp", 0)
        state.setdefault("owned", [])
        return state

    def _add_coins(self, member_id: str, delta: int) -> None:
        """Earned (or taken back, when something is ticked off again): the experience follows, never below zero."""
        state = self.game(member_id)
        state["coins"] = max(0, int(state["coins"]) + int(delta))
        state["xp"] = max(0, int(state["xp"]) + int(delta))

    async def async_game(
        self, member_id: str, action: str, items: list[str], cost: int, user: User | None = None
    ) -> dict[str, Any]:
        """The room game: the coin of the day for looking in, or unlocking things (one, or a whole pack) for coins."""
        self._check_member_access(user, member_id)
        member = self.require_member(member_id)
        state = self.game(member["id"])
        if action == "daily":
            today = dt_util.now().date().isoformat()
            if state.get("daily") != today:
                state["daily"] = today
                self._add_coins(member["id"], COINS_DAILY)
                self._changed()
            return state
        new = [item for item in dict.fromkeys(items) if item not in state["owned"]]
        if not new:
            return state
        if int(cost) > int(state["coins"]):
            raise ServiceValidationError(translation_domain=DOMAIN, translation_key="not_enough_coins")
        state["coins"] = int(state["coins"]) - int(cost)
        state["owned"] = [*state["owned"], *new][-MAX_OWNED:]
        self._changed()
        return state

    # ------------------------------------------------------------------ the panel

    def panel_state(self, user: User | None) -> dict[str, Any]:
        """Everything the panel needs, seen from the user."""
        me = self.member_for_user(user)
        today = dt_util.now().date().isoformat()
        family = [{**{k: v for k, v in m.items() if k != "pin"}, "has_pin": bool(m.get("pin"))} for m in self.members]
        return {
            **{key: self.data[key] for key in ("setup_done", "modules", "settings", "missions", "rewards")},
            "family": family,
            "quick": self.data["quick"],
            "routines": self.data["routines"],
            "pins": self.data["pins"],
            "board_done": self.data["board_done"].get(today, {}),
            "osky": self.osky.state() if hasattr(self, "osky") else {"accounts": {}, "lists": []},
            "house": self.data["house"],
            "appliances": self.data["appliances"],
            "points": self.data["points"],
            "game": self.data["game"],
            "requests": [r for r in self.requests if r["status"] == "pending" or r["at"][:10] == today],
            "ledger": self.data["ledger"][-40:],
            "done_today": self.data["completions"].get(today, {}),
            "done_week": {day: done for day, done in self.data["completions"].items() if day >= _week_start()},
            "me": me["id"] if me else None,
            "can_manage": self.can_manage(user),
            "is_admin": bool(user and user.is_admin),
            "today": today,
        }

    def subscribe(self, listener: Callable[[], None]) -> CALLBACK_TYPE:
        return async_dispatcher_connect(self.hass, self.signal, listener)


def at_home(member: dict[str, Any] | None, day: date) -> bool:
    """Whether a child is with this family on a day (sleeps here). Children with one home always are.

    The custody plan repeats a cycle of days from its start (1 = here, 0 = at the other home); single dates can be
    set the other way (holidays, swapped weekends)."""
    plan = (member or {}).get("custody") or {}
    if not plan.get("enabled") or not plan.get("start"):
        return True
    iso = day.isoformat()
    exceptions = plan.get("except") or {}
    if iso in exceptions:
        return bool(exceptions[iso])
    cycle = plan.get("cycle") or [1]
    try:
        start = date.fromisoformat(str(plan["start"]))
    except ValueError:
        return True
    return bool(cycle[(day - start).days % len(cycle)])


def _week_start() -> str:
    today = dt_util.now().date()
    return (today - timedelta(days=today.weekday())).isoformat()
