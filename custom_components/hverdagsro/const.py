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

# The panel's modules (Funktioner). A module that is off is hidden for the whole family.
MODULES: Final = (
    "missions",
    "points",
    "shop",
    "board",
    "rooms",
    "music",
    "appliances",
    "security",
    "house",
    "decor",
    "pet",
    "wish",
    "skema",
    "read",
    "meals",
    "energy",
    "alarm",
    "waste",
    "quick",
    "lists",
    "calendar",
)
DEFAULT_MODULES: Final = dict.fromkeys(MODULES, True)

# What each child has (Moduler pr. barn).
KID_FEATURES: Final = ("room", "board", "missions", "points", "shop", "pet", "read", "skema", "wish")
DEFAULT_KID_FEATURES: Final = {feature: feature not in ("board", "read") for feature in KID_FEATURES}
PET_KINDS: Final = ("hund", "kat", "drage")
# The routine board's three parts of the day.
BOARD_SLOTS: Final = ("morgen", "eftermiddag", "aften")
# After a + button routine: what the alarm does.
QUICK_THEN: Final = ("", "disarm", "armed_home", "armed_away", "armed_night", "armed_vacation", "armed_custom_bypass")
# Messages a parent or child can turn off (Beskeder til mig).
MESSAGES_PARENT: Final = ("shop", "mission", "goal", "calendar", "pickup", "waste")
MESSAGES_KID: Final = ("points", "next", "school", "pin")

# Limits that keep the stored file small.
MAX_MISSIONS: Final = 300
MAX_REWARDS: Final = 150
MAX_LEDGER: Final = 300
MAX_HOUSE_BYTES: Final = 600_000
KEEP_COMPLETIONS_DAYS: Final = 45

# Sections the panel can save, and who may save them.
SECTIONS: Final = (
    "family",
    "modules",
    "settings",
    "missions",
    "rewards",
    "house",
    "appliances",
    "quick",
    "routines",
    "pins",
)
MAX_QUICK: Final = 40
MAX_ROUTINES_BYTES: Final = 120_000

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

REDACT_KEYS: Final = ("name", "birthday", "person", "user_id", "title", "pin", "photo", "notify", "token", "email")
