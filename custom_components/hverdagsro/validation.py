"""Validation of what the panel saves. Everything is checked here before it is stored."""

from __future__ import annotations

from datetime import date
import json
import re
from typing import Any

from homeassistant.helpers import config_validation as cv

from .const import (
    EVERYONE,
    INSTITUTIONS,
    MAX_HOUSE_BYTES,
    MAX_MEMBERS,
    MAX_MISSIONS,
    MAX_REWARDS,
    MODULES,
    ROLES,
    SKIN_MODES,
    SKINS,
)
from .schema import vol

_ID = re.compile(r"^[a-z0-9][a-z0-9_-]{0,47}$")
_HEX = re.compile(r"^#[0-9a-fA-F]{6}$")
_HHMM = re.compile(r"^([01]\d|2[0-3])[:.][0-5]\d$")


def ident(value: Any) -> str:
    """A short, safe id: lowercase letters, digits, - and _."""
    text = str(value).strip().lower()
    if not _ID.match(text):
        raise vol.Invalid("invalid id")
    return text


def hex_color(value: Any) -> str:
    text = str(value).strip()
    if not _HEX.match(text):
        raise vol.Invalid("expected a colour like #6E4AFF")
    return text.upper()


def iso_date(value: Any) -> str | None:
    if value in (None, ""):
        return None
    try:
        return date.fromisoformat(str(value)).isoformat()
    except ValueError as err:
        raise vol.Invalid("expected a date like 2016-01-02") from err


def hhmm(value: Any) -> str | None:
    if value in (None, ""):
        return None
    text = str(value).strip()
    if not _HHMM.match(text):
        raise vol.Invalid("expected a time like 07:30")
    return text.replace(".", ":")


def text(max_len: int, min_len: int = 0) -> Any:
    return vol.All(cv.string, vol.Strip, vol.Length(min=min_len, max=max_len))


def optional_entity(value: Any) -> str | None:
    if value in (None, ""):
        return None
    result: str = cv.entity_id(value)
    return result


def entity_list(value: Any) -> list[str]:
    return [cv.entity_id(item) for item in cv.ensure_list(value)][:40]


MEMBER = vol.Schema(
    {
        vol.Required("id"): ident,
        vol.Required("name"): text(40, 1),
        vol.Required("role"): vol.In(ROLES),
        vol.Optional("person", default=None): optional_entity,
        vol.Optional("color", default="#6E4AFF"): hex_color,
        vol.Optional("birthday", default=None): iso_date,
        vol.Optional("institution", default="none"): vol.In(INSTITUTIONS),
        vol.Optional("skin", default="standard"): vol.In(SKINS),
        vol.Optional("mode", default="auto"): vol.In(SKIN_MODES),
        vol.Optional("calendar", default=None): optional_entity,
        vol.Optional("device_tracker", default=None): optional_entity,
    }
)

MISSION = vol.Schema(
    {
        vol.Required("id"): ident,
        vol.Required("title"): text(80, 1),
        vol.Required("member"): ident,
        vol.Optional("points", default=5): vol.All(vol.Coerce(int), vol.Range(min=0, max=1000)),
        vol.Optional("days", default=[0, 1, 2, 3, 4, 5, 6]): vol.All(
            cv.ensure_list, [vol.All(vol.Coerce(int), vol.Range(min=0, max=6))], vol.Unique()
        ),
        vol.Optional("time", default=None): hhmm,
        vol.Optional("emoji", default=""): text(8),
        vol.Optional("part", default="day"): vol.In(("morning", "day", "afternoon", "evening")),
    }
)

REWARD = vol.Schema(
    {
        vol.Required("id"): ident,
        vol.Required("title"): text(60, 1),
        vol.Optional("member", default=EVERYONE): ident,
        vol.Optional("cost", default=50): vol.All(vol.Coerce(int), vol.Range(min=1, max=100000)),
        vol.Optional("emoji", default="🎁"): text(8),
    }
)

WASTE = vol.Schema(
    {
        vol.Required("entity"): cv.entity_id,
        vol.Optional("name", default=""): text(30),
        vol.Optional("color", default="#2F7D4F"): hex_color,
    }
)

SETTINGS = vol.Schema(
    {
        vol.Optional("weather", default=None): optional_entity,
        vol.Optional("calendars", default=[]): entity_list,
        vol.Optional("todo", default=[]): entity_list,
        vol.Optional("meals_calendar", default=None): optional_entity,
        vol.Optional("alarm", default=None): optional_entity,
        vol.Optional("media", default=[]): entity_list,
        vol.Optional("cameras", default=[]): entity_list,
        vol.Optional("price", default=None): optional_entity,
        vol.Optional("waste", default=[]): vol.All(cv.ensure_list, [WASTE], vol.Length(max=8)),
        vol.Optional("decor", default={}): {vol.Coerce(str): cv.boolean},
        vol.Optional("decor_days", default={}): {vol.Coerce(str): vol.All(vol.Coerce(int), vol.Range(min=0, max=60))},
        vol.Optional("anniversaries", default={}): {vol.In(("together", "wedding")): iso_date},
        vol.Optional("mission_reset", default="00:00"): hhmm,
        vol.Optional("language", default="auto"): vol.In(("auto", "da", "en")),
        vol.Optional("home_name", default=""): text(40),
    }
)

APPLIANCE = vol.Schema(
    {
        vol.Required("id"): ident,
        vol.Required("entity"): cv.entity_id,
        vol.Optional("name", default=""): text(40),
        vol.Optional("kind", default="other"): vol.In(
            (
                "washer",
                "dryer",
                "dish",
                "oven",
                "hob",
                "coffee",
                "fridge",
                "freezer",
                "vacuum",
                "mower",
                "vent",
                "other",
            )
        ),
        vol.Optional("controls", default=[]): entity_list,
    }
)


def _unique_ids(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    seen: set[str] = set()
    for item in items:
        if item["id"] in seen:
            raise vol.Invalid(f"duplicate id {item['id']}")
        seen.add(item["id"])
    return items


def _house(value: Any) -> dict[str, Any]:
    if not isinstance(value, dict):
        raise vol.Invalid("expected an object")
    for key in ("rooms", "walls", "areas", "items"):
        if not isinstance(value.get(key, []), list):
            raise vol.Invalid(f"{key} must be a list")
    if len(json.dumps(value, separators=(",", ":"))) > MAX_HOUSE_BYTES:
        raise vol.Invalid("the drawing is too large")
    return {
        "name": str(value.get("name", ""))[:60],
        "rooms": value.get("rooms", []),
        "walls": value.get("walls", []),
        "areas": value.get("areas", []),
        "items": value.get("items", []),
    }


SECTION_SCHEMAS: dict[str, Any] = {
    "family": vol.All(cv.ensure_list, [MEMBER], vol.Length(max=MAX_MEMBERS), _unique_ids),
    "modules": vol.Schema({vol.In(MODULES): cv.boolean}),
    "settings": SETTINGS,
    "missions": vol.All(cv.ensure_list, [MISSION], vol.Length(max=MAX_MISSIONS), _unique_ids),
    "rewards": vol.All(cv.ensure_list, [REWARD], vol.Length(max=MAX_REWARDS), _unique_ids),
    "house": _house,
    "appliances": vol.All(cv.ensure_list, [APPLIANCE], vol.Length(max=80), _unique_ids),
}


def validate_section(section: str, value: Any) -> Any:
    """Validate one section; raises vol.Invalid with a readable message."""
    return SECTION_SCHEMAS[section](value)
