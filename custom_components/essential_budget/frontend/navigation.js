/* Moving between pages of Home Assistant. */

import { getInfo } from "./api.js";

/** The nearest ancestor with the given tag name, searched across shadow roots. */
const findAncestor = (el, tagName) => {
  for (let n = el; n; n = n.parentNode || n.host) {
    if (n.tagName === tagName) return n;
  }
  return null;
};

/** Opens a page of Home Assistant without reloading (like a link in the frontend). */
export const navigate = (path) => {
  history.pushState(null, "", path);
  window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: false } }));
};

/**
 * Opens the edit page. From the card editor the dialog is closed first; if it keeps open
 * (unsaved card options, Home Assistant asks), nothing happens.
 */
export const openEditPage = async (hass, from) => {
  const { edit_path: path } = await getInfo(hass);
  if (!path) return; // integration older than the card: a restart is needed first
  const dialog = findAncestor(from, "HUI-DIALOG-EDIT-CARD");
  if (dialog?.closeDialog?.() === false) return;
  navigate(path);
};
