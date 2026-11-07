"""WebSocket commands used by the card."""

from __future__ import annotations

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.dispatcher import async_dispatcher_connect

from .const import DATA_FILE, DOMAIN, SIGNAL_CHANGED, VERSION
from .logic import BudgetError
from .store import DATA_STORE


@callback
def async_register(hass: HomeAssistant) -> None:
    for command in (ws_version, ws_subscribe, ws_get, ws_save):
        websocket_api.async_register_command(hass, command)


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/version"})
@callback
def ws_version(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict) -> None:
    """Version of the running integration; the card compares it with its own after updates."""
    connection.send_result(msg["id"], {"version": VERSION})


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/subscribe"})
@callback
def ws_subscribe(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict) -> None:
    """Tells open cards that the budget was saved."""

    @callback
    def forward() -> None:
        connection.send_message(websocket_api.event_message(msg["id"], {}))

    connection.subscriptions[msg["id"]] = async_dispatcher_connect(hass, SIGNAL_CHANGED, forward)
    connection.send_result(msg["id"])


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/get"})
@callback
def ws_get(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict) -> None:
    """The budget and the name of its file."""
    store = hass.data.get(DATA_STORE)
    if store is None:
        connection.send_error(msg["id"], websocket_api.ERR_NOT_FOUND, "Essential Budget is not set up")
        return
    if store.error is not None:
        connection.send_error(msg["id"], "invalid_file", f"{DATA_FILE}: {store.error}")
        return
    connection.send_result(msg["id"], {"data": store.data, "file": DATA_FILE})


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/save", vol.Required("data"): dict})
@websocket_api.require_admin
@websocket_api.async_response
async def ws_save(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict) -> None:
    store = hass.data.get(DATA_STORE)
    if store is None:
        connection.send_error(msg["id"], websocket_api.ERR_NOT_FOUND, "Essential Budget is not set up")
        return
    try:
        data = await store.async_save(msg["data"])
    except BudgetError as err:
        connection.send_error(msg["id"], websocket_api.ERR_INVALID_FORMAT, str(err))
        return
    except OSError as err:
        connection.send_error(msg["id"], websocket_api.ERR_UNKNOWN_ERROR, f"{DATA_FILE} could not be written: {err}")
        return
    connection.send_result(msg["id"], {"data": data})
