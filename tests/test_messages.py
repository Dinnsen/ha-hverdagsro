"""Tests for the messages to the family's phones."""

from __future__ import annotations

from datetime import timedelta

from freezegun.api import FrozenDateTimeFactory
from homeassistant.core import HomeAssistant, ServiceCall
from pytest_homeassistant_custom_component.common import MockConfigEntry, async_fire_time_changed


async def _phones(hass: HomeAssistant, init_integration: MockConfigEntry) -> list[ServiceCall]:
    calls: list[ServiceCall] = []

    async def record(call: ServiceCall) -> None:
        calls.append(call)

    hass.services.async_register("notify", "anna_phone", record)
    hass.services.async_register("notify", "ida_phone", record)
    family = init_integration.runtime_data
    members = [{**m, "notify": f"notify.{m['id']}_phone"} if m["id"] in ("anna", "ida") else m for m in family.members]
    await family.async_save_section("family", members)
    await hass.async_block_till_done()
    return calls


async def test_messages_about_the_shop_missions_and_points(
    hass: HomeAssistant, init_integration: MockConfigEntry
) -> None:
    calls = await _phones(hass, init_integration)
    family = hass.config_entries.async_get_entry(init_integration.entry_id).runtime_data

    await family.async_request_reward("ida", "film")
    await family.async_set_mission_done("bed", "ida", True)
    await hass.async_block_till_done()
    texts = [(c.service, c.data["message"]) for c in calls]
    assert ("anna_phone", "Ida vil købe Pick the film for 40 point") in texts
    assert ("anna_phone", "Ida har klaret Make the bed") in texts
    assert ("ida_phone", "+10 point · du har 110") in texts

    # Ida reaches her goal.
    calls.clear()
    await family.async_add_points("ida", 200, "")
    await hass.async_block_till_done()
    assert ("anna_phone", "Ida har point nok til LEGO") in [(c.service, c.data["message"]) for c in calls]

    # A message from a parent, and messages turned off.
    calls.clear()
    await family.async_save_section("pins", {"ida": {"text": "Husk regntøj"}})
    await hass.async_block_till_done()
    assert [c.data["message"] for c in calls] == ["Husk regntøj"]
    calls.clear()
    await family.async_set_prefs(None, "anna", {"msg_off": ["mission"]})
    await family.async_set_mission_done("teeth", "ida", True)
    await hass.async_block_till_done()
    assert [c.service for c in calls] == ["ida_phone"]


async def test_pickups_in_the_morning_and_waste_in_the_evening(
    hass: HomeAssistant, init_integration: MockConfigEntry, freezer: FrozenDateTimeFactory
) -> None:
    calls = await _phones(hass, init_integration)
    family = hass.config_entries.async_get_entry(init_integration.entry_id).runtime_data
    # Tuesday: Anna brings Ida at 07:45 and Mads (not in the family) picks up.
    await family.async_save_section(
        "routines",
        {"pickups": {"ida": {"2": {"bring": {"who": "anna", "at": "07:45"}, "hent": {"who": "mormor", "at": "15"}}}}},
    )
    hass.states.async_set("sensor.restaffald", "2026-10-28")
    settings = {**family.data["settings"], "waste": [{"entity": "sensor.restaffald", "name": "Restaffald"}]}
    await family.async_save_section("settings", settings)

    freezer.tick(timedelta(hours=2, minutes=1))  # Monday 19:01: nothing is collected on Tuesday
    async_fire_time_changed(hass)
    await hass.async_block_till_done()
    assert calls == []
    freezer.tick(timedelta(hours=12))  # Tuesday 07:01
    async_fire_time_changed(hass)
    await hass.async_block_till_done()
    assert [(c.service, c.data["message"]) for c in calls] == [("anna_phone", "Du bringer Ida kl. 07:45")]

    calls.clear()
    freezer.tick(timedelta(minutes=14))  # Tuesday 07:15: half an hour before
    async_fire_time_changed(hass)
    await hass.async_block_till_done()
    assert [c.data["message"] for c in calls] == ["Du bringer Ida kl. 07:45"]
    assert calls[0].data["title"] == "Om 30 minutter"

    calls.clear()
    freezer.tick(timedelta(hours=11, minutes=46))  # Tuesday 19:01
    async_fire_time_changed(hass)
    await hass.async_block_till_done()
    assert [c.data["message"] for c in calls] == ["Restaffald bliver tømt i morgen. Husk at stille den ud."]
