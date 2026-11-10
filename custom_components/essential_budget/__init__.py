"""Essential Budget: a static household budget with a dashboard card.

Setup overview:
- async_setup (once): register the WebSocket commands, serve the card files, register the edit page
  and add the card as dashboard resource.
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
from homeassistant.loader import async_get_integration

from . import dashboard_resource, edit_page, frontend_files, websocket_api
from .const import CONF_PERSON_A, CONF_PERSON_B, DATA_VERSION, DOMAIN, SIGNAL_CHANGED
from .store import DATA_STORE, BudgetStore

CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    version = str((await async_get_integration(hass, DOMAIN)).version)
    hass.data[DATA_VERSION] = version
    websocket_api.async_register(hass)
    if hass.http is not None:
        await frontend_files.async_register(hass)
        await edit_page.async_register(hass, version)

        async def register_card(hass: HomeAssistant) -> None:
            await dashboard_resource.async_register(hass, version)

        async_at_started(hass, register_card)
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
    await dashboard_resource.async_remove(hass)
