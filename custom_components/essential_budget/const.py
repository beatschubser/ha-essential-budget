"""Constants for the Essential Budget integration."""

from __future__ import annotations

from homeassistant.util.hass_dict import HassKey

DOMAIN = "essential_budget"

# Version of the running integration (from manifest.json, read once at startup)
DATA_VERSION: HassKey[str] = HassKey(f"{DOMAIN}_version")

# All budget data lives in one readable JSON file in the .storage folder of the Home Assistant config.
# It is read at startup; manual changes are picked up after a restart.
DATA_FILE = ".storage/essential_budget.json"

# The JavaScript files of the card are served here
FRONTEND_URL = "/essential_budget_files"
CARD_URL = f"{FRONTEND_URL}/essential-budget-card.js"

# Edit page: own page for editing the budget (admins only, no sidebar entry; linked from the card,
# the card editor and the "Configure" button of the integration)
EDIT_PATH = "essential-budget"
EDIT_PAGE_ELEMENT = "essential-budget-panel"

# Dispatcher signal: the budget was saved (open cards reload it)
SIGNAL_CHANGED = "essential_budget_changed"

CONF_PERSON_A = "person_a"
CONF_PERSON_B = "person_b"

# Repair issue and WebSocket error code for a budget file that cannot be read
ISSUE_INVALID_FILE = "invalid_file"
