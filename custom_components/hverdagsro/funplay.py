"""Familieleg: the whole family plays together in the play world.

- Dagens familiemission: one small shared mission a day that everybody helps with.
- Stjernejagt: stars are hidden around the house; the ones who play find them together.
- Gemmeleg: one hides a thing somewhere, the others look for it (warmer, colder).
- Sjove opgaver: a grown-up gives a small task, in the game or in real life; done is approved by a grown-up.
- Fest: when the family reaches a goal, everybody who took part gets coins and the game throws a party.

Everything lives in data["fun"] and goes to the panel with the rest of the family's data.
"""

from __future__ import annotations

from datetime import date
import random
from typing import TYPE_CHECKING, Any
import uuid

from homeassistant.auth.models import User
from homeassistant.exceptions import HomeAssistantError, ServiceValidationError
from homeassistant.util import dt as dt_util

from .const import DOMAIN

if TYPE_CHECKING:
    from .family import Family

COINS_STAR = 3
COINS_HUNT_DONE = 10
COINS_FOUND = 10
COINS_HIDDEN = 5
COINS_MISSION_DAY = 8
MAX_TASKS = 30
MAX_STARS = 12
MAX_KID_COINS = 10
FIND_RADIUS = 80

# The missions of the day, one per day in turn: kind, how many, the words the panel shows (it translates them).
DAY_MISSIONS: list[tuple[str, int]] = [
    ("wave", 5),
    ("visit", 4),
    ("talk", 8),
    ("meet", 1),
    ("build", 5),
    ("hug", 3),
    ("star", 3),
]


def fun(family: Family) -> dict[str, Any]:
    """The family's play state, with every part in place."""
    state: dict[str, Any] = family.data.setdefault("fun", {})
    state.setdefault("tasks", [])
    state.setdefault("hunt", None)
    state.setdefault("hide", None)
    state.setdefault("party", None)
    _day(state)
    return state


def _day(state: dict[str, Any], today: date | None = None) -> dict[str, Any]:
    """Today's family mission (a new one after midnight)."""
    today = today or dt_util.now().date()
    day: dict[str, Any] | None = state.get("day")
    if not day or day.get("date") != today.isoformat():
        kind, need = DAY_MISSIONS[today.toordinal() % len(DAY_MISSIONS)]
        day = {"date": today.isoformat(), "kind": kind, "need": need, "count": 0, "keys": [], "who": [], "paid": False}
        state["day"] = day
    return day


def _party(state: dict[str, Any], reason: str, who: list[str]) -> None:
    state["party"] = {"id": uuid.uuid4().hex[:8], "at": dt_util.now().isoformat(), "reason": reason, "who": who}


def _is_parent(family: Family, user: User | None) -> bool:
    return family.can_manage(user)


def _author(family: Family, user: User | None, msg: dict[str, Any]) -> str:
    """Who gives the task: the grown-up's own member, or the child (who must be allowed to act as that child)."""
    if _is_parent(family, user):
        me = family.member_for_user(user)
        return str(me["id"]) if me else str(msg.get("approver") or "")
    approver = str(msg.get("approver") or "")
    family.check_member_access(user, approver)
    return str(family.require_member(approver)["id"])


def _require_owner(family: Family, user: User | None, msg: dict[str, Any], task: dict[str, Any]) -> None:
    """A grown-up, or the child who made the challenge."""
    if _is_parent(family, user):
        return
    approver = str(msg.get("approver") or "")
    if not task.get("kid") or approver != task["by"]:
        raise HomeAssistantError(translation_domain=DOMAIN, translation_key="not_allowed")
    family.check_member_access(user, approver)


def _bad(key: str) -> ServiceValidationError:
    return ServiceValidationError(translation_domain=DOMAIN, translation_key=key)


