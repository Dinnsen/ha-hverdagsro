"""Websocket commands used by the Hverdagsro panel."""

from __future__ import annotations

from collections.abc import Awaitable, Callable
from datetime import date
import functools
from typing import Any

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import config_validation as cv

from .const import DOMAIN, SECTIONS, SKIN_MODES, SKINS
from .family import Family
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
    value = await family.async_save_section(msg["section"], msg["value"])
    if msg["section"] == "family":
        # New or removed children get or lose their entities.
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
    ):
        websocket_api.async_register_command(hass, command)
