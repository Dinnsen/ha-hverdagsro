"""Websocket commands used by the Hverdagsro panel."""

from __future__ import annotations

from collections.abc import Awaitable, Callable
from datetime import date
import functools
import time
from typing import Any

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.dispatcher import async_dispatcher_connect, async_dispatcher_send

from . import funplay
from .const import BOARD_SLOTS, DOMAIN, ROLE_PARENT, SECTIONS, SKIN_MODES, SKINS
from .family import MAX_UNLOCK, Family
from .schema import vol
from .validation import iso_date

type Handler = Callable[[HomeAssistant, websocket_api.ActiveConnection, dict[str, Any], Family], Awaitable[None]]


def _family(hass: HomeAssistant) -> Family | None:
    entries = hass.config_entries.async_loaded_entries(DOMAIN)
    if not entries:
        return None
    family: Family = entries[0].runtime_data
    return family


def _with_family(func: Handler) -> Callable[[HomeAssistant, websocket_api.ActiveConnection, dict[str, Any]], Any]:
    """Look up the family, and turn errors into websocket errors."""

    @functools.wraps(func)
    async def wrapper(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
        family = _family(hass)
        if family is None:
            connection.send_error(msg["id"], "not_loaded", "Hverdagsro is not set up")
            return
        try:
            await func(hass, connection, msg, family)
        except vol.Invalid as err:
            connection.send_error(msg["id"], "invalid_format", str(err))
        except HomeAssistantError as err:
            connection.send_error(msg["id"], err.translation_key or "error", str(err))

    return wrapper


def _require_manager(connection: websocket_api.ActiveConnection, family: Family) -> None:
    if not family.can_manage(connection.user):
        raise HomeAssistantError(translation_domain=DOMAIN, translation_key="not_allowed")


@websocket_api.websocket_command({vol.Required("type"): "hverdagsro/state"})
@websocket_api.async_response
@_with_family
async def ws_state(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any], family: Family
) -> None:
    connection.send_result(msg["id"], family.panel_state(connection.user))


@websocket_api.websocket_command({vol.Required("type"): "hverdagsro/subscribe"})
@websocket_api.async_response
@_with_family
async def ws_subscribe(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any], family: Family
) -> None:
    """Send the state now and again every time it changes."""

    @callback
    def send() -> None:
        # Looked up each time: saving the family reloads the entry with a new Family object.
        current = _family(hass)
        if current is not None:
            connection.send_message(websocket_api.event_message(msg["id"], current.panel_state(connection.user)))

    connection.subscriptions[msg["id"]] = family.subscribe(send)
    connection.send_result(msg["id"])
    send()


@websocket_api.websocket_command(
    {vol.Required("type"): "hverdagsro/save", vol.Required("section"): vol.In(SECTIONS), vol.Required("value"): object}
)
@websocket_api.async_response
@_with_family
async def ws_save(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any], family: Family
) -> None:
    _require_manager(connection, family)
    children = [(m["id"], m["name"]) for m in family.children]
    value = await family.async_save_section(msg["section"], msg["value"])
    if msg["section"] == "family" and children != [(m["id"], m["name"]) for m in family.children]:
        # New, renamed or removed children get or lose their entities.
        hass.config_entries.async_schedule_reload(family.entry.entry_id)
    connection.send_result(msg["id"], {"value": value})


@websocket_api.websocket_command({vol.Required("type"): "hverdagsro/setup_done"})
@websocket_api.async_response
@_with_family
async def ws_setup_done(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any], family: Family
) -> None:
    _require_manager(connection, family)
    family.async_finish_setup()
    connection.send_result(msg["id"])


@websocket_api.websocket_command(
    {
        vol.Required("type"): "hverdagsro/mission",
        vol.Required("mission"): cv.string,
        vol.Required("member"): cv.string,
        vol.Required("done"): cv.boolean,
        vol.Optional("date"): iso_date,
    }
)
@websocket_api.async_response
@_with_family
async def ws_mission(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any], family: Family
) -> None:
    day = date.fromisoformat(msg["date"]) if msg.get("date") else None
    done = await family.async_set_mission_done(msg["mission"], msg["member"], msg["done"], connection.user, day)
    connection.send_result(
        msg["id"], {"done": done, "points": family.points(family.require_member(msg["member"])["id"])}
    )


