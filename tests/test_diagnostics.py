"""Tests for diagnostics."""

from __future__ import annotations

from homeassistant.core import HomeAssistant
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.hverdagsro.diagnostics import async_get_config_entry_diagnostics


async def test_diagnostics(hass: HomeAssistant, init_integration: MockConfigEntry) -> None:
    result = await async_get_config_entry_diagnostics(hass, init_integration)
    assert result["setup_done"] is True
    assert result["missions"] == 3
    assert result["house"] == {"rooms": 0, "walls": 0, "areas": 0, "items": 0}
    names = [member["name"] for member in result["family"]]
    assert names == ["**REDACTED**"] * 3
    assert result["family"][1]["birthday"] == "**REDACTED**"
    assert result["family"][1]["role"] == "child"
