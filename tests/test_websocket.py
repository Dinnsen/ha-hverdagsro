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

    # Only a new colour: no restart.
    family = init_integration.runtime_data
    msg = await _ws(client, 3, type="hverdagsro/save", section="family", value=[PARENT, {**CHILD, "color": "#112233"}])
    await hass.async_block_till_done()
    assert init_integration.runtime_data is family

    duplicate = await _ws(client, 4, type="hverdagsro/save", section="family", value=[PARENT, PARENT])
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


async def test_prefs_pin_and_board(
    hass: HomeAssistant,
    init_integration: MockConfigEntry,
    hass_ws_client: WebSocketGenerator,
    hass_read_only_access_token: str,
) -> None:
    family = init_integration.runtime_data
    parent = await hass_ws_client(hass)

    # A PIN is kept when the panel saves the family without it, and never sent to the panel.
    members = [{**m, "pin": "1234"} if m["id"] == "ida" else m for m in family.members]
    await family.async_save_section("family", members)
    await hass.async_block_till_done()
    family = hass.config_entries.async_get_entry(init_integration.entry_id).runtime_data
    state = (await _ws(parent, 1, type="hverdagsro/state"))["result"]
    ida = next(m for m in state["family"] if m["id"] == "ida")
    assert "pin" not in ida
    assert ida["has_pin"] is True
    sent = [{**{k: v for k, v in m.items() if k != "pin"}, "has_pin": True} for m in family.members]
    await family.async_save_section("family", sent)
    assert family.member("ida")["pin"] == "1234"
    assert "has_pin" not in family.member("ida")

    assert (await _ws(parent, 2, type="hverdagsro/pin", member="ida", pin="0000"))["result"] == {"ok": False}
    assert (await _ws(parent, 3, type="hverdagsro/pin", member="ida", pin="1234"))["result"] == {"ok": True}
    assert (await _ws(parent, 4, type="hverdagsro/pin", member="oskar", pin="9"))["result"] == {"ok": True}
    for i in range(5):
        await _ws(parent, 10 + i, type="hverdagsro/pin", member="ida", pin="0000")
    msg = await _ws(parent, 20, type="hverdagsro/pin", member="ida", pin="1234")
    assert msg["error"]["code"] == "too_many_tries"

    # Ida's own + menu; she can't turn her messages off herself.
    child = await hass_ws_client(hass, hass_read_only_access_token)
    msg = await _ws(child, 30, type="hverdagsro/prefs", member="ida", prefs={"quick_hide": ["nat"], "secret": 1})
    assert msg["success"]
    assert family.member("ida")["quick_hide"] == ["nat"]
    assert "secret" not in family.member("ida")
    msg = await _ws(child, 31, type="hverdagsro/prefs", member="ida", prefs={"msg_off": ["points"]})
    assert msg["error"]["code"] == "not_allowed"
    msg = await _ws(parent, 32, type="hverdagsro/prefs", member="ida", prefs={"msg_off": ["points"]})
    assert family.member("ida")["msg_off"] == ["points"]

    # The routine board: the whole morning done gives 5 points, once.
    await family.async_save_section(
        "routines", {"boards": {"ida": {"morgen": ["op", "taend"], "eftermiddag": [], "aften": []}}}
    )
    msg = await _ws(child, 40, type="hverdagsro/board", member="ida", slot="morgen", index=0, done=True)
    assert msg["result"]["done"] == ["morgen:0"]
    msg = await _ws(child, 41, type="hverdagsro/board", member="ida", slot="morgen", index=1, done=True)
    assert "morgen:bonus" in msg["result"]["done"]
    assert family.points("ida") == 105
    await _ws(child, 42, type="hverdagsro/board", member="ida", slot="morgen", index=1, done=False)
    await _ws(child, 43, type="hverdagsro/board", member="ida", slot="morgen", index=1, done=True)
    assert family.points("ida") == 105
    msg = await _ws(child, 44, type="hverdagsro/board", member="oskar", slot="morgen", index=0, done=True)
    assert msg["error"]["code"] == "not_allowed"


