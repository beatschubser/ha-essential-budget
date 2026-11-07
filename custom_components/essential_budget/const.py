"""Constants for the Essential Budget integration."""

DOMAIN = "essential_budget"
VERSION = "0.2.0-beta.4"

# All budget data lives in one readable JSON file in the .storage folder of the Home Assistant config.
# It is read at startup; manual changes are picked up after a restart.
DATA_FILE = ".storage/essential_budget.json"

FRONTEND_URL = "/essential_budget_files"
CARD_URL = f"{FRONTEND_URL}/essential-budget-card.js"

# Dispatcher signal: the budget was saved (open cards reload it)
SIGNAL_CHANGED = "essential_budget_changed"

CONF_PERSON_A = "person_a"
CONF_PERSON_B = "person_b"

ISSUE_INVALID_FILE = "invalid_file"
