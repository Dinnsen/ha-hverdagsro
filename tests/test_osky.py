"""Tests for Ønskeskyen."""

from __future__ import annotations

from typing import Any

from homeassistant.core import HomeAssistant
from pytest_homeassistant_custom_component.common import MockConfigEntry
from pytest_homeassistant_custom_component.test_util.aiohttp import AiohttpClientMocker
from pytest_homeassistant_custom_component.typing import WebSocketGenerator

from custom_components.hverdagsro.osky import GRAPHQL_URLS, TOKEN_URL

from .test_websocket import _ws

LISTS = {
    "data": {
        "wishlists": {
            "nextCursor": 0,
            "totalCount": 1,
            "data": [
                {
                    "id": "list1",
                    "title": "Idas ønsker",
                    "accessLevel": "Public",
                    "eventType": "Birthday",
                    "eventDate": None,
                    "coverPhoto": None,
                    "kidAccountId": None,
                    "kidAccount": None,
                    "owner": {"id": "u1", "firstName": "Anna", "lastName": "H"},
                    "subaccount": None,
                    "wishes": {"totalCount": 1},
                }
            ],
        }
    }
}
WISHES = {
    "data": {
        "wishlist": {
            "id": "list1",
            "wishes": {
                "totalCount": 1,
                "nextCursor": 0,
                "data": [
                    {
                        "id": "w1",
                        "title": "LEGO",
                        "description": None,
                        "price": 299,
                        "currency": "DKK",
                        "quantity": 1,
                        "photos": ["https://img/1.jpg"],
                        "url": "https://shop/lego",
                        "redirectUrl": None,
                        "reservations": [{"quantity": 1}],
                        "productRef": {"domainName": "br.dk", "displayPrice": "299 kr"},
                    }
                ],
            },
        }
    }
}


def _graphql(aioclient_mock: AiohttpClientMocker, responses: list[dict[str, Any]]) -> None:
    calls = iter(responses)

    async def respond(method: str, url: Any, data: Any) -> Any:
        from pytest_homeassistant_custom_component.test_util.aiohttp import AiohttpClientMockResponse

        return AiohttpClientMockResponse(method, url, json=next(calls))

    aioclient_mock.post(GRAPHQL_URLS[0], side_effect=respond)


async def test_login_lists_and_logout(
    hass: HomeAssistant,
    init_integration: MockConfigEntry,
    hass_ws_client: WebSocketGenerator,
    aioclient_mock: AiohttpClientMocker,
    hass_storage: dict[str, Any],
) -> None:
    aioclient_mock.post(TOKEN_URL, json={"id_token": "secret-token", "token_type": "bearer"})
    me = {"data": {"me": {"id": "u1", "firstName": "Anna", "lastName": "H"}}}
    _graphql(aioclient_mock, [me, LISTS, WISHES, {"data": {"wish": {"create": {"id": "w2"}}}}, LISTS, WISHES])
    client = await hass_ws_client(hass)
    msg = await _ws(
        client, 1, type="hverdagsro/osky/login", member="anna", email="a@b.dk", password="hemmeligt-kodeord"
    )
    assert msg["success"], msg
    state = (await _ws(client, 2, type="hverdagsro/state"))["result"]["osky"]
    assert state["accounts"]["anna"]["name"] == "Anna H"
    assert "token" not in state["accounts"]["anna"]
    [lst] = state["lists"]
    assert lst["title"] == "Idas ønsker"
    assert lst["wishes"][0] == {
        "id": "w1",
        "title": "LEGO",
        "price": 299,
        "currency": "DKK",
        "photo": "https://img/1.jpg",
        "url": "https://shop/lego",
        "shop": "br.dk",
        "reserved": 1,
    }
    # Only the key is stored, never the password.
    stored = str(hass_storage["hverdagsro.osky.hverdagsro_entry"])
    assert "secret-token" in stored
    assert "hemmeligt-kodeord" not in stored

    msg = await _ws(client, 3, type="hverdagsro/osky/wish", list="list1", title="Bog", price=99)
    assert msg["success"], msg

    # A child can't log in; Ida can't add to a list that isn't hers.
    msg = await _ws(client, 4, type="hverdagsro/osky/login", member="ida", email="x", password="y")
    assert msg["error"]["code"] == "not_allowed"

    msg = await _ws(client, 5, type="hverdagsro/osky/logout", member="anna")
    assert msg["success"]
    state = (await _ws(client, 6, type="hverdagsro/state"))["result"]["osky"]
    assert state == {"accounts": {}, "lists": []}


async def test_wrong_password(
    hass: HomeAssistant,
    init_integration: MockConfigEntry,
    hass_ws_client: WebSocketGenerator,
    aioclient_mock: AiohttpClientMocker,
) -> None:
    aioclient_mock.post(TOKEN_URL, status=401)
    client = await hass_ws_client(hass)
    msg = await _ws(client, 1, type="hverdagsro/osky/login", member="anna", email="a@b.dk", password="wrong")
    assert msg["error"]["code"] == "osky_login_failed"
