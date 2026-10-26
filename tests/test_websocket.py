"""Tests for the panel's websocket commands."""

from __future__ import annotations

from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.setup import async_setup_component
from pytest_homeassistant_custom_component.common import MockConfigEntry, MockUser
from pytest_homeassistant_custom_component.typing import WebSocketGenerator

from custom_components.hverdagsro.const import DOMAIN

from .conftest import CHILD, PARENT, TODAY

CLIENT_ID = "https://example.com/app"


async def _ws(client: Any, msg_id: int, **msg: Any) -> dict[str, Any]:
    await client.send_json({"id": msg_id, **msg})
    while True:
        result: dict[str, Any] = await client.receive_json()
        if result.get("id") == msg_id and result.get("type") == "result":
            return result


async def _tablet_token(hass: HomeAssistant) -> str:
    """A user that isn't a family member and isn't an administrator: the kitchen tablet."""
    user = MockUser(name="Tablet").add_to_hass(hass)
    refresh = await hass.auth.async_create_refresh_token(user, CLIENT_ID)
    return hass.auth.async_create_access_token(refresh)


async def test_state_for_a_parent(
    hass: HomeAssistant, init_integration: MockConfigEntry, hass_ws_client: WebSocketGenerator
) -> None:
    client = await hass_ws_client(hass)
    msg = await _ws(client, 1, type="hverdagsro/state")
    assert msg["success"]
    state = msg["result"]
    assert state["me"] == "anna"
    assert state["can_manage"] is True
    assert state["is_admin"] is True
    assert state["today"] == TODAY
    assert [member["id"] for member in state["family"]] == ["anna", "ida", "oskar"]
    assert state["points"] == {"ida": 100, "oskar": 20}
    assert state["done_today"] == {}


async def test_state_for_a_child(
    hass: HomeAssistant,
    init_integration: MockConfigEntry,
    hass_ws_client: WebSocketGenerator,
    hass_read_only_access_token: str,
) -> None:
    client = await hass_ws_client(hass, hass_read_only_access_token)
    state = (await _ws(client, 1, type="hverdagsro/state"))["result"]
    assert state["me"] == "ida"
    assert state["can_manage"] is False
    assert state["is_admin"] is False


async def test_subscribe(
    hass: HomeAssistant, init_integration: MockConfigEntry, hass_ws_client: WebSocketGenerator
) -> None:
    client = await hass_ws_client(hass)
    await client.send_json({"id": 1, "type": "hverdagsro/subscribe"})
    assert (await client.receive_json())["success"]
    first = await client.receive_json()
    assert first["event"]["points"]["ida"] == 100

    await client.send_json({"id": 2, "type": "hverdagsro/points", "member": "ida", "delta": 5, "reason": "Nice"})
    seen_event = seen_result = False
    for _ in range(6):
        msg = await client.receive_json()
        if msg.get("id") == 1 and msg.get("type") == "event":
            assert msg["event"]["points"]["ida"] == 105
            seen_event = True
        if msg.get("id") == 2 and msg.get("type") == "result":
            assert msg["result"] == {"points": 105}
            seen_result = True
        if seen_event and seen_result:
            break
    assert seen_event and seen_result


async def test_save_sections(
    hass: HomeAssistant, init_integration: MockConfigEntry, hass_ws_client: WebSocketGenerator
) -> None:
    client = await hass_ws_client(hass)
    msg = await _ws(client, 1, type="hverdagsro/save", section="modules", value={"music": False})
    assert msg["success"]
    assert msg["result"]["value"]["music"] is False
    assert msg["result"]["value"]["missions"] is True

    msg = await _ws(
        client, 2, type="hverdagsro/save", section="settings", value={"weather": "weather.home", "language": "en"}
    )
    assert msg["result"]["value"]["weather"] == "weather.home"
    assert msg["result"]["value"]["calendars"] == []

    msg = await _ws(client, 3, type="hverdagsro/save", section="settings", value={"weather": "not an entity"})
    assert not msg["success"]
    assert msg["error"]["code"] == "invalid_format"

    msg = await _ws(client, 4, type="hverdagsro/save", section="nope", value={})
    assert not msg["success"]

    house = {"name": "Home", "rooms": [{"id": "r1", "name": "Stue", "pts": [[0, 0], [60, 0], [60, 60]]}]}
    msg = await _ws(client, 5, type="hverdagsro/save", section="house", value=house)
    assert msg["result"]["value"]["rooms"][0]["name"] == "Stue"
    assert msg["result"]["value"]["walls"] == []

    msg = await _ws(client, 6, type="hverdagsro/save", section="house", value={"rooms": "nope"})
    assert msg["error"]["code"] == "invalid_format"


