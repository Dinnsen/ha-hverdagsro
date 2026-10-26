"""Sensors for Hverdagsro: each child's points."""

from __future__ import annotations

from typing import Any

from homeassistant.components.sensor import SensorEntity, SensorStateClass
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from .entity import HverdagsroEntity
from .family import Family, HverdagsroConfigEntry

PARALLEL_UPDATES = 0


async def async_setup_entry(
    hass: HomeAssistant, entry: HverdagsroConfigEntry, async_add_entities: AddConfigEntryEntitiesCallback
) -> None:
    family = entry.runtime_data
    async_add_entities(PointsSensor(family, child) for child in family.children)


class PointsSensor(HverdagsroEntity, SensorEntity):
    """How many points the child has, with the next goal in the shop."""

    _attr_state_class = SensorStateClass.TOTAL
    _attr_native_unit_of_measurement = "point"

    def __init__(self, family: Family, member: dict[str, Any]) -> None:
        super().__init__(family, member, "points")

    @property
    def native_value(self) -> int:
        return self.family.points(self.member_id)

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        goal = self.family.goal(self.member_id)
        today = self.family.missions_for(self.member_id)
        return {
            "goal": goal["title"] if goal else None,
            "goal_cost": goal["cost"] if goal else None,
            "missions_today": len(today),
            "missions_done": sum(1 for m in today if self.family.is_done(m["id"], self.member_id)),
            "pending_requests": sum(
                1 for r in self.family.requests if r["member"] == self.member_id and r["status"] == "pending"
            ),
        }
