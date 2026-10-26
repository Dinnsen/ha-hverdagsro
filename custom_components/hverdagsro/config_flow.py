"""Config flow for Hverdagsro. The family is set up in the panel's guide."""

from __future__ import annotations

from typing import Any

from homeassistant.config_entries import ConfigEntry, ConfigFlow, ConfigFlowResult, OptionsFlow
from homeassistant.core import callback
from homeassistant.helpers import selector

from .const import CONF_PANEL_ICON, CONF_PANEL_TITLE, CONF_REQUIRE_ADMIN, DEFAULT_NAME, DEFAULT_PANEL_ICON, DOMAIN
from .schema import vol


class HverdagsroConfigFlow(ConfigFlow, domain=DOMAIN):
    """One Hverdagsro per Home Assistant."""

    VERSION = 1

    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        if user_input is not None:
            return self.async_create_entry(title=DEFAULT_NAME, data={})
        return self.async_show_form(step_id="user", data_schema=vol.Schema({}))

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: ConfigEntry) -> HverdagsroOptionsFlow:
        return HverdagsroOptionsFlow()


class HverdagsroOptionsFlow(OptionsFlow):
    """The panel's name, icon and who may open it."""

    async def async_step_init(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        if user_input is not None:
            return self.async_create_entry(data=user_input)
        options = self.config_entry.options
        schema = vol.Schema(
            {
                vol.Optional(
                    CONF_PANEL_TITLE, default=options.get(CONF_PANEL_TITLE, DEFAULT_NAME)
                ): selector.TextSelector(),
                vol.Optional(
                    CONF_PANEL_ICON, default=options.get(CONF_PANEL_ICON, DEFAULT_PANEL_ICON)
                ): selector.IconSelector(),
                vol.Optional(
                    CONF_REQUIRE_ADMIN, default=options.get(CONF_REQUIRE_ADMIN, False)
                ): selector.BooleanSelector(),
            }
        )
        return self.async_show_form(step_id="init", data_schema=schema)
