"""Fixtures for Hverdagsro tests."""

from __future__ import annotations

from collections.abc import AsyncGenerator, Generator
from datetime import datetime
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

from freezegun.api import FrozenDateTimeFactory
from homeassistant.config_entries import ConfigEntryState
from homeassistant.core import HomeAssistant
from homeassistant.util import dt as dt_util
import pytest
from pytest_homeassistant_custom_component.common import MockConfigEntry, MockUser

from custom_components.hverdagsro.const import DOMAIN, STORAGE_KEY, STORAGE_VERSION
from custom_components.hverdagsro.family import default_data

ENTRY_ID = "hverdagsro_entry"
# Monday 26 October 2026, 17:00 in Copenhagen.
NOW = "2026-10-26T17:00:00+01:00"
TODAY = "2026-10-26"

PARENT = {
    "id": "anna",
    "name": "Anna",
    "role": "parent",
    "person": "person.anna",
    "color": "#EE5E52",
    "birthday": "1988-03-14",
    "institution": "none",
    "skin": "standard",
    "mode": "auto",
    "calendar": None,
    "device_tracker": None,
}
CHILD = {**PARENT, "id": "ida", "name": "Ida", "role": "child", "person": "person.ida", "color": "#8B5CF6"}
CHILD.update({"birthday": "2017-10-29", "institution": "skole"})
SIBLING = {**CHILD, "id": "oskar", "name": "Oskar", "person": None, "birthday": "2021-06-20"}
SIBLING["institution"] = "bornehave"
EVERY_DAY = [0, 1, 2, 3, 4, 5, 6]
MISSIONS = [
    {"id": "teeth", "title": "Brush teeth", "member": "all", "points": 5, "days": EVERY_DAY},
    {"id": "bed", "title": "Make the bed", "member": "ida", "points": 10, "days": [0, 1, 2, 3, 4]},
    {"id": "toys", "title": "Tidy the toys", "member": "oskar", "points": 10, "days": [5, 6]},
]
MISSIONS = [{"time": None, "emoji": "", "part": "day", **mission} for mission in MISSIONS]
REWARDS = [
    {"id": "film", "title": "Pick the film", "member": "all", "cost": 40, "emoji": "🎬"},
    {"id": "lego", "title": "LEGO", "member": "ida", "cost": 300, "emoji": "🧱"},
]


def stored_family(**extra: Any) -> dict[str, Any]:
    """A family that has finished the guide."""
    data = default_data()
    data.update(
        {
            "setup_done": True,
            "family": [PARENT, CHILD, SIBLING],
            "missions": MISSIONS,
            "rewards": REWARDS,
            "points": {"ida": 100, "oskar": 20},
        }
    )
    data.update(extra)
    return data


@pytest.fixture(autouse=True)
def auto_enable_custom_integrations(enable_custom_integrations: None) -> None:
    """Allow loading custom_components in every test."""


@pytest.fixture(autouse=True)
def skip_panel_dependencies(hass: HomeAssistant) -> None:
    """The sidebar panel needs the real frontend; mark it as loaded instead."""
    hass.config.components.update({"frontend", "image_upload", "panel_custom"})


@pytest.fixture(autouse=True)
def mock_panel() -> Generator[tuple[AsyncMock, MagicMock]]:
    """Don't serve the panel files in tests (that needs the real frontend)."""
    with (
        patch("custom_components.hverdagsro.async_register_panel") as register,
        patch("custom_components.hverdagsro.async_unregister_panel") as unregister,
    ):
        yield register, unregister


@pytest.fixture
async def now(hass: HomeAssistant, freezer: FrozenDateTimeFactory) -> datetime:
    await hass.config.async_set_time_zone("Europe/Copenhagen")
    moment = dt_util.parse_datetime(NOW)
    assert moment is not None
    freezer.move_to(moment)
    return moment


@pytest.fixture
def stored(hass_storage: dict[str, Any]) -> dict[str, Any]:
    """The family in .storage before Hverdagsro starts."""
    data = stored_family()
    hass_storage[STORAGE_KEY.format(entry_id=ENTRY_ID)] = {
        "version": STORAGE_VERSION,
        "minor_version": 1,
        "key": STORAGE_KEY.format(entry_id=ENTRY_ID),
        "data": data,
    }
    return data


@pytest.fixture
def mock_config_entry() -> MockConfigEntry:
    return MockConfigEntry(domain=DOMAIN, title="Hverdagsro", entry_id=ENTRY_ID, data={}, options={})


@pytest.fixture
def people(hass: HomeAssistant, hass_admin_user: MockUser, hass_read_only_user: MockUser) -> None:
    """Anna is the administrator; Ida has her own (non-admin) user; Oskar has none."""
    hass.states.async_set("person.anna", "home", {"friendly_name": "Anna", "user_id": hass_admin_user.id})
    hass.states.async_set("person.ida", "home", {"friendly_name": "Ida", "user_id": hass_read_only_user.id})


@pytest.fixture
async def init_integration(
    hass: HomeAssistant, now: datetime, stored: dict[str, Any], people: None, mock_config_entry: MockConfigEntry
) -> AsyncGenerator[MockConfigEntry]:
    mock_config_entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(mock_config_entry.entry_id)
    await hass.async_block_till_done()
    yield mock_config_entry
    if mock_config_entry.state is ConfigEntryState.LOADED:
        await hass.config_entries.async_unload(mock_config_entry.entry_id)
        await hass.async_block_till_done()
