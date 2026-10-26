"""Messages to the family's phones (Beskeder til mig).

Each member can have a notify action (their phone in the Home Assistant app). Parents get messages about the
shop, missions, goals, who picks up today and the waste; children about their points and messages from their
parents. Each member turns the kinds off one by one (msg_off).
"""

from __future__ import annotations

from datetime import date, datetime, timedelta
import logging
from typing import Any

from homeassistant.core import CALLBACK_TYPE, HomeAssistant, callback
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers.event import async_track_time_change
from homeassistant.util import dt as dt_util

from .const import ROLE_CHILD, ROLE_PARENT
from .family import Family

_LOGGER = logging.getLogger(__name__)


class Notifier:
    """Sends the family's messages."""

    def __init__(self, hass: HomeAssistant, family: Family) -> None:
        self.hass = hass
        self.family = family
        self._unsubs: list[CALLBACK_TYPE] = []

    @callback
    def async_start(self) -> None:
        self.family.listeners.append(self._on_event)
        self._unsubs.append(async_track_time_change(self.hass, self._async_morning, hour=7, minute=0, second=0))
        self._unsubs.append(async_track_time_change(self.hass, self._async_evening, hour=19, minute=0, second=0))

    @callback
    def async_stop(self) -> None:
        if self._on_event in self.family.listeners:
            self.family.listeners.remove(self._on_event)
        for unsub in self._unsubs:
            unsub()
        self._unsubs.clear()

    # ------------------------------------------------------------------ who gets what

    def _wants(self, member: dict[str, Any], kind: str) -> bool:
        return bool(member.get("notify")) and kind not in member.get("msg_off", [])

    def _parents(self, kind: str) -> list[dict[str, Any]]:
        return [m for m in self.family.members if m["role"] == ROLE_PARENT and self._wants(m, kind)]

    @callback
    def _send(self, member: dict[str, Any], title: str, message: str) -> None:
        service = str(member["notify"]).split(".", 1)[1]
        if not self.hass.services.has_service("notify", service):
            _LOGGER.debug("No notify action %s for %s", service, member["id"])
            return
        self.hass.async_create_task(self._async_call(service, title, message), eager_start=True)

    async def _async_call(self, service: str, title: str, message: str) -> None:
        try:
            await self.hass.services.async_call(
                "notify", service, {"title": title, "message": message, "data": {"group": "hverdagsro"}}
            )
        except HomeAssistantError as err:
            _LOGGER.warning("Hverdagsro could not send a message with notify.%s: %s", service, err)

    # ------------------------------------------------------------------ events from the family

    @callback
    def _on_event(self, kind: str, data: dict[str, Any]) -> None:
        member = self.family.member(data.get("member", ""))
        if member is None:
            return
        name = member["name"]
        if kind == "shop":
            reward = data["reward"]
            for parent in self._parents("shop"):
                self._send(parent, "Shoppen", f"{name} vil købe {reward['title']} for {reward['cost']} point")
        elif kind == "mission":
            for parent in self._parents("mission"):
                self._send(parent, "Missioner", f"{name} har klaret {data['mission']['title']}")
        elif kind == "goal":
            for parent in self._parents("goal"):
                self._send(parent, "Et mål er nået", f"{name} har point nok til {data['reward']['title']}")
            if member["role"] == ROLE_CHILD and self._wants(member, "points"):
                self._send(member, "Dit mål", f"Du har point nok til {data['reward']['title']}!")
        elif kind == "points":
            if member["role"] == ROLE_CHILD and self._wants(member, "points") and data["delta"]:
                sign = "+" if data["delta"] > 0 else ""
                self._send(member, "Dine point", f"{sign}{data['delta']} point · du har {data['points']}")
        elif kind == "pin" and self._wants(member, "pin"):
            self._send(member, "Besked fra far eller mor", data["text"])

    # ------------------------------------------------------------------ every day

    async def _async_morning(self, now: datetime) -> None:
        """Who brings and picks up the children today (Hent og bring)."""
        if not self.family.data["settings"].get("pickup_reminder", True):
            return
        lines: dict[str, list[str]] = {}
        weekday = str(now.isoweekday())
        for kid_id, plan in self.family.data["routines"].get("pickups", {}).items():
            kid = self.family.member(kid_id)
            day = plan.get(weekday) if isinstance(plan, dict) else None
            if kid is None or not isinstance(day, dict):
                continue
            for part, verb in (("bring", "bringer"), ("hent", "henter")):
                step = day.get(part) or {}
                who = self.family.member(str(step.get("who", "")))
                if who is not None:
                    at = f" kl. {step['at']}" if step.get("at") else ""
                    lines.setdefault(who["id"], []).append(f"Du {verb} {kid['name']}{at}")
        for member_id, text in lines.items():
            member = self.family.member(member_id)
            if member is not None and self._wants(member, "pickup"):
                self._send(member, "Hent og bring i dag", "\n".join(text))

    async def _async_evening(self, now: datetime) -> None:
        """The waste is collected tomorrow: put the bin out."""
        tomorrow = (dt_util.as_local(now) + timedelta(days=1)).date()
        bins = [w for w in self.family.data["settings"].get("waste", []) if self._collected_on(w["entity"], tomorrow)]
        if not bins:
            return
        names = " og ".join(w.get("name") or self._name(w["entity"]) for w in bins)
        for parent in self._parents("waste"):
            self._send(parent, "Skrald", f"{names} bliver tømt i morgen. Husk at stille den ud.")

    def _name(self, entity_id: str) -> str:
        state = self.hass.states.get(entity_id)
        return str(state.attributes.get("friendly_name", entity_id)) if state else entity_id

    def _collected_on(self, entity_id: str, day: date) -> bool:
        state = self.hass.states.get(entity_id)
        if state is None:
            return False
        value = state.state
        if entity_id.startswith("calendar."):
            start = state.attributes.get("start_time")
            return bool(start) and str(start)[:10] == day.isoformat()
        if len(value) >= 10 and value[4] == "-":
            return value[:10] == day.isoformat()
        if value.isdigit():
            return int(value) == 1
        return False