@websocket_api.websocket_command(
    {
        vol.Required("type"): "hverdagsro/points",
        vol.Required("member"): cv.string,
        vol.Required("delta"): vol.All(vol.Coerce(int), vol.Range(min=-100000, max=100000)),
        vol.Optional("reason", default=""): cv.string,
    }
)
@websocket_api.async_response
@_with_family
async def ws_points(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any], family: Family
) -> None:
    points = await family.async_add_points(msg["member"], msg["delta"], msg["reason"], connection.user)
    connection.send_result(msg["id"], {"points": points})


@websocket_api.websocket_command(
    {
        vol.Required("type"): "hverdagsro/reward/request",
        vol.Required("member"): cv.string,
        vol.Required("reward"): cv.string,
    }
)
@websocket_api.async_response
@_with_family
async def ws_reward_request(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any], family: Family
) -> None:
    request = await family.async_request_reward(msg["member"], msg["reward"], connection.user)
    connection.send_result(msg["id"], request)


@websocket_api.websocket_command(
    {
        vol.Required("type"): "hverdagsro/reward/decide",
        vol.Required("request"): cv.string,
        vol.Required("approve"): cv.boolean,
    }
)
@websocket_api.async_response
@_with_family
async def ws_reward_decide(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any], family: Family
) -> None:
    await family.async_decide(msg["request"], msg["approve"], connection.user)
    connection.send_result(msg["id"])


@websocket_api.websocket_command(
    {
        vol.Required("type"): "hverdagsro/theme",
        vol.Required("member"): cv.string,
        vol.Required("skin"): vol.In(SKINS),
        vol.Required("mode"): vol.In(SKIN_MODES),
    }
)
@websocket_api.async_response
@_with_family
async def ws_theme(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any], family: Family
) -> None:
    await family.async_set_theme(connection.user, msg["member"], msg["skin"], msg["mode"])
    connection.send_result(msg["id"])


@websocket_api.websocket_command(
    {vol.Required("type"): "hverdagsro/prefs", vol.Required("member"): cv.string, vol.Required("prefs"): dict}
)
@websocket_api.async_response
@_with_family
async def ws_prefs(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any], family: Family
) -> None:
    """A member's own + menu, messages and picture."""
    await family.async_set_prefs(connection.user, msg["member"], msg["prefs"])
    connection.send_result(msg["id"])


@websocket_api.websocket_command(
    {vol.Required("type"): "hverdagsro/pin", vol.Required("member"): cv.string, vol.Required("pin"): cv.string}
)
@websocket_api.async_response
@_with_family
async def ws_pin(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any], family: Family
) -> None:
    connection.send_result(msg["id"], {"ok": family.check_pin(msg["member"], msg["pin"])})


@websocket_api.websocket_command(
    {
        vol.Required("type"): "hverdagsro/board",
        vol.Required("member"): cv.string,
        vol.Required("slot"): vol.In(BOARD_SLOTS),
        vol.Required("index"): vol.All(vol.Coerce(int), vol.Range(min=0, max=60)),
        vol.Required("done"): cv.boolean,
    }
)
@websocket_api.async_response
@_with_family
async def ws_board(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any], family: Family
) -> None:
    done = await family.async_set_board(msg["member"], msg["slot"], msg["index"], msg["done"], connection.user)
    connection.send_result(msg["id"], {"done": done})


@websocket_api.websocket_command(
    {
        vol.Required("type"): "hverdagsro/game",
        vol.Required("member"): cv.string,
        vol.Required("action"): vol.In(("daily", "unlock")),
        vol.Optional("items", default=[]): vol.All(
            cv.ensure_list, [vol.All(cv.string, vol.Length(min=1, max=40))], vol.Length(max=MAX_UNLOCK)
        ),
        vol.Optional("cost", default=0): vol.All(vol.Coerce(int), vol.Range(min=0, max=5000)),
    }
)
@websocket_api.async_response
@_with_family
async def ws_game(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any], family: Family
) -> None:
    """Mit værelse: the daily coin, or unlocking things for coins."""
    state = await family.async_game(msg["member"], msg["action"], msg["items"], msg["cost"], connection.user)
    connection.send_result(msg["id"], state)


# ---------------------------------------------------------------------- playing together (Mit værelse, live)
# Where each child is in the game, kept in memory only (never stored) and passed on to the others who play.
PLAY_SIGNAL = f"{DOMAIN}_play"
PLAY_TTL = 60.0


def _players(hass: HomeAssistant) -> dict[str, dict[str, Any]]:
    players: dict[str, dict[str, Any]] = hass.data.setdefault(PLAY_SIGNAL, {})
    now = time.monotonic()
    for key in [key for key, player in players.items() if now - player["_at"] > PLAY_TTL]:
        del players[key]
    return players


