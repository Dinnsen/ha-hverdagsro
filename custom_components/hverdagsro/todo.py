"""Todo lists for Hverdagsro: each child's missions today. Ticking one off gives its points."""

from __future__ import annotations

from typing import Any

from homeassistant.components.todo import TodoItem, TodoItemStatus, TodoListEntity, TodoListEntityFeature
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from .entity import HverdagsroEntity
from .family import Family, HverdagsroConfigEntry

PARALLEL_UPDATES = 0


async def async_setup_entry(
    hass: HomeAssistant, entry: HverdagsroConfigEntry, async_add_entities: AddConfigEntryEntitiesCallback
) -> None:
    family = entry.runtime_data
    async_add_entities(MissionsTodo(family, child) for child in family.children)


class MissionsTodo(HverdagsroEntity, TodoListEntity):
    """Today's missions for one child."""

    _attr_supported_features = TodoListEntityFeature.UPDATE_TODO_ITEM

    def __init__(self, family: Family, member: dict[str, Any]) -> None:
        super().__init__(family, member, "missions")

    @property
    def todo_items(self) -> list[TodoItem]:
        items = []
        for mission in self.family.missions_for(self.member_id):
            done = self.family.is_done(mission["id"], self.member_id)
            title = f"{mission['emoji']} {mission['title']}".strip()
            items.append(
                TodoItem(
                    uid=mission["id"],
                    summary=title,
                    status=TodoItemStatus.COMPLETED if done else TodoItemStatus.NEEDS_ACTION,
                    description=f"+{mission['points']}" if mission["points"] else None,
                )
            )
        return items

    async def async_update_todo_item(self, item: TodoItem) -> None:
        if item.uid is None:
            return
        await self.family.async_set_mission_done(item.uid, self.member_id, item.status == TodoItemStatus.COMPLETED)