async def test_saving_the_family_reloads(
    hass: HomeAssistant, init_integration: MockConfigEntry, hass_ws_client: WebSocketGenerator
) -> None:
    client = await hass_ws_client(hass)
    msg = await _ws(client, 1, type="hverdagsro/save", section="family", value=[PARENT, CHILD])
    assert msg["success"]
    await hass.async_block_till_done()
    family = init_integration.runtime_data
    assert [member["id"] for member in family.members] == ["anna", "ida"]
    assert family.data["points"] == {"ida": 100}
    assert hass.states.get("sensor.ida_points") is not None

    duplicate = await _ws(client, 2, type="hverdagsro/save", section="family", value=[PARENT, PARENT])
    assert duplicate["error"]["code"] == "invalid_format"


async def test_a_child_cannot_change_settings(
    hass: HomeAssistant,
    init_integration: MockConfigEntry,
    hass_ws_client: WebSocketGenerator,
    hass_read_only_access_token: str,
) -> None:
    client = await hass_ws_client(hass, hass_read_only_access_token)
    msg = await _ws(client, 1, type="hverdagsro/save", section="modules", value={"music": False})
    assert msg["error"]["code"] == "not_allowed"
    msg = await _ws(client, 2, type="hverdagsro/setup_done")
    assert msg["error"]["code"] == "not_allowed"
    msg = await _ws(client, 3, type="hverdagsro/points", member="ida", delta=500)
    assert msg["error"]["code"] == "not_allowed"
    msg = await _ws(client, 4, type="hverdagsro/reward/decide", request="x", approve=True)
    assert msg["error"]["code"] == "not_allowed"


async def test_missions(
    hass: HomeAssistant,
    init_integration: MockConfigEntry,
    hass_ws_client: WebSocketGenerator,
    hass_read_only_access_token: str,
) -> None:
    client = await hass_ws_client(hass, hass_read_only_access_token)
    msg = await _ws(client, 1, type="hverdagsro/mission", mission="bed", member="ida", done=True)
    assert msg["result"] == {"done": True, "points": 110}
    # Twice is still once.
    msg = await _ws(client, 2, type="hverdagsro/mission", mission="bed", member="ida", done=True)
    assert msg["result"] == {"done": True, "points": 110}
    family = init_integration.runtime_data
    assert family.data["completions"][TODAY]["bed:ida"]["by"] == "ida"
    msg = await _ws(client, 3, type="hverdagsro/mission", mission="bed", member="ida", done=False)
    assert msg["result"] == {"done": False, "points": 100}

    # Ida can't tick off her brother's missions.
    msg = await _ws(client, 4, type="hverdagsro/mission", mission="teeth", member="oskar", done=True)
    assert msg["error"]["code"] == "not_allowed"

    # Yesterday, by a parent.
    admin = await hass_ws_client(hass)
    msg = await _ws(admin, 5, type="hverdagsro/mission", mission="teeth", member="oskar", done=True, date="2026-10-25")
    assert msg["result"]["points"] == 25
    assert "teeth:oskar" in family.data["completions"]["2026-10-25"]

    msg = await _ws(admin, 6, type="hverdagsro/mission", mission="nope", member="oskar", done=True)
    assert msg["error"]["code"] == "mission_not_found"
    msg = await _ws(admin, 7, type="hverdagsro/mission", mission="teeth", member="nobody", done=True)
    assert msg["error"]["code"] == "member_not_found"


