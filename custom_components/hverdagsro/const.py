"""Constants for Hverdagsro."""

from __future__ import annotations

from typing import Final

from homeassistant.const import Platform

DOMAIN: Final = "hverdagsro"
DEFAULT_NAME: Final = "Hverdagsro"
MANUFACTURER: Final = "Hverdagsro"
DOCS_URL: Final = "https://github.com/Dinnsen/ha-hverdagsro"
PLATFORMS: list[Platform] = [Platform.SENSOR, Platform.TODO]

STORAGE_KEY: Final = "hverdagsro.{entry_id}"
STORAGE_VERSION: Final = 1
SAVE_DELAY: Final = 1.0

# Options
CONF_PANEL_TITLE: Final = "panel_title"
CONF_PANEL_ICON: Final = "panel_icon"
CONF_REQUIRE_ADMIN: Final = "require_admin"
DEFAULT_PANEL_ICON: Final = "mdi:home-heart"

# Family
ROLE_PARENT: Final = "parent"
ROLE_CHILD: Final = "child"
ROLES: Final = (ROLE_PARENT, ROLE_CHILD)
EVERYONE: Final = "all"
INSTITUTIONS: Final = ("none", "dagpleje", "vuggestue", "bornehave", "skole")
SKINS: Final = ("standard", "nordlys", "hav", "skov", "sand", "rosa", "rummet", "kontrast")
SKIN_MODES: Final = ("auto", "light", "dark")
MAX_MEMBERS: Final = 16

# The panel's modules. A module that is off is hidden for the whole family.
MODULES: Final = (
    "missions",
    "points",
    "shop",
    "lists",
    "calendar",
    "meals",
    "music",
    "appliances",
    "security",
    "house",
    "decor",
    "energy",
    "waste",
)
DEFAULT_MODULES: Final = {
    "missions": True,
    "points": True,
    "shop": True,
    "lists": True,
    "calendar": True,
    "meals": False,
    "music": True,
    "appliances": True,
    "security": True,
    "house": True,
    "decor": True,
    "energy": True,
    "waste": False,
}

# Limits that keep the stored file small.
MAX_MISSIONS: Final = 300
MAX_REWARDS: Final = 150
MAX_LEDGER: Final = 300
MAX_HOUSE_BYTES: Final = 600_000
KEEP_COMPLETIONS_DAYS: Final = 45

# Sections the panel can save, and who may save them.
SECTIONS: Final = ("family", "modules", "settings", "missions", "rewards", "house", "appliances")

SIGNAL_UPDATED: Final = "hverdagsro_updated_{entry_id}"

# Actions
SERVICE_ADD_POINTS: Final = "add_points"
SERVICE_COMPLETE_MISSION: Final = "complete_mission"
ATTR_CONFIG_ENTRY_ID: Final = "config_entry_id"
ATTR_MEMBER: Final = "member"
ATTR_POINTS: Final = "points"
ATTR_REASON: Final = "reason"
ATTR_MISSION: Final = "mission"
ATTR_DATE: Final = "date"

REDACT_KEYS: Final = ("name", "birthday", "person", "user_id", "title")
