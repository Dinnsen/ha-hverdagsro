"""Ønskeskyen (GoWish): the family's wish lists.

Each parent logs in with their own Ønskeskyen account. Hverdagsro signs in the way onskeskyen.dk does
(auth.gowish.com/token with client_id "web") and keeps only the key it gets back, never the password.
The wish lists (the parent's own and those shared with them) are fetched with Ønskeskyen's GraphQL API.
"""

from __future__ import annotations

from datetime import timedelta
import logging
from typing import Any

import aiohttp
from homeassistant.core import HomeAssistant, callback
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.event import async_track_time_interval
from homeassistant.helpers.storage import Store
from homeassistant.util import dt as dt_util

from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)

TOKEN_URL = "https://auth.gowish.com/token"
GRAPHQL_URLS = ("https://api.gowish.com/graphql/107ab9a23c7e95dffee1535907419bf6", "https://api.gowish.com/graphql")
ORIGIN = "https://onskeskyen.dk"
REFRESH = timedelta(minutes=30)
MAX_WISHES = 60
TIMEOUT = aiohttp.ClientTimeout(total=20)

Q_ME = "query getMe { me { id firstName lastName } }"
Q_LISTS = """query getWishlistsPaginated($input: PaginationInput, $kinds: [WishlistKind!]) {
  wishlists(input: $input, kinds: $kinds) {
    nextCursor
    totalCount
    data { id title accessLevel eventType eventDate coverPhoto kidAccountId
      kidAccount { id firstName }
      owner { id firstName lastName }
      subaccount { id firstName }
      wishes(input: {cursor: 0, limit: 1}) { totalCount } }
  }
}"""
Q_WISHES = """query getWishlistWishes($id: ID!, $input: PaginationInput) {
  wishlist(id: $id) { id wishes(input: $input) { totalCount nextCursor
    data { id title description price currency quantity photos url redirectUrl
      reservations { quantity }
      productRef { domainName displayPrice } } } }
}"""
M_CREATE = """mutation createWish($input: CreateWishInput!, $wishlist: ID!, $metadata: MetadataInput!) {
  wish { create(input: $input, wishlist: $wishlist, metadata: $metadata) { id title price } }
}"""


class OskyError(HomeAssistantError):
    """Ønskeskyen said no."""


