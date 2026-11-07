"""Essential Budget: a static household budget with a dashboard card.

Setup overview:
- async_setup (once): register the WebSocket commands, serve the card and register the edit page.
- async_setup_entry (one entry only): read /config/.storage/essential_budget.json (created if missing).
  The data is edited on the edit page (/essential-budget); manual changes to the file are read at the next start.
"""

from __future__ import annotations

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.dispatcher import async_dispatcher_send
from homeassistant.helpers.start import async_at_started
from homeassistant.helpers.typing import ConfigType

from . import frontend_resource, websocket_api
from .const import CONF_PERSON_A, CONF_PERSON_B, DOMAIN, SIGNAL_CHANGED
from .store import DATA_STORE, BudgetStore

CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    websocket_api.async_register(hass)
    if hass.http is not None:
        await frontend_resource.async_register_view(hass)
        await frontend_resource.async_register_panel(hass)
        async_at_started(hass, frontend_resource.async_register_card)
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    store = BudgetStore(hass)
    # The names from the setup dialog are only used when the file is created
    await store.async_load(entry.data.get(CONF_PERSON_A, ""), entry.data.get(CONF_PERSON_B, ""))
    hass.data[DATA_STORE] = store
    async_dispatcher_send(hass, SIGNAL_CHANGED)
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    hass.data.pop(DATA_STORE, None)
    async_dispatcher_send(hass, SIGNAL_CHANGED)
    return True


async def async_remove_entry(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """The budget file stays in the config folder; only the dashboard resource is removed."""
    await frontend_resource.async_remove_resource(hass)