def _public(player: dict[str, Any]) -> dict[str, Any]:
    return {key: value for key, value in player.items() if not key.startswith("_")}


def _look(value: Any) -> dict[str, str]:
    """The avatar to show the others: a few short words and colours, nothing else."""
    if not isinstance(value, dict):
        return {}
    return {str(k)[:12]: str(v)[:24] for k, v in list(value.items())[:24] if isinstance(v, str)}


@websocket_api.websocket_command({vol.Required("type"): "hverdagsro/play_subscribe"})
@websocket_api.async_response
@_with_family
async def ws_play_subscribe(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any], family: Family
) -> None:
    """Who is playing where, now and whenever it changes."""

    @callback
    def forward(player: dict[str, Any]) -> None:
        connection.send_message(websocket_api.event_message(msg["id"], {"player": player}))

    connection.subscriptions[msg["id"]] = async_dispatcher_connect(hass, PLAY_SIGNAL, forward)
    connection.send_result(msg["id"])
    connection.send_message(
        websocket_api.event_message(msg["id"], {"players": [_public(p) for p in _players(hass).values()]})
    )


@websocket_api.websocket_command(
    {
        vol.Required("type"): "hverdagsro/play",
        vol.Required("member"): cv.string,
        vol.Required("space"): vol.All(cv.string, vol.Length(max=80)),
        vol.Optional("x", default=500): vol.All(vol.Coerce(int), vol.Range(min=0, max=1000)),
        vol.Optional("y", default=560): vol.All(vol.Coerce(int), vol.Range(min=0, max=1000)),
        vol.Optional("me", default=None): vol.Any(None, dict),
        vol.Optional("emote", default=None): vol.Any(
            None, vol.In(("wave", "jump", "heart", "hug", "highfive", "invite"))
        ),
        vol.Optional("to", default=None): vol.Any(None, vol.All(cv.string, vol.Length(max=40))),
    }
)
@websocket_api.async_response
@_with_family
async def ws_play(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any], family: Family
) -> None:
    """A child moved, went somewhere, waved, or stopped playing (empty space)."""
    family.check_member_access(connection.user, msg["member"])
    member = family.require_member(msg["member"])
    players = _players(hass)
    if not msg["space"]:
        players.pop(member["id"], None)
        player: dict[str, Any] = {"member": member["id"], "space": ""}
    else:
        player = {
            "member": member["id"],
            "space": msg["space"],
            "x": msg["x"],
            "y": msg["y"],
            "me": _look(msg["me"]) or players.get(member["id"], {}).get("me", {}),
            "_at": time.monotonic(),
        }
        players[member["id"]] = player
        player = _public(player)
        if msg["emote"]:
            player = {**player, "emote": msg["emote"], "to": msg["to"]}
    async_dispatcher_send(hass, PLAY_SIGNAL, player)
    connection.send_result(msg["id"])


# ---------------------------------------------------------------------- Familieleg (the whole family plays together)
_SHORT = vol.All(cv.string, vol.Length(max=80))


@websocket_api.websocket_command(
    {
        vol.Required("type"): "hverdagsro/fun",
        vol.Required("action"): vol.In(
            (
                "event",
                "task_add",
                "task_done",
                "task_approve",
                "task_remove",
                "hunt_start",
                "hunt_find",
                "hunt_stop",
                "hide",
                "seek",
                "hide_stop",
                "help_ask",
                "help_ok",
                "vote",
                "tick",
            )
        ),
        vol.Optional("member"): vol.All(cv.string, vol.Length(max=40)),
        vol.Optional("approver"): vol.All(cv.string, vol.Length(max=40)),
        vol.Optional("kind"): vol.In(("wave", "visit", "talk", "meet", "build", "hug", "star")),
        vol.Optional("key"): _SHORT,
        vol.Optional("task"): vol.All(cv.string, vol.Length(max=120)),
        vol.Optional("helped"): vol.All(cv.string, vol.Length(max=40)),
        vol.Optional("title"): vol.All(cv.string, vol.Strip, vol.Length(min=1, max=80)),
        vol.Optional("emoji"): vol.All(cv.string, vol.Length(max=8)),
        vol.Optional("for"): vol.All(cv.ensure_list, [vol.All(cv.string, vol.Length(max=40))], vol.Length(max=12)),
        vol.Optional("coins"): vol.All(vol.Coerce(int), vol.Range(min=0, max=50)),
        vol.Optional("real"): cv.boolean,
        vol.Optional("spaces"): vol.All(cv.ensure_list, [_SHORT], vol.Length(max=40)),
        vol.Optional("who"): vol.All(cv.ensure_list, [vol.All(cv.string, vol.Length(max=40))], vol.Length(max=12)),
        vol.Optional("n"): vol.All(vol.Coerce(int), vol.Range(min=3, max=12)),
        vol.Optional("star"): vol.All(cv.string, vol.Length(max=6)),
        vol.Optional("space"): _SHORT,
        vol.Optional("x"): vol.All(vol.Coerce(int), vol.Range(min=0, max=1000)),
        vol.Optional("y"): vol.All(vol.Coerce(int), vol.Range(min=0, max=1000)),
        vol.Optional("thing"): vol.All(cv.string, vol.Length(max=40)),
        vol.Optional("help"): vol.All(cv.string, vol.Length(max=12)),
        vol.Optional("dish"): vol.All(cv.string, vol.Strip, vol.Length(min=1, max=40)),
    }
)
@websocket_api.async_response
@_with_family
async def ws_fun(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any], family: Family
) -> None:
    """Familieleg: missions, star hunts, hide and seek and fun tasks for the whole family."""
    state = await funplay.async_fun(family, connection.user, msg["action"], msg)
    connection.send_result(msg["id"], state)


