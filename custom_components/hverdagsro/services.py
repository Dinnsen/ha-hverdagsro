"""Actions for Hverdagsro."""

from __future__ import annotations

from homeassistant.core import HomeAssistant, ServiceCall, callback
from homeassistant.helpers import config_validation as cv, service

from .const import (
    ATTR_CONFIG_ENTRY_ID,
    ATTR_DATE,
    ATTR_MEMBER,
    ATTR_MISSION,
    ATTR_POINTS,
    ATTR_REASON,
    DOMAIN,
    SERVICE_ADD_POINTS,
    SERVICE_COMPLETE_MISSION,
)
from .family import Family, HverdagsroConfigEntry
from .schema import vol

POINTS_SCHEMA = vol.Schema(
    {
        vol.Optional(ATTR_CONFIG_ENTRY_ID): cv.string,
        vol.Required(ATTR_MEMBER): cv.string,
        vol.Required(ATTR_POINTS): vol.All(vol.Coerce(int), vol.Range(min=-100000, max=100000)),
        vol.Optional(ATTR_REASON, default=""): cv.string,
    }
)
MISSION_SCHEMA = vol.Schema(
    {
        vol.Optional(ATTR_CONFIG_ENTRY_ID): cv.string,
        vol.Required(ATTR_MISSION): cv.string,
        vol.Required(ATTR_MEMBER): cv.string,
        vol.Optional(ATTR_DATE): cv.date,
    }
)


def _family(call: ServiceCall) -> Family:
    entry: HverdagsroConfigEntry = service.async_get_config_entry(
        call.hass, DOMAIN, call.data.get(ATTR_CONFIG_ENTRY_ID)
    )
    return entry.runtime_data


async def _async_add_points(call: ServiceCall) -> None:
    await _family(call).async_add_points(call.data[ATTR_MEMBER], call.data[ATTR_POINTS], call.data[ATTR_REASON])


async def _async_complete_mission(call: ServiceCall) -> None:
    family = _family(call)
    member = family.require_member(call.data[ATTR_MEMBER])
    await family.async_set_mission_done(call.data[ATTR_MISSION], member["id"], True, None, call.data.get(ATTR_DATE))


@callback
def async_setup_services(hass: HomeAssistant) -> None:
    hass.services.async_register(DOMAIN, SERVICE_ADD_POINTS, _async_add_points, schema=POINTS_SCHEMA)
    hass.services.async_register(DOMAIN, SERVICE_COMPLETE_MISSION, _async_complete_mission, schema=MISSION_SCHEMA)
