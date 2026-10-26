"""The Hverdagsro sidebar panel."""

from __future__ import annotations

import inspect
from pathlib import Path
from typing import Any

from homeassistant.components import frontend, panel_custom
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.loader import async_get_integration

from .const import CONF_PANEL_ICON, CONF_PANEL_TITLE, CONF_REQUIRE_ADMIN, DEFAULT_NAME, DEFAULT_PANEL_ICON, DOMAIN

PANEL_URL = "hverdagsro"
STATIC_URL = "/hverdagsro_static"
WEBCOMPONENT = "hverdagsro-panel"
_STATIC_KEY = f"{DOMAIN}_static_registered"


async def async_register_panel(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Serve the panel's files and put Hverdagsro in the sidebar."""
    version = str((await async_get_integration(hass, DOMAIN)).version)
    # The version is part of the path, so the panel's modules (imported relative to each other) are
    # fetched fresh after an update while browsers may cache them for as long as they like.
    base = f"{STATIC_URL}/{version}"
    if not hass.data.get(_STATIC_KEY):
        await hass.http.async_register_static_paths(
            [StaticPathConfig(base, str(Path(__file__).parent / "frontend"), True)]
        )
        hass.data[_STATIC_KEY] = True
    if PANEL_URL in hass.data.get(frontend.DATA_PANELS, {}):
        frontend.async_remove_panel(hass, PANEL_URL)
    extra: dict[str, Any] = {}
    # The panel draws its own sky under the status bar and its tab bar over the home indicator.
    if "handle_safe_area" in inspect.signature(panel_custom.async_register_panel).parameters:
        extra["handle_safe_area"] = True
    await panel_custom.async_register_panel(
        hass,
        frontend_url_path=PANEL_URL,
        webcomponent_name=WEBCOMPONENT,
        sidebar_title=entry.options.get(CONF_PANEL_TITLE) or DEFAULT_NAME,
        sidebar_icon=entry.options.get(CONF_PANEL_ICON) or DEFAULT_PANEL_ICON,
        module_url=f"{base}/{WEBCOMPONENT}.js",
        config={"static_url": base, "version": version},
        require_admin=bool(entry.options.get(CONF_REQUIRE_ADMIN, False)),
        **extra,
    )


@callback
def async_unregister_panel(hass: HomeAssistant) -> None:
    if PANEL_URL in hass.data.get(frontend.DATA_PANELS, {}):
        frontend.async_remove_panel(hass, PANEL_URL)
