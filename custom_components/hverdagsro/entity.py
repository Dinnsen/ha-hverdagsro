"""Base entity for Hverdagsro: one device per child."""

from __future__ import annotations

from typing import Any

from homeassistant.core import callback
from homeassistant.helpers.device_registry import DeviceEntryType, DeviceInfo
from homeassistant.helpers.entity import Entity

from .const import DOCS_URL, DOMAIN, MANUFACTURER
from .family import Family


class HverdagsroEntity(Entity):
    """An entity of one family member; its name comes from the translation key."""

    _attr_has_entity_name = True
    _attr_should_poll = False

    def __init__(self, family: Family, member: dict[str, Any], key: str) -> None:
        self.family = family
        self.member_id: str = member["id"]
        self._attr_translation_key = key
        self._attr_unique_id = f"{family.entry.entry_id}_{member['id']}_{key}"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, f"{family.entry.entry_id}_{member['id']}")},
            name=member["name"],
            manufacturer=MANUFACTURER,
            model="Barn",
            entry_type=DeviceEntryType.SERVICE,
            configuration_url=DOCS_URL,
        )

    @property
    def member(self) -> dict[str, Any] | None:
        return self.family.member(self.member_id)

    @property
    def available(self) -> bool:
        return self.member is not None

    async def async_added_to_hass(self) -> None:
        self.async_on_remove(self.family.subscribe(self._handle_update))

    @callback
    def _handle_update(self) -> None:
        self.async_write_ha_state()
