"""WebSocket commands used by the card and the edit page."""

from __future__ import annotations

from collections.abc import Callable
from functools import wraps
from typing import Any

import voluptuous as vol
from homeassistant.components import websocket_api
from homeassistant.components.websocket_api import ActiveConnection
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.dispatcher import async_dispatcher_connect

from .const import DATA_FILE, DATA_VERSION, DOMAIN, EDIT_PATH, ISSUE_INVALID_FILE, SIGNAL_CHANGED
from .logic import LIMITS, BudgetError
from .store import DATA_STORE, BudgetStore


@callback
def async_register(hass: HomeAssistant) -> None:
    for command in (ws_version, ws_subscribe, ws_get, ws_save):
        websocket_api.async_register_command(hass, command)


def with_store(func: Callable[[HomeAssistant, ActiveConnection, dict, BudgetStore], Any]) -> Callable:
    """Pass the budget store to the command; answers with "not found" while the integration is not set up."""

    @wraps(func)
    def wrapper(hass: HomeAssistant, connection: ActiveConnection, msg: dict) -> Any:
        store = hass.data.get(DATA_STORE)
        if store is None:
            connection.send_error(msg["id"], websocket_api.ERR_NOT_FOUND, "Essential Budget is not set up")
            return None
        return func(hass, connection, msg, store)

    return wrapper


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/version"})
@callback
def ws_version(hass: HomeAssistant, connection: ActiveConnection, msg: dict) -> None:
    """Facts about the running integration.

    The card compares the version with its own after updates, opens the edit page
    at "edit_path" and uses the limits for its fields.
    """
    connection.send_result(msg["id"], {"version": hass.data[DATA_VERSION], "edit_path": f"/{EDIT_PATH}", "limits": LIMITS})


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/subscribe"})
@callback
def ws_subscribe(hass: HomeAssistant, connection: ActiveConnection, msg: dict) -> None:
    """Tells open cards that the budget was saved."""

    @callback
    def forward() -> None:
        connection.send_message(websocket_api.event_message(msg["id"], {}))

    connection.subscriptions[msg["id"]] = async_dispatcher_connect(hass, SIGNAL_CHANGED, forward)
    connection.send_result(msg["id"])


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/get"})
@callback
@with_store
def ws_get(hass: HomeAssistant, connection: ActiveConnection, msg: dict, store: BudgetStore) -> None:
    """The budget."""
    if store.error is not None:
        connection.send_error(msg["id"], ISSUE_INVALID_FILE, f"{DATA_FILE}: {store.error}")
        return
    connection.send_result(msg["id"], {"data": store.data})


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/save", vol.Required("data"): dict})
@websocket_api.require_admin
@websocket_api.async_response
@with_store
async def ws_save(hass: HomeAssistant, connection: ActiveConnection, msg: dict, store: BudgetStore) -> None:
    """Check and save the budget; answers with the cleaned data."""
    try:
        data = await store.async_save(msg["data"])
    except BudgetError as err:
        connection.send_error(msg["id"], websocket_api.ERR_INVALID_FORMAT, str(err))
        return
    except OSError as err:
        connection.send_error(msg["id"], websocket_api.ERR_UNKNOWN_ERROR, f"{DATA_FILE} could not be written: {err}")
        return
    connection.send_result(msg["id"], {"data": data})
