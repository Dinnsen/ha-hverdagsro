"""Tests for the sidebar panel."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

from homeassistant.components import frontend
from homeassistant.core import HomeAssistant
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.hverdagsro import panel


async def test_register_and_remove_panel(hass: HomeAssistant, mock_config_entry: MockConfigEntry) -> None:
    hass.http = MagicMock()
    hass.http.async_register_static_paths = AsyncMock()

    async def fake_register(hass: HomeAssistant, **kwargs: object) -> None:
        hass.data.setdefault(frontend.DATA_PANELS, {})[kwargs["frontend_url_path"]] = kwargs

    with (
        patch.object(panel.panel_custom, "async_register_panel", side_effect=fake_register) as add,
        patch.object(panel.frontend, "async_remove_panel") as remove,
    ):
        await panel.async_register_panel(hass, mock_config_entry)
        hass.http.async_register_static_paths.assert_awaited_once()
        paths = hass.http.async_register_static_paths.call_args.args[0]
        version = add.call_args.kwargs["config"]["version"]
        assert [(path.url_path, path.cache_headers) for path in paths] == [(f"/hverdagsro_static/{version}", True)]
        kwargs = add.call_args.kwargs
        assert kwargs["frontend_url_path"] == "hverdagsro"
        assert kwargs["webcomponent_name"] == "hverdagsro-panel"
        assert kwargs["module_url"] == f"/hverdagsro_static/{version}/hverdagsro-panel.js"
        assert kwargs["sidebar_title"] == "Hverdagsro"
        assert kwargs["sidebar_icon"] == "mdi:home-heart"
        assert kwargs["require_admin"] is False

        # New options: the panel is replaced, the files are not served twice.
        entry = MockConfigEntry(
            domain="hverdagsro", options={"panel_title": "Familien", "panel_icon": "mdi:home", "require_admin": True}
        )
        await panel.async_register_panel(hass, entry)
        hass.http.async_register_static_paths.assert_awaited_once()
        remove.assert_called_once_with(hass, "hverdagsro")
        assert add.call_args.kwargs["sidebar_title"] == "Familien"
        assert add.call_args.kwargs["require_admin"] is True

        panel.async_unregister_panel(hass)
        assert remove.call_count == 2
        hass.data[frontend.DATA_PANELS].clear()
        panel.async_unregister_panel(hass)
        assert remove.call_count == 2