def _require_parent_account(connection: websocket_api.ActiveConnection, family: Family, member_id: str) -> None:
    """Only a parent logs in to Ønskeskyen, and only as themselves (or an administrator for them)."""
    _require_manager(connection, family)
    member = family.require_member(member_id)
    me = family.member_for_user(connection.user)
    if member["role"] != ROLE_PARENT or (me is not None and me["id"] != member["id"]):
        raise HomeAssistantError(translation_domain=DOMAIN, translation_key="not_allowed")


@websocket_api.websocket_command(
    {
        vol.Required("type"): "hverdagsro/osky/login",
        vol.Required("member"): cv.string,
        vol.Required("email"): cv.string,
        vol.Required("password"): cv.string,
    }
)
@websocket_api.async_response
@_with_family
async def ws_osky_login(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any], family: Family
) -> None:
    _require_parent_account(connection, family, msg["member"])
    await family.osky.async_login(family.require_member(msg["member"])["id"], msg["email"], msg["password"])
    connection.send_result(msg["id"])


@websocket_api.websocket_command({vol.Required("type"): "hverdagsro/osky/logout", vol.Required("member"): cv.string})
@websocket_api.async_response
@_with_family
async def ws_osky_logout(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any], family: Family
) -> None:
    _require_parent_account(connection, family, msg["member"])
    await family.osky.async_logout(family.require_member(msg["member"])["id"])
    connection.send_result(msg["id"])


@websocket_api.websocket_command({vol.Required("type"): "hverdagsro/osky/refresh"})
@websocket_api.async_response
@_with_family
async def ws_osky_refresh(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any], family: Family
) -> None:
    await family.osky.async_refresh()
    connection.send_result(msg["id"])


@websocket_api.websocket_command(
    {
        vol.Required("type"): "hverdagsro/osky/wish",
        vol.Required("list"): cv.string,
        vol.Required("title"): vol.All(cv.string, vol.Length(min=1, max=200)),
        vol.Optional("price"): vol.Any(None, vol.Coerce(float)),
        vol.Optional("url"): vol.Any(None, cv.url),
    }
)
@websocket_api.async_response
@_with_family
async def ws_osky_wish(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any], family: Family
) -> None:
    """Parents add to any list; a child only to the list that is theirs."""
    if not family.can_manage(connection.user):
        me = family.member_for_user(connection.user)
        owner = family.data["settings"].get("osky_to", {}).get(msg["list"])
        if me is None or owner != me["id"]:
            raise HomeAssistantError(translation_domain=DOMAIN, translation_key="not_allowed")
    await family.osky.async_add_wish(msg["list"], msg["title"], msg.get("price"), msg.get("url"))
    connection.send_result(msg["id"])


@callback
def async_register_websocket(hass: HomeAssistant) -> None:
    for command in (
        ws_state,
        ws_subscribe,
        ws_save,
        ws_setup_done,
        ws_mission,
        ws_points,
        ws_reward_request,
        ws_reward_decide,
        ws_theme,
        ws_prefs,
        ws_pin,
        ws_board,
        ws_game,
        ws_play,
        ws_play_subscribe,
        ws_fun,
        ws_osky_login,
        ws_osky_logout,
        ws_osky_refresh,
        ws_osky_wish,
    ):
        websocket_api.async_register_command(hass, command)
