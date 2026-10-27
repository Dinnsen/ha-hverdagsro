"""Tests for Familieleg: the whole family plays together."""

from __future__ import annotations

from datetime import date
from typing import Any
from unittest.mock import patch

from homeassistant.core import HomeAssistant
from pytest_homeassistant_custom_component.common import MockConfigEntry
from pytest_homeassistant_custom_component.typing import WebSocketGenerator

from custom_components.hverdagsro import funplay

from .test_websocket import _tablet_token, _ws


async def test_mission_of_the_day(
    hass: HomeAssistant,
    init_integration: MockConfigEntry,
    hass_ws_client: WebSocketGenerator,
    hass_read_only_access_token: str,
) -> None:
    """Monday's mission: visit four different places together. Everyone who helped gets coins, once."""
    family = init_integration.runtime_data
    parent = await hass_ws_client(hass)
    child = await hass_ws_client(hass, hass_read_only_access_token)
    state = (await _ws(parent, 1, type="hverdagsro/state"))["result"]
    day = state["fun"]["day"]
    assert (day["kind"], day["need"], day["count"]) == ("visit", 4, 0)
    # Another kind of event, or the same place twice, does not count.
    await _ws(child, 2, type="hverdagsro/fun", action="event", member="ida", kind="wave")
    await _ws(child, 3, type="hverdagsro/fun", action="event", member="ida", kind="visit", key="park")
    msg = await _ws(child, 4, type="hverdagsro/fun", action="event", member="ida", kind="visit", key="park")
    assert msg["result"]["day"]["count"] == 1
    await _ws(parent, 5, type="hverdagsro/fun", action="event", member="anna", kind="visit", key="have")
    await _ws(child, 6, type="hverdagsro/fun", action="event", member="ida", kind="visit", key="skov")
    msg = await _ws(child, 7, type="hverdagsro/fun", action="event", member="ida", kind="visit", key="pop")
    result = msg["result"]
    assert result["day"]["paid"] and result["day"]["who"] == ["ida", "anna"]
    assert result["party"]["reason"] == "day"
    assert family.game("ida")["coins"] == funplay.COINS_MISSION_DAY
    assert family.game("anna")["coins"] == funplay.COINS_MISSION_DAY
    await _ws(child, 8, type="hverdagsro/fun", action="event", member="ida", kind="visit", key="slik")
    assert family.game("ida")["coins"] == funplay.COINS_MISSION_DAY
    # A child acts only for itself.
    msg = await _ws(child, 9, type="hverdagsro/fun", action="event", member="oskar", kind="visit", key="x")
    assert msg["error"]["code"] == "not_allowed"


def test_a_new_mission_every_day() -> None:
    state: dict[str, Any] = {}
    kinds = {funplay._day(state, date(2026, 10, d))["kind"] for d in range(1, 8)}
    assert kinds == {kind for kind, _ in funplay.DAY_MISSIONS}


async def test_fun_tasks(
    hass: HomeAssistant,
    init_integration: MockConfigEntry,
    hass_ws_client: WebSocketGenerator,
    hass_read_only_access_token: str,
) -> None:
    """A grown-up gives a fun task; the child says done; the grown-up approves and the coins come."""
    family = init_integration.runtime_data
    parent = await hass_ws_client(hass)
    child = await hass_ws_client(hass, hass_read_only_access_token)
    msg = await _ws(child, 1, type="hverdagsro/fun", action="task_add", title="Find noget rødt")
    assert msg["error"]["code"] == "not_allowed"
    msg = await _ws(
        parent, 2, type="hverdagsro/fun", action="task_add", title=" Find noget rødt ", emoji="🔴", coins=6, real=True
    )
    task = msg["result"]["tasks"][0]
    assert (task["title"], task["for"], task["coins"], task["by"]) == ("Find noget rødt", [], 6, "anna")
    msg = await _ws(parent, 3, type="hverdagsro/fun", action="task_add", title="Dans", **{"for": ["oskar"]})
    only_oskar = msg["result"]["tasks"][1]
    msg = await _ws(child, 4, type="hverdagsro/fun", action="task_done", member="ida", task=only_oskar["id"])
    assert msg["error"]["code"] == "not_for_you"
    msg = await _ws(child, 5, type="hverdagsro/fun", action="task_done", member="ida", task=task["id"])
    assert msg["result"]["tasks"][0]["done"] == {"ida": "wait"}
    msg = await _ws(child, 6, type="hverdagsro/fun", action="task_approve", member="ida", task=task["id"])
    assert msg["error"]["code"] == "not_allowed"
    for msg_id in (7, 8):  # approved twice: the coins come once
        msg = await _ws(parent, msg_id, type="hverdagsro/fun", action="task_approve", member="ida", task=task["id"])
    assert msg["result"]["tasks"][0]["done"] == {"ida": "ok"}
    assert family.game("ida")["coins"] == 6
    msg = await _ws(child, 9, type="hverdagsro/fun", action="task_done", member="ida", task="nope")
    assert msg["error"]["code"] == "no_task"
    msg = await _ws(parent, 10, type="hverdagsro/fun", action="task_remove", task=task["id"])
    assert [t["id"] for t in msg["result"]["tasks"]] == [only_oskar["id"]]
    # Never more than 30 tasks: the oldest goes.
    for msg_id in range(11, 11 + funplay.MAX_TASKS):
        msg = await _ws(parent, msg_id, type="hverdagsro/fun", action="task_add", title=f"Opgave {msg_id}")
    assert len(msg["result"]["tasks"]) == funplay.MAX_TASKS
    assert msg["result"]["tasks"][0]["title"] == "Opgave 11"


