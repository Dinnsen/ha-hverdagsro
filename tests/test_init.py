"""Tests for setting up, unloading and removing Hverdagsro."""

from __future__ import annotations

from typing import Any
from unittest.mock import AsyncMock, MagicMock

from homeassistant.config_entries import ConfigEntryState
from homeassistant.core import HomeAssistant
from homeassistant.helpers import device_registry as dr, entity_registry as er
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.hverdagsro import async_remove_config_entry_device
from custom_components.hverdagsro.const import DOMAIN, STORAGE_KEY

from .conftest import ENTRY_ID


async def test_setup_and_unload(
    hass: HomeAssistant, init_integration: MockConfigEntry, mock_panel: tuple[AsyncMock, MagicMock]
) -> None:
    register, unregister = mock_panel
    assert init_integration.state is ConfigEntryState.LOADED
    register.assert_called_once()

    # Each child gets points and a missions list; parents get nothing.
    entities = er.async_entries_for_config_entry(er.async_get(hass), ENTRY_ID)
    assert sorted(entity.entity_id for entity in entities) == [
        "sensor.ida_points",
        "sensor.oskar_points",
        "todo.ida_missions",
        "todo.oskar_missions",
    ]
    assert hass.states.get("sensor.ida_points").state == "100"

    # Changing the options registers the panel again.
    hass.config_entries.async_update_entry(init_integration, options={"panel_title": "Familien"})
    await hass.async_block_till_done()
    assert register.call_count == 2

    assert await hass.config_entries.async_unload(init_integration.entry_id)
    await hass.async_block_till_done()
    assert init_integration.state is ConfigEntryState.NOT_LOADED
    unregister.assert_called_once()


async def test_new_family_starts_empty(
    hass: HomeAssistant, now: Any, mock_config_entry: MockConfigEntry, hass_storage: dict[str, Any]
) -> None:
    mock_config_entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(mock_config_entry.entry_id)
    await hass.async_block_till_done()
    family = mock_config_entry.runtime_data
    assert family.data["setup_done"] is False
    assert family.data["family"] == []
    assert family.data["modules"]["missions"] is True
    assert er.async_entries_for_config_entry(er.async_get(hass), ENTRY_ID) == []


async def test_old_storage_gets_new_defaults(
    hass: HomeAssistant, now: Any, mock_config_entry: MockConfigEntry, hass_storage: dict[str, Any]
) -> None:
    key = STORAGE_KEY.format(entry_id=ENTRY_ID)
    hass_storage[key] = {
        "version": 1,
        "minor_version": 1,
        "key": key,
        "data": {"setup_done": True, "modules": {"music": False}, "unknown": 1},
    }
    mock_config_entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(mock_config_entry.entry_id)
    family = mock_config_entry.runtime_data
    assert family.data["modules"]["music"] is False
    assert family.data["modules"]["missions"] is True
    assert "unknown" not in family.data
    assert family.data["requests"] == []


async def test_remove_entry_removes_the_stored_family(
    hass: HomeAssistant, init_integration: MockConfigEntry, hass_storage: dict[str, Any]
) -> None:
    await hass.config_entries.async_remove(init_integration.entry_id)
    await hass.async_block_till_done()
    assert STORAGE_KEY.format(entry_id=ENTRY_ID) not in hass_storage


async def test_remove_device(hass: HomeAssistant, init_integration: MockConfigEntry) -> None:
    registry = dr.async_get(hass)
    devices = dr.async_entries_for_config_entry(registry, ENTRY_ID)
    ida = next(device for device in devices if (DOMAIN, f"{ENTRY_ID}_ida") in device.identifiers)
    assert not await async_remove_config_entry_device(hass, init_integration, ida)

    gone = registry.async_get_or_create(config_entry_id=ENTRY_ID, identifiers={(DOMAIN, f"{ENTRY_ID}_old")})
    assert await async_remove_config_entry_device(hass, init_integration, gone)