async def test_room_game(
    hass: HomeAssistant,
    init_integration: MockConfigEntry,
    hass_ws_client: WebSocketGenerator,
    hass_read_only_access_token: str,
) -> None:
    """Mit værelse: coins for routines, missions and homework; unlocking things costs coins."""
    family = init_integration.runtime_data
    child = await hass_ws_client(hass, hass_read_only_access_token)
    await family.async_save_section("routines", {"boards": {"ida": {"morgen": ["op", "taend"]}}})
    await _ws(child, 1, type="hverdagsro/board", member="ida", slot="morgen", index=0, done=True)
    assert family.game("ida")["coins"] == 3
    await _ws(child, 2, type="hverdagsro/board", member="ida", slot="morgen", index=1, done=True)
    assert family.game("ida")["coins"] == 16  # two cards and the whole routine
    await _ws(child, 3, type="hverdagsro/board", member="ida", slot="morgen", index=1, done=False)
    assert family.game("ida")["coins"] == 13
    await _ws(child, 4, type="hverdagsro/mission", mission="teeth", member="ida", done=True)
    await _ws(child, 5, type="hverdagsro/mission", mission="lektie:44:matematik", member="ida", done=True)
    assert family.game("ida") == {"coins": 31, "xp": 31, "owned": []}
    # The coin of the day, once a day.
    msg = await _ws(child, 6, type="hverdagsro/game", member="ida", action="daily")
    assert msg["result"]["coins"] == 36
    msg = await _ws(child, 7, type="hverdagsro/game", member="ida", action="daily")
    assert msg["result"]["coins"] == 36
    # Unlocking: not without the coins, once only, and the experience stays.
    msg = await _ws(child, 8, type="hverdagsro/game", member="ida", action="unlock", items=["arcade"], cost=99)
    assert msg["error"]["code"] == "not_enough_coins"
    msg = await _ws(child, 9, type="hverdagsro/game", member="ida", action="unlock", items=["arcade", "tv"], cost=30)
    assert msg["result"] == {"coins": 6, "xp": 36, "owned": ["arcade", "tv"], "daily": TODAY}
    msg = await _ws(child, 10, type="hverdagsro/game", member="ida", action="unlock", items=["arcade"], cost=30)
    assert msg["result"]["coins"] == 6
    msg = await _ws(child, 11, type="hverdagsro/game", member="oskar", action="daily")
    assert msg["error"]["code"] == "not_allowed"
    state = (await _ws(child, 12, type="hverdagsro/state"))["result"]
    assert state["game"]["ida"]["owned"] == ["arcade", "tv"]


async def test_quick_and_pins(
    hass: HomeAssistant, init_integration: MockConfigEntry, hass_ws_client: WebSocketGenerator
) -> None:
    client = await hass_ws_client(hass)
    quick = [
        {
            "id": "nat",
            "label": "Nat",
            "entity": "script.nat",
            "icon": "moon",
            "cond": {"kind": "time", "from": 20, "to": 4},
            "who": ["anna"],
            "then": "armed_home",
        }
    ]
    msg = await _ws(client, 1, type="hverdagsro/save", section="quick", value=quick)
    assert msg["result"]["value"][0]["cond"]["entity"] is None
    msg = await _ws(client, 2, type="hverdagsro/save", section="quick", value=[{**quick[0], "then": "explode"}])
    assert msg["error"]["code"] == "invalid_format"
    msg = await _ws(client, 3, type="hverdagsro/save", section="pins", value={"ida": {"text": "Far henter dig kl. 13"}})
    assert msg["result"]["value"]["ida"]["until"] is None
    state = (await _ws(client, 4, type="hverdagsro/state"))["result"]
    assert state["pins"]["ida"]["text"] == "Far henter dig kl. 13"
    assert state["osky"] == {"accounts": {}, "lists": []}