async def test_a_shared_tablet_acts_for_the_children(
    hass: HomeAssistant, init_integration: MockConfigEntry, hass_ws_client: WebSocketGenerator
) -> None:
    client = await hass_ws_client(hass, await _tablet_token(hass))
    state = (await _ws(client, 1, type="hverdagsro/state"))["result"]
    assert state["me"] is None
    assert state["can_manage"] is False

    msg = await _ws(client, 2, type="hverdagsro/mission", mission="toys", member="oskar", done=True)
    assert msg["success"]
    msg = await _ws(client, 3, type="hverdagsro/theme", member="oskar", skin="skov", mode="dark")
    assert msg["success"]
    # But not for the parents.
    msg = await _ws(client, 4, type="hverdagsro/theme", member="anna", skin="skov", mode="dark")
    assert msg["error"]["code"] == "not_allowed"


async def test_shop(
    hass: HomeAssistant,
    init_integration: MockConfigEntry,
    hass_ws_client: WebSocketGenerator,
    hass_read_only_access_token: str,
) -> None:
    child = await hass_ws_client(hass, hass_read_only_access_token)
    msg = await _ws(child, 1, type="hverdagsro/reward/request", member="ida", reward="film")
    request = msg["result"]
    assert request["status"] == "pending"
    msg = await _ws(child, 2, type="hverdagsro/reward/request", member="ida", reward="film")
    assert msg["error"]["code"] == "already_requested"
    msg = await _ws(child, 3, type="hverdagsro/reward/request", member="ida", reward="lego")
    assert msg["error"]["code"] == "not_enough_points"
    msg = await _ws(child, 4, type="hverdagsro/reward/request", member="ida", reward="nope")
    assert msg["error"]["code"] == "reward_not_found"

    parent = await hass_ws_client(hass)
    msg = await _ws(parent, 5, type="hverdagsro/reward/decide", request=request["id"], approve=True)
    assert msg["success"]
    family = init_integration.runtime_data
    assert family.points("ida") == 60
    msg = await _ws(parent, 6, type="hverdagsro/reward/decide", request=request["id"], approve=True)
    assert msg["error"]["code"] == "request_not_found"

    # Oskar can't buy Ida's LEGO, and a parent's purchase is approved at once.
    msg = await _ws(parent, 7, type="hverdagsro/reward/request", member="oskar", reward="lego")
    assert msg["error"]["code"] == "reward_not_found"
    await _ws(parent, 8, type="hverdagsro/points", member="oskar", delta=30)
    msg = await _ws(parent, 9, type="hverdagsro/reward/request", member="oskar", reward="film")
    assert msg["success"]
    assert family.points("oskar") == 10
    assert family.requests[-1]["status"] == "approved"

    # Declined: no points are taken.
    request = (await _ws(child, 10, type="hverdagsro/reward/request", member="ida", reward="film"))["result"]
    await _ws(parent, 11, type="hverdagsro/reward/decide", request=request["id"], approve=False)
    assert family.points("ida") == 60
    assert family.requests[-1]["status"] == "declined"


async def test_theme_and_setup_done(
    hass: HomeAssistant,
    init_integration: MockConfigEntry,
    hass_ws_client: WebSocketGenerator,
    hass_read_only_access_token: str,
) -> None:
    child = await hass_ws_client(hass, hass_read_only_access_token)
    msg = await _ws(child, 1, type="hverdagsro/theme", member="ida", skin="rosa", mode="light")
    assert msg["success"]
    await hass.async_block_till_done()
    family = hass.config_entries.async_get_entry(init_integration.entry_id).runtime_data
    assert family.member("ida")["skin"] == "rosa"
    msg = await _ws(child, 2, type="hverdagsro/theme", member="oskar", skin="rosa", mode="light")
    assert msg["error"]["code"] == "not_allowed"
    msg = await _ws(child, 3, type="hverdagsro/theme", member="ida", skin="nope", mode="light")
    assert not msg["success"]

    parent = await hass_ws_client(hass)
    msg = await _ws(parent, 4, type="hverdagsro/setup_done")
    assert msg["success"]
    assert family.data["setup_done"] is True


async def test_not_loaded(
    hass: HomeAssistant, now: Any, hass_ws_client: WebSocketGenerator, hass_access_token: str
) -> None:
    # The clock is set (by `now`) before the access token is made, or the token would be from the future.
    assert await async_setup_component(hass, DOMAIN, {})
    client = await hass_ws_client(hass, hass_access_token)
    msg = await _ws(client, 1, type="hverdagsro/state")
    assert msg["error"]["code"] == "not_loaded"
