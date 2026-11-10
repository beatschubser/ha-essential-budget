/* WebSocket commands of the integration (custom_components/essential_budget/websocket_api.py). */

const WS = "essential_budget";

/** The saved budget (file format: see logic.py). */
export const getBudget = async (hass) => (await hass.callWS({ type: `${WS}/get` })).data;

/** Saves the budget (admins only); returns the cleaned data as it was written. */
export const saveBudget = async (hass, data) => (await hass.callWS({ type: `${WS}/save`, data })).data;

/** Calls back whenever the budget was saved; resolves to a function that ends the subscription. */
export const onBudgetSaved = (hass, callback) => hass.connection.subscribeMessage(callback, { type: `${WS}/subscribe` });

/**
 * Facts about the running integration: { version, edit_path, limits }.
 * An integration older than 0.3.0 only answers with the version.
 */
export const getInfo = (hass) => hass.callWS({ type: `${WS}/version` });
