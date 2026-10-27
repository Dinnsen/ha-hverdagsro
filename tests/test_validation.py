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
    assert validate_section("settings", {"skema_hide": "Pædagog i skolen"})["skema_hide"] == ["Pædagog i skolen"]
    assert validate_section("settings", {})["skema_hide"] == []


def test_routine_weeks() -> None:
    plan = {"ida": {"2": {"bring": {"who": "anna", "at": "08:15"}}}}
    assert validate_section("routines", {"weeks": {"2026-W44": plan}})["weeks"] == {"2026-W44": plan}
    assert "weeks" not in validate_section("routines", {})
    with pytest.raises(vol.Invalid):
        validate_section("routines", {"weeks": ["2026-W44"]})


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


def test_custody() -> None:
    member = {"id": "ida", "name": "Ida", "role": "child"}
    plan = {"enabled": True, "start": "2026-10-26", "cycle": [1, 1, 0, 0, 1, 1, 1], "except": {"2026-12-24": 1}}
    out = validate_section("family", [{**member, "custody": plan}])[0]["custody"]
    assert out["cycle"] == [1, 1, 0, 0, 1, 1, 1]
    assert out["except"] == {"2026-12-24": 1}
    assert out["here"] == "" and out["switch"] is None
    assert validate_section("family", [member])[0]["custody"] is None
    for bad in ({"cycle": []}, {"cycle": [2]}, {"cycle": [1] * 29}, {"except": {"x": 1}}, {"start": "nope"}):
        with pytest.raises(vol.Invalid):
            validate_section("family", [{**member, "custody": bad}])
    many = {f"2027-{m:02d}-{d:02d}": 1 for m in range(1, 13) for d in range(1, 20)}
    with pytest.raises(vol.Invalid):
        validate_section("family", [{**member, "custody": {"except": many}}])
    mission = {"id": "bed", "title": "Bed", "member": "ida"}
    assert validate_section("missions", [mission])[0]["where"] == "here"
    with pytest.raises(vol.Invalid):
        validate_section("missions", [{**mission, "where": "moon"}])


def test_game_gate() -> None:
    member = {"id": "ida", "name": "Ida", "role": "child"}
    assert validate_section("family", [member])[0]["game_gate"] is None
    out = validate_section("family", [{**member, "game_gate": {"mode": "earn"}}])[0]["game_gate"]
    assert out == {"mode": "earn", "per": 10, "base": 15}
    for bad in ({"mode": "never"}, {"per": 0}, {"base": 999}):
        with pytest.raises(vol.Invalid):
            validate_section("family", [{**member, "game_gate": bad}])


def test_nav() -> None:
    member = {"id": "ida", "name": "Ida", "role": "child"}
    nav = {"order": ["dag", "vaerelse"], "hide": ["skema"]}
    assert validate_section("family", [{**member, "nav": nav}])[0]["nav"] == nav
    assert validate_section("family", [member])[0]["nav"] is None
    with pytest.raises(vol.Invalid):
        validate_section("family", [{**member, "nav": {"order": ["x" * 40]}}])


def test_playroom() -> None:
    member = {"id": "ida", "name": "Ida", "role": "child"}
    room = {"wall": {"c": "rosa"}, "items": [{"id": "i1", "k": "bed", "x": 200, "y": 560}]}
    assert validate_section("family", [{**member, "playroom": room}])[0]["playroom"] == room
    assert validate_section("family", [member])[0]["playroom"] is None
    with pytest.raises(vol.Invalid):
        validate_section("family", [{**member, "playroom": "nope"}])
    with pytest.raises(vol.Invalid):
        validate_section("family", [{**member, "playroom": {"items": ["x"]}}])
    with pytest.raises(vol.Invalid):
        validate_section("family", [{**member, "playroom": {"items": [{"k": "x" * 1500}] * 140}}])

    # The room pages, as one member wants them (Tilpas rummet, kun for mig).
    prefs = {"stue": {"show": {"pic": False}, "fav": ["hygge"], "pin": True}}
    assert validate_section("family", [{**member, "room_prefs": prefs}])[0]["room_prefs"] == prefs
    assert validate_section("family", [member])[0]["room_prefs"] is None
    with pytest.raises(vol.Invalid):
        validate_section("family", [{**member, "room_prefs": {"stue": "nope"}}])
    with pytest.raises(vol.Invalid):
        validate_section("family", [{**member, "room_prefs": {f"r{i}": {"n": "x" * 300} for i in range(80)}}])
