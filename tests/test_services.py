"""Tests for the actions."""

from __future__ import annotations

from datetime import date

from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ServiceValidationError
import pytest
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.hverdagsro.const import DOMAIN


async def test_add_points(hass: HomeAssistant, init_integration: MockConfigEntry) -> None:
    await hass.services.async_call(
        DOMAIN, "add_points", {"member": "Ida", "points": 15, "reason": "Helped"}, blocking=True
    )
    await hass.async_block_till_done()
    assert hass.states.get("sensor.ida_points").state == "115"
    entry = init_integration.runtime_data.data["ledger"][-1]
    assert (entry["member"], entry["delta"], entry["reason"]) == ("ida", 15, "Helped")

    with pytest.raises(ServiceValidationError):
        await hass.services.async_call(DOMAIN, "add_points", {"member": "nobody", "points": 1}, blocking=True)


async def test_complete_mission(hass: HomeAssistant, init_integration: MockConfigEntry) -> None:
    await hass.services.async_call(
        DOMAIN, "complete_mission", {"member": "oskar", "mission": "Brush teeth"}, blocking=True
    )
    await hass.async_block_till_done()
    assert hass.states.get("sensor.oskar_points").state == "25"
    await hass.services.async_call(
        DOMAIN,
        "complete_mission",
        {"member": "oskar", "mission": "toys", "date": "2026-10-31", "config_entry_id": init_integration.entry_id},
        blocking=True,
    )
    assert init_integration.runtime_data.is_done("toys", "oskar", date(2026, 10, 31))
