"""Tests for the validation of what the panel saves."""

from __future__ import annotations

import pytest

from custom_components.hverdagsro.const import MAX_HOUSE_BYTES
from custom_components.hverdagsro.schema import vol
from custom_components.hverdagsro.validation import hhmm, ident, validate_section


def test_member_defaults() -> None:
    [member] = validate_section("family", [{"id": "ida", "name": " Ida ", "role": "child"}])
    assert member["name"] == "Ida"
    assert member["color"] == "#6E4AFF"
    assert member["institution"] == "none"
    assert member["person"] is None
    with pytest.raises(vol.Invalid):
        validate_section("family", [{"id": "Ida Hansen!", "name": "Ida", "role": "child"}])
    with pytest.raises(vol.Invalid):
        validate_section("family", [{"id": "ida", "name": "Ida", "role": "child", "color": "pink"}])
    with pytest.raises(vol.Invalid):
        validate_section("family", [{"id": "ida", "name": "Ida", "role": "child", "birthday": "soon"}])


def test_mission_and_reward() -> None:
    [mission] = validate_section("missions", [{"id": "m1", "title": "Teeth", "member": "all", "time": "07.30"}])
    assert mission["time"] == "07:30"
    assert mission["days"] == [0, 1, 2, 3, 4, 5, 6]
    with pytest.raises(vol.Invalid):
        validate_section("missions", [{"id": "m1", "title": "Teeth", "member": "all", "days": [7]}])
    [reward] = validate_section("rewards", [{"id": "r1", "title": "Film"}])
    assert reward["cost"] == 50
    assert reward["member"] == "all"


def test_helpers() -> None:
    assert ident(" Abc_1 ") == "abc_1"
    assert hhmm("07.30") == "07:30"
    assert hhmm("") is None
    with pytest.raises(vol.Invalid):
        hhmm("25:00")


def test_settings() -> None:
    settings = validate_section("settings", {})
    assert settings["language"] == "auto"
    assert settings["mission_reset"] == "00:00"
    settings = validate_section(
        "settings",
        {
            "calendars": "calendar.family",
            "waste": [{"entity": "sensor.bin"}],
            "anniversaries": {"wedding": "2014-08-09"},
        },
    )
    assert settings["calendars"] == ["calendar.family"]
    assert settings["waste"][0]["color"] == "#2F7D4F"
    with pytest.raises(vol.Invalid):
        validate_section("settings", {"language": "fr"})


def test_house() -> None:
    house = validate_section("house", {"rooms": [], "extra": 1})
    assert house == {"name": "", "rooms": [], "walls": [], "areas": [], "items": []}
    with pytest.raises(vol.Invalid):
        validate_section("house", [])
    with pytest.raises(vol.Invalid):
        validate_section("house", {"items": {}})
    with pytest.raises(vol.Invalid):
        validate_section("house", {"items": [{"name": "x" * MAX_HOUSE_BYTES}]})


def test_appliances_and_modules() -> None:
    [appliance] = validate_section("appliances", [{"id": "wash", "entity": "sensor.washer"}])
    assert appliance["kind"] == "other"
    assert validate_section("modules", {"music": False}) == {"music": False}
    with pytest.raises(vol.Invalid):
        validate_section("modules", {"spaceship": True})
    with pytest.raises(vol.Invalid):
        validate_section("appliances", [{"id": "a", "entity": "sensor.x"}, {"id": "a", "entity": "sensor.y"}])
