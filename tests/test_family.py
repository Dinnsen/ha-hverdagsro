"""Tests for the family's rules: members, missions, points and the shop."""

from __future__ import annotations

from datetime import date, timedelta

from freezegun.api import FrozenDateTimeFactory
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ServiceValidationError
import pytest
from pytest_homeassistant_custom_component.common import MockConfigEntry, async_fire_time_changed

from custom_components.hverdagsro.family import Family

from .conftest import TODAY


def _family(entry: MockConfigEntry) -> Family:
    family: Family = entry.runtime_data
    return family


async def test_members(hass: HomeAssistant, init_integration: MockConfigEntry) -> None:
    family = _family(init_integration)
    assert family.member("IDA")["id"] == "ida"
    assert family.member("person.ida")["id"] == "ida"
    assert family.member("nobody") is None
    assert [child["id"] for child in family.children] == ["ida", "oskar"]
    with pytest.raises(ServiceValidationError):
        family.require_member("nobody")
    assert family.member_for_user(None) is None
    assert family.can_manage(None) is False


async def test_missions_for_a_day(hass: HomeAssistant, init_integration: MockConfigEntry) -> None:
    family = _family(init_integration)
    # Monday: teeth for everyone, the bed for Ida; the toys are only at the weekend.
    assert [m["id"] for m in family.missions_for("ida")] == ["teeth", "bed"]
    assert [m["id"] for m in family.missions_for("oskar")] == ["teeth"]
    saturday = date(2026, 10, 31)
    assert [m["id"] for m in family.missions_for("oskar", saturday)] == ["teeth", "toys"]
    assert family.mission("Brush teeth")["id"] == "teeth"


async def test_points_never_go_below_zero(hass: HomeAssistant, init_integration: MockConfigEntry) -> None:
    family = _family(init_integration)
    assert await family.async_add_points("oskar", -500, "Oops") == 0
    assert family.data["ledger"][-1]["delta"] == -500
    # A mission without points gives none, and points can be off.
    family.data["modules"]["points"] = False
    await family.async_set_mission_done("teeth", "oskar", True)
    assert family.points("oskar") == 0
    assert family.is_done("teeth", "oskar")


async def test_ledger_is_capped(hass: HomeAssistant, init_integration: MockConfigEntry) -> None:
    family = _family(init_integration)
    for _ in range(320):
        await family.async_add_points("ida", 1, "")
    assert len(family.data["ledger"]) == 300


async def test_goal(hass: HomeAssistant, init_integration: MockConfigEntry) -> None:
    family = _family(init_integration)
    assert family.goal("ida")["id"] == "lego"
    assert family.goal("oskar")["id"] == "film"
    await family.async_add_points("ida", 500, "")
    assert family.goal("ida") is None
    await family.async_set_prefs(None, "ida", {"goal": "film"})
    assert family.goal("ida")["id"] == "film"


async def test_decide_without_enough_points(hass: HomeAssistant, init_integration: MockConfigEntry) -> None:
    family = _family(init_integration)
    request = await family.async_request_reward("ida", "film")
    await family.async_add_points("ida", -90, "")
    with pytest.raises(ServiceValidationError):
        await family.async_decide(request["id"], True)
    # A reward that was removed from the shop is declined.
    family.data["rewards"] = []
    await family.async_decide(request["id"], True)
    assert family.requests[-1]["status"] == "declined"


async def test_new_day_prunes_old_completions(
    hass: HomeAssistant, init_integration: MockConfigEntry, freezer: FrozenDateTimeFactory
) -> None:
    family = _family(init_integration)
    old = (date.fromisoformat(TODAY) - timedelta(days=60)).isoformat()
    family.data["completions"] = {old: {"teeth:ida": {}}, TODAY: {"teeth:ida": {}}}
    freezer.tick(timedelta(hours=8))
    async_fire_time_changed(hass)
    await hass.async_block_till_done()
    assert list(family.data["completions"]) == [TODAY]


async def test_unknown_section(hass: HomeAssistant, init_integration: MockConfigEntry) -> None:
    family = _family(init_integration)
    with pytest.raises(ServiceValidationError):
        await family.async_save_section("points", {})


async def test_homework_is_a_mission_without_points(hass: HomeAssistant, init_integration: MockConfigEntry) -> None:
    family = _family(init_integration)
    before = family.points("ida")
    assert await family.async_set_mission_done("lektie:2026-W44:dansk", "ida", True) is True
    assert family.is_done("lektie:2026-W44:dansk", "ida", date.fromisoformat(TODAY))
    assert family.points("ida") == before
    assert await family.async_set_mission_done("lektie:2026-W44:dansk", "ida", False) is False
    with pytest.raises(ServiceValidationError):
        await family.async_set_mission_done("nope", "ida", True)


async def test_two_homes(hass: HomeAssistant, init_integration: MockConfigEntry) -> None:
    """A child with two homes only gets this home's missions on the days they are here."""
    from custom_components.hverdagsro.family import at_home

    family = _family(init_integration)
    monday = date.fromisoformat(TODAY)
    plan = {"enabled": True, "start": TODAY, "cycle": [1] * 7 + [0] * 7, "except": {}}
    members = [{**m, "custody": plan} if m["id"] == "ida" else m for m in family.members]
    await family.async_save_section("family", members)
    await hass.async_block_till_done()
    family = hass.config_entries.async_get_entry(init_integration.entry_id).runtime_data
    ida = family.member("ida")
    assert at_home(ida, monday) is True
    assert at_home(ida, monday + timedelta(days=7)) is False
    assert at_home(ida, monday + timedelta(days=14)) is True
    assert at_home(ida, monday - timedelta(days=1)) is False
    assert at_home(family.member("oskar"), monday + timedelta(days=7)) is True
    assert at_home(None, monday) is True
    assert [m["id"] for m in family.missions_for("ida", monday)] == ["teeth", "bed"]
    assert family.missions_for("ida", monday + timedelta(days=7)) == []
    # A mission for the other home, and one for always.
    missions = [
        {**m, "where": "away"} if m["id"] == "bed" else {**m, "where": "always"} if m["id"] == "teeth" else m
        for m in family.data["missions"]
    ]
    await family.async_save_section("missions", missions)
    assert [m["id"] for m in family.missions_for("ida", monday)] == ["teeth"]
    assert [m["id"] for m in family.missions_for("ida", monday + timedelta(days=7))] == ["teeth", "bed"]
    # A single date the other way.
    members = [{**m, "custody": {**plan, "except": {TODAY: 0}}} if m["id"] == "ida" else m for m in family.members]
    await family.async_save_section("family", members)
    await hass.async_block_till_done()
    family = hass.config_entries.async_get_entry(init_integration.entry_id).runtime_data
    assert at_home(family.member("ida"), monday) is False
    broken = {**plan, "start": "not a date"}
    assert at_home({"custody": broken}, monday) is True
