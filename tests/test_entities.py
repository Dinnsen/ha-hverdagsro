"""Tests for each child's points sensor and missions list."""

from __future__ import annotations

from homeassistant.components.todo import DOMAIN as TODO_DOMAIN
from homeassistant.core import HomeAssistant
from pytest_homeassistant_custom_component.common import MockConfigEntry


async def test_points_sensor(hass: HomeAssistant, init_integration: MockConfigEntry) -> None:
    state = hass.states.get("sensor.ida_points")
    assert state.state == "100"
    assert state.attributes["unit_of_measurement"] == "point"
    assert state.attributes["goal"] == "LEGO"
    assert state.attributes["goal_cost"] == 300
    assert state.attributes["missions_today"] == 2
    assert state.attributes["missions_done"] == 0
    assert state.attributes["pending_requests"] == 0

    await init_integration.runtime_data.async_request_reward("ida", "film")
    await hass.async_block_till_done()
    assert hass.states.get("sensor.ida_points").attributes["pending_requests"] == 1

    await init_integration.runtime_data.async_add_points("ida", 500, "")
    await hass.async_block_till_done()
    state = hass.states.get("sensor.ida_points")
    assert state.attributes["goal"] is None
    assert state.attributes["goal_cost"] is None


async def test_missions_todo(hass: HomeAssistant, init_integration: MockConfigEntry) -> None:
    assert hass.states.get("todo.ida_missions").state == "2"
    result = await hass.services.async_call(
        TODO_DOMAIN, "get_items", {}, target={"entity_id": "todo.ida_missions"}, blocking=True, return_response=True
    )
    items = result["todo.ida_missions"]["items"]
    assert [item["summary"] for item in items] == ["Brush teeth", "Make the bed"]
    assert items[0]["description"] == "+5"

    await hass.services.async_call(
        TODO_DOMAIN,
        "update_item",
        {"item": "bed", "status": "completed"},
        target={"entity_id": "todo.ida_missions"},
        blocking=True,
    )
    await hass.async_block_till_done()
    assert hass.states.get("todo.ida_missions").state == "1"
    assert hass.states.get("sensor.ida_points").state == "110"

    await hass.services.async_call(
        TODO_DOMAIN,
        "update_item",
        {"item": "Make the bed", "status": "needs_action"},
        target={"entity_id": "todo.ida_missions"},
        blocking=True,
    )
    await hass.async_block_till_done()
    assert hass.states.get("sensor.ida_points").state == "100"


async def test_entities_go_unavailable_when_the_child_leaves(
    hass: HomeAssistant, init_integration: MockConfigEntry
) -> None:
    family = init_integration.runtime_data
    family.data["family"] = [m for m in family.members if m["id"] != "oskar"]
    family._changed()
    await hass.async_block_till_done()
    assert hass.states.get("sensor.oskar_points").state == "unavailable"