async def test_star_hunt(
    hass: HomeAssistant,
    init_integration: MockConfigEntry,
    hass_ws_client: WebSocketGenerator,
    hass_read_only_access_token: str,
) -> None:
    """Stars hidden around the house; each one found gives coins, all found gives a party."""
    family = init_integration.runtime_data
    parent = await hass_ws_client(hass)
    child = await hass_ws_client(hass, hass_read_only_access_token)
    msg = await _ws(child, 1, type="hverdagsro/fun", action="hunt_find", member="ida", star="s0")
    assert msg["error"]["code"] == "no_hunt"
    msg = await _ws(child, 2, type="hverdagsro/fun", action="hunt_start", member="ida", spaces=[])
    assert msg["error"]["code"] == "no_spaces"
    msg = await _ws(
        child, 3, type="hverdagsro/fun", action="hunt_start", member="ida", spaces=["have", "h:stue"], n=3, who=["ida"]
    )
    hunt = msg["result"]["hunt"]
    assert len(hunt["stars"]) == 3 and hunt["who"] == ["ida"]
    assert all(s["space"] in ("have", "h:stue") and 120 <= s["x"] <= 880 for s in hunt["stars"])
    msg = await _ws(child, 4, type="hverdagsro/fun", action="hunt_find", member="ida", star="s9")
    assert msg["error"]["code"] == "no_hunt"
    await _ws(child, 5, type="hverdagsro/fun", action="hunt_find", member="ida", star="s0")
    await _ws(child, 6, type="hverdagsro/fun", action="hunt_find", member="ida", star="s0")
    assert family.game("ida")["coins"] == funplay.COINS_STAR
    await _ws(parent, 7, type="hverdagsro/fun", action="hunt_find", member="anna", star="s1")
    msg = await _ws(child, 8, type="hverdagsro/fun", action="hunt_find", member="ida", star="s2")
    hunt = msg["result"]["hunt"]
    assert hunt["done"] and hunt["who"] == ["ida", "anna"]
    assert msg["result"]["party"]["who"] == ["anna", "ida"]
    assert family.game("ida")["coins"] == 2 * funplay.COINS_STAR + funplay.COINS_HUNT_DONE
    assert family.game("anna")["coins"] == funplay.COINS_STAR + funplay.COINS_HUNT_DONE
    msg = await _ws(child, 9, type="hverdagsro/fun", action="hunt_find", member="ida", star="s0")
    assert msg["error"]["code"] == "no_hunt"
    # Started by the parent: the child can't stop it, the parent can.
    await _ws(parent, 10, type="hverdagsro/fun", action="hunt_start", member="anna", spaces=["have"])
    msg = await _ws(child, 11, type="hverdagsro/fun", action="hunt_stop", member="ida")
    assert msg["error"]["code"] == "not_allowed"
    msg = await _ws(parent, 12, type="hverdagsro/fun", action="hunt_stop")
    assert msg["result"]["hunt"] is None