async def async_fun(family: Family, user: User | None, action: str, msg: dict[str, Any]) -> dict[str, Any]:
    """One thing happens in Familieleg. Returns the new state."""
    state = fun(family)
    member_id = msg.get("member") or ""
    if action not in ("task_add", "task_approve", "task_remove", "hunt_stop", "hide_stop"):
        family.check_member_access(user, member_id)
        member_id = family.require_member(member_id)["id"]

    if action == "event":
        _event(family, state, member_id, str(msg.get("kind") or ""), str(msg.get("key") or ""))
    elif action == "task_add":
        # A grown-up gives a task; a child makes a challenge for the others and pays the coins from their own.
        by = _author(family, user, msg)
        kid = not _is_parent(family, user)
        if len(state["tasks"]) >= MAX_TASKS:
            state["tasks"] = state["tasks"][1:]
        state["tasks"].append(
            {
                "id": uuid.uuid4().hex[:8],
                "title": msg["title"],
                "emoji": msg.get("emoji") or "⭐",
                "for": [family.require_member(m)["id"] for m in msg.get("for") or []],
                "coins": min(MAX_KID_COINS, int(msg.get("coins") or 0)) if kid else int(msg.get("coins") or 5),
                "real": bool(msg.get("real", not kid)),
                "by": by,
                "kid": kid,
                "at": dt_util.now().isoformat(),
                "done": {},
            }
        )
    elif action == "task_done":
        task = _task(state, msg)
        if (task["for"] and member_id not in task["for"]) or (task.get("kid") and member_id == task["by"]):
            raise _bad("not_for_you")
        if task["done"].get(member_id) != "ok":
            task["done"][member_id] = "wait"
    elif action == "task_approve":
        task = _task(state, msg)
        _require_owner(family, user, msg, task)
        who = family.require_member(msg.get("member") or "")["id"]
        if task["done"].get(who) != "ok":
            task["done"][who] = "ok"
            coins = int(task["coins"])
            if task.get("kid"):
                # A child's challenge: the coins come from the child who made it, as far as they go.
                giver = family.game(task["by"])
                coins = min(coins, int(giver["coins"]))
                giver["coins"] = int(giver["coins"]) - coins
            family.add_coins(who, coins)
            _party(state, "task", [who])
    elif action == "task_remove":
        _require_owner(family, user, msg, _task(state, msg))
        state["tasks"] = [t for t in state["tasks"] if t["id"] != msg.get("task")]
    elif action == "hunt_start":
        spaces = [str(s)[:80] for s in msg.get("spaces") or [] if s][:40]
        if not spaces:
            raise _bad("no_spaces")
        rnd = random.Random()
        n = max(3, min(MAX_STARS, int(msg.get("n") or 8)))
        who = [family.require_member(m)["id"] for m in msg.get("who") or []] or [m["id"] for m in family.members]
        state["hunt"] = {
            "id": uuid.uuid4().hex[:8],
            "by": member_id,
            "who": who,
            "stars": [
                {"id": f"s{i}", "space": rnd.choice(spaces), "x": rnd.randint(120, 880), "y": rnd.randint(330, 600)}
                for i in range(n)
            ],
            "found": {},
            "at": dt_util.now().isoformat(),
            "done": False,
        }
    elif action == "hunt_find":
        hunt = state.get("hunt")
        if not hunt or hunt["done"]:
            raise _bad("no_hunt")
        star = next((s for s in hunt["stars"] if s["id"] == msg.get("star")), None)
        if star is None:
            raise _bad("no_hunt")
        if star["id"] not in hunt["found"]:
            hunt["found"][star["id"]] = member_id
            if member_id not in hunt["who"]:
                hunt["who"].append(member_id)
            family.add_coins(member_id, COINS_STAR)
            _event(family, state, member_id, "star", star["id"])
            if len(hunt["found"]) >= len(hunt["stars"]):
                hunt["done"] = True
                finders = sorted(set(hunt["found"].values()))
                for who_id in finders:
                    family.add_coins(who_id, COINS_HUNT_DONE)
                _party(state, "hunt", finders)
    elif action == "hunt_stop":
        hunt = state.get("hunt")
        if hunt and hunt["by"] != (family.member_for_user(user) or {}).get("id") and not _is_parent(family, user):
            raise HomeAssistantError(translation_domain=DOMAIN, translation_key="not_allowed")
        state["hunt"] = None
    elif action == "hide":
        state["hide"] = {
            "id": uuid.uuid4().hex[:8],
            "by": member_id,
            "space": str(msg.get("space") or "")[:80],
            "x": int(msg.get("x") or 500),
            "y": int(msg.get("y") or 500),
            "thing": str(msg.get("thing") or "skattekiste")[:40],
            "at": dt_util.now().isoformat(),
            "found_by": None,
        }
    elif action == "seek":
        hide = state.get("hide")
        if not hide or hide["found_by"] or hide["by"] == member_id:
            raise _bad("no_hide")
        near = (
            str(msg.get("space") or "") == hide["space"]
            and (int(msg.get("x") or 0) - hide["x"]) ** 2 + (int(msg.get("y") or 0) - hide["y"]) ** 2 <= FIND_RADIUS**2
        )
        if near:
            hide["found_by"] = member_id
            family.add_coins(member_id, COINS_FOUND)
            family.add_coins(hide["by"], COINS_HIDDEN)
            _party(state, "hide", [member_id, hide["by"]])
    elif action == "hide_stop":
        hide = state.get("hide")
        me = family.member_for_user(user)
        if hide and not _is_parent(family, user) and (me is None or me["id"] != hide["by"]) and not hide["found_by"]:
            raise HomeAssistantError(translation_domain=DOMAIN, translation_key="not_allowed")
        state["hide"] = None
    family.changed()
    return state


def _task(state: dict[str, Any], msg: dict[str, Any]) -> dict[str, Any]:
    task: dict[str, Any] | None = next((t for t in state["tasks"] if t["id"] == msg.get("task")), None)
    if task is None:
        raise _bad("no_task")
    return task


def _event(family: Family, state: dict[str, Any], member_id: str, kind: str, key: str) -> None:
    """Something happened in the game that today's family mission may count."""
    day = _day(state)
    if day["paid"] or kind != day["kind"]:
        return
    if kind in ("visit", "star"):
        # Different places (or stars) count, not the same one again.
        if not key or key in day["keys"]:
            return
        day["keys"] = [*day["keys"], key[:80]][-20:]
    day["count"] = min(day["need"], int(day["count"]) + 1)
    if member_id not in day["who"]:
        day["who"].append(member_id)
    if day["count"] >= day["need"]:
        day["paid"] = True
        for who in day["who"]:
            family.add_coins(who, COINS_MISSION_DAY)
        _party(state, "day", list(day["who"]))
