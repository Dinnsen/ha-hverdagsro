"""Hverdagsro: the family's everyday life in Home Assistant."""

from __future__ import annotations

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers import config_validation as cv, device_registry as dr
from homeassistant.helpers.storage import Store
from homeassistant.helpers.typing import ConfigType

from .const import DOMAIN, PLATFORMS, STORAGE_KEY, STORAGE_VERSION
from .family import Family, HverdagsroConfigEntry
from .panel import async_register_panel, async_unregister_panel
from .services import async_setup_services
from .websocket import async_register_websocket

CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Register the actions and the panel's websocket commands."""
    async_setup_services(hass)
    async_register_websocket(hass)
    return True


async def async_setup_entry(hass: HomeAssistant, entry: HverdagsroConfigEntry) -> bool:
    family = Family(hass, entry)
    await family.async_initialize()
    entry.runtime_data = family
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    entry.async_on_unload(entry.add_update_listener(_async_update_listener))
    await async_register_panel(hass, entry)
    return True


async def _async_update_listener(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """New options (panel title, icon, access) re-register the panel."""
    await async_register_panel(hass, entry)


async def async_unload_entry(hass: HomeAssistant, entry: HverdagsroConfigEntry) -> bool:
    unload_ok = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    if unload_ok:
        await entry.runtime_data.async_shutdown()
        if not [other for other in hass.config_entries.async_loaded_entries(DOMAIN) if other is not entry]:
            async_unregister_panel(hass)
    return unload_ok


async def async_remove_entry(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Remove the family's stored data with the integration."""
    await Store[dict[str, object]](hass, STORAGE_VERSION, STORAGE_KEY.format(entry_id=entry.entry_id)).async_remove()


async def async_remove_config_entry_device(
    hass: HomeAssistant, entry: HverdagsroConfigEntry, device: dr.DeviceEntry
) -> bool:
    """A child's device can be removed once the child is no longer in the family."""
    known = {f"{entry.entry_id}_{member['id']}" for member in entry.runtime_data.children}
    return not any(identifier[1] in known for identifier in device.identifiers if identifier[0] == DOMAIN)
