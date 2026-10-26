"""Diagnostics for Hverdagsro. Names, birthdays and people are redacted."""

from __future__ import annotations

from typing import Any

from homeassistant.components.diagnostics import async_redact_data
from homeassistant.core import HomeAssistant

from .const import REDACT_KEYS
from .family import HverdagsroConfigEntry


async def async_get_config_entry_diagnostics(hass: HomeAssistant, entry: HverdagsroConfigEntry) -> dict[str, Any]:
    family = entry.runtime_data
    data = family.data
    return {
        "options": dict(entry.options),
        "setup_done": data["setup_done"],
        "modules": data["modules"],
        "family": async_redact_data(data["family"], REDACT_KEYS),
        "settings": async_redact_data(data["settings"], ("anniversaries",)),
        "missions": len(data["missions"]),
        "rewards": len(data["rewards"]),
        "requests": len(family.requests),
        "house": {key: len(data["house"].get(key, [])) for key in ("rooms", "walls", "areas", "items")},
        "appliances": len(data["appliances"]),
        "days_with_completions": len(data["completions"]),
    }