class Osky:
    """The family's Ønskeskyen accounts and wish lists."""

    def __init__(self, hass: HomeAssistant, entry_id: str, changed: Any) -> None:
        self.hass = hass
        self._store: Store[dict[str, Any]] = Store(hass, 1, f"{DOMAIN}.osky.{entry_id}", private=True)
        self._accounts: dict[str, dict[str, Any]] = {}
        self.lists: dict[str, dict[str, Any]] = {}
        self._changed = changed
        self._unsub: Any = None

    # ------------------------------------------------------------------ lifecycle

    async def async_initialize(self) -> None:
        stored = await self._store.async_load() or {}
        self._accounts = stored.get("accounts", {})
        if self._accounts:
            self.hass.async_create_task(self.async_refresh(), eager_start=False)
        self._unsub = async_track_time_interval(self.hass, self._async_tick, REFRESH)

    @callback
    def async_stop(self) -> None:
        if self._unsub:
            self._unsub()
            self._unsub = None

    async def async_remove(self) -> None:
        await self._store.async_remove()

    async def _async_tick(self, _now: Any) -> None:
        await self.async_refresh()

    # ------------------------------------------------------------------ the panel

    def state(self) -> dict[str, Any]:
        """Accounts without their keys, and the lists."""
        return {
            "accounts": {
                member: {key: value for key, value in account.items() if key != "token"}
                for member, account in self._accounts.items()
            },
            "lists": list(self.lists.values()),
        }

    async def async_login(self, member_id: str, email: str, password: str) -> None:
        session = async_get_clientsession(self.hass)
        try:
            async with session.post(
                TOKEN_URL,
                json={"username": email, "password": password, "grant_type": "password", "client_id": "web"},
                headers={"Origin": ORIGIN},
                timeout=TIMEOUT,
            ) as resp:
                if resp.status in (400, 401, 403):
                    raise OskyError(translation_domain=DOMAIN, translation_key="osky_login_failed")
                resp.raise_for_status()
                body = await resp.json()
        except (aiohttp.ClientError, TimeoutError) as err:
            raise OskyError(translation_domain=DOMAIN, translation_key="osky_unavailable") from err
        token = body.get("id_token") or body.get("access_token")
        if not token:
            raise OskyError(translation_domain=DOMAIN, translation_key="osky_login_failed")
        me = (await self._query(token, Q_ME, {})).get("me") or {}
        self._accounts[member_id] = {
            "token": token,
            "name": " ".join(x for x in (me.get("firstName"), me.get("lastName")) if x),
            "user": me.get("id"),
            "at": dt_util.now().isoformat(),
        }
        await self._store.async_save({"accounts": self._accounts})
        await self.async_refresh()

    async def async_logout(self, member_id: str) -> None:
        self._accounts.pop(member_id, None)
        await self._store.async_save({"accounts": self._accounts})
        self.lists = {key: lst for key, lst in self.lists.items() if member_id not in lst["via"] or len(lst["via"]) > 1}
        for lst in self.lists.values():
            lst["via"] = [v for v in lst["via"] if v != member_id]
        self._changed()

    async def async_add_wish(self, list_id: str, title: str, price: float | None, url: str | None) -> None:
        lst = self.lists.get(list_id)
        if lst is None:
            raise OskyError(translation_domain=DOMAIN, translation_key="osky_unknown_list")
        token = self._accounts.get(lst["via"][0], {}).get("token")
        if not token:
            raise OskyError(translation_domain=DOMAIN, translation_key="osky_login_failed")
        wish: dict[str, Any] = {"title": title, "currency": "DKK"}
        if price is not None:
            wish["price"] = price
        if url:
            wish["url"] = url
        await self._query(
            token,
            M_CREATE,
            {"wishlist": list_id, "input": wish, "metadata": {"source": "Manual", "sourceType": "Manual"}},
        )
        await self.async_refresh()

    # ------------------------------------------------------------------ fetching

    async def async_refresh(self) -> None:
        lists: dict[str, dict[str, Any]] = {}
        for member_id, account in list(self._accounts.items()):
            try:
                data = await self._query(account["token"], Q_LISTS, {"kinds": ["My", "Shared"], "input": {"limit": 50}})
            except OskyError as err:
                _LOGGER.warning("Ønskeskyen: could not fetch the wish lists for %s: %s", member_id, err)
                account["error"] = str(err)
                continue
            account.pop("error", None)
            account["at"] = dt_util.now().isoformat()
            for item in (data.get("wishlists") or {}).get("data") or []:
                if item["id"] in lists:
                    lists[item["id"]]["via"].append(member_id)
                    continue
                owner = item.get("owner") or {}
                kid = item.get("kidAccount") or item.get("subaccount") or {}
                lists[item["id"]] = {
                    "id": item["id"],
                    "title": item.get("title") or "",
                    "owner": owner.get("firstName") or "",
                    "owner_id": owner.get("id"),
                    "kid": kid.get("firstName"),
                    "access": item.get("accessLevel"),
                    "event": item.get("eventType"),
                    "date": item.get("eventDate"),
                    "cover": item.get("coverPhoto"),
                    "count": ((item.get("wishes") or {}).get("totalCount")) or 0,
                    "via": [member_id],
                    "wishes": [],
                }
        for lst in lists.values():
            token = self._accounts[lst["via"][0]]["token"]
            try:
                data = await self._query(
                    token, Q_WISHES, {"id": lst["id"], "input": {"cursor": 0, "limit": MAX_WISHES}}
                )
            except OskyError:
                continue
            wishes = ((data.get("wishlist") or {}).get("wishes") or {}).get("data") or []
            lst["wishes"] = [
                {
                    "id": w["id"],
                    "title": w.get("title") or "",
                    "price": w.get("price"),
                    "currency": w.get("currency") or "DKK",
                    "photo": (w.get("photos") or [None])[0],
                    "url": w.get("redirectUrl") or w.get("url"),
                    "shop": (w.get("productRef") or {}).get("domainName") or "",
                    "reserved": sum(r.get("quantity") or 0 for r in w.get("reservations") or []),
                }
                for w in wishes
            ]
        self.lists = lists
        await self._store.async_save({"accounts": self._accounts})
        self._changed()

    async def _query(self, token: str, query: str, variables: dict[str, Any]) -> dict[str, Any]:
        session = async_get_clientsession(self.hass)
        last: Exception | None = None
        for url in GRAPHQL_URLS:
            try:
                async with session.post(
                    url,
                    json={"query": query, "variables": variables},
                    headers={"Authorization": f"Bearer {token}", "Origin": ORIGIN},
                    timeout=TIMEOUT,
                ) as resp:
                    if resp.status == 404:
                        continue
                    if resp.status in (401, 403):
                        raise OskyError(translation_domain=DOMAIN, translation_key="osky_login_failed")
                    resp.raise_for_status()
                    body = await resp.json()
            except (aiohttp.ClientError, TimeoutError) as err:
                last = err
                continue
            if body.get("errors") and not body.get("data"):
                raise OskyError(
                    translation_domain=DOMAIN,
                    translation_key="osky_error",
                    translation_placeholders={"error": str(body["errors"][0].get("message", ""))[:200]},
                )
            data: dict[str, Any] = body.get("data") or {}
            return data
        raise OskyError(translation_domain=DOMAIN, translation_key="osky_unavailable") from last