async def test_hide_and_seek(
    hass: HomeAssistant,
    init_integration: MockConfigEntry,
    hass_ws_client: WebSocketGenerator,
    hass_read_only_access_token: str,
) -> None:
    """One hides a thing; the others look; close enough in the right place finds it."""
    family = init_integration.runtime_data
    parent = await hass_ws_client(hass)
    child = await hass_ws_client(hass, hass_read_only_access_token)
    msg = await _ws(child, 1, type="hverdagsro/fun", action="seek", member="ida", space="have", x=1, y=1)
    assert msg["error"]["code"] == "no_hide"
    await _ws(parent, 2, type="hverdagsro/fun", action="hide", member="anna", space="have", x=400, y=500, thing="teddy")
    msg = await _ws(parent, 3, type="hverdagsro/fun", action="seek", member="anna", space="have", x=400, y=500)
    assert msg["error"]["code"] == "no_hide"  # not your own
    msg = await _ws(child, 4, type="hverdagsro/fun", action="seek", member="ida", space="park", x=400, y=500)
    assert msg["result"]["hide"]["found_by"] is None
    msg = await _ws(child, 5, type="hverdagsro/fun", action="seek", member="ida", space="have", x=600, y=500)
    assert msg["result"]["hide"]["found_by"] is None
    msg = await _ws(child, 6, type="hverdagsro/fun", action="seek", member="ida", space="have", x=440, y=540)
    assert msg["result"]["hide"]["found_by"] == "ida"
    assert family.game("ida")["coins"] == funplay.COINS_FOUND
    assert family.game("anna")["coins"] == funplay.COINS_HIDDEN
    # Hidden by the child: only she (or a parent) takes it away before it is found.
    await _ws(child, 7, type="hverdagsro/fun", action="hide", member="ida", space="have", x=400, y=500)
    with patch.object(family, "can_manage", return_value=False):
        msg = await _ws(parent, 8, type="hverdagsro/fun", action="hide_stop")
    assert msg["error"]["code"] == "not_allowed"
    msg = await _ws(child, 9, type="hverdagsro/fun", action="hide_stop")
    assert msg["result"]["hide"] is None
    # Hugs and high fives go through the live relay.
    msg = await _ws(child, 10, type="hverdagsro/play", member="ida", space="have", emote="highfive", to="anna")
    assert msg["success"]


async def test_childrens_challenges(
    hass: HomeAssistant,
    init_integration: MockConfigEntry,
    hass_ws_client: WebSocketGenerator,
    hass_read_only_access_token: str,
) -> None:
    """A child makes a challenge for a sibling and pays the coins from their own; only they (or a grown-up) approve."""
    family = init_integration.runtime_data
    parent = await hass_ws_client(hass)
    child = await hass_ws_client(hass, hass_read_only_access_token)
    tablet = await hass_ws_client(hass, await _tablet_token(hass))
    family.game("ida")["coins"] = 2
    msg = await _ws(child, 1, type="hverdagsro/fun", action="task_add", title="Find min bamse", approver="oskar")
    assert msg["error"]["code"] == "not_allowed"
    msg = await _ws(
        child,
        2,
        type="hverdagsro/fun",
        action="task_add",
        title="Find min bamse",
        approver="ida",
        coins=50,
        **{"for": ["oskar"]},
    )
    assert msg["error"]["code"] == "invalid_format"
    msg = await _ws(
        child,
        3,
        type="hverdagsro/fun",
        action="task_add",
        title="Find min bamse",
        approver="ida",
        coins=3,
        **{"for": ["oskar"]},
    )
    task = msg["result"]["tasks"][0]
    assert (task["by"], task["kid"], task["coins"], task["real"]) == ("ida", True, 3, False)
    msg = await _ws(child, 4, type="hverdagsro/fun", action="task_done", member="ida", task=task["id"])
    assert msg["error"]["code"] == "not_for_you"
    await _ws(tablet, 5, type="hverdagsro/fun", action="task_done", member="oskar", task=task["id"])
    msg = await _ws(
        tablet, 6, type="hverdagsro/fun", action="task_approve", member="oskar", task=task["id"], approver="oskar"
    )
    assert msg["error"]["code"] == "not_allowed"
    msg = await _ws(
        child, 7, type="hverdagsro/fun", action="task_approve", member="oskar", task=task["id"], approver="ida"
    )
    assert msg["result"]["tasks"][0]["done"] == {"oskar": "ok"}
    # Ida only had 2 coins: Oskar gets 2, and her experience stays.
    assert family.game("ida")["coins"] == 0 and family.game("oskar")["coins"] == 2
    # A grown-up's task: the child can neither approve nor remove it; the grown-up's own challenge has no cap.
    msg = await _ws(parent, 8, type="hverdagsro/fun", action="task_add", title="Ryd op", coins=20)
    grown = msg["result"]["tasks"][1]
    assert grown["coins"] == 20 and not grown["kid"]
    msg = await _ws(child, 9, type="hverdagsro/fun", action="task_remove", task=grown["id"], approver="ida")
    assert msg["error"]["code"] == "not_allowed"
    msg = await _ws(child, 10, type="hverdagsro/fun", action="task_remove", task=task["id"], approver="ida")
    assert [t["id"] for t in msg["result"]["tasks"]] == [grown["id"]]
