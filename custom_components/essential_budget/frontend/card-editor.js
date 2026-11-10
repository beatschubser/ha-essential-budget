/* <essential-budget-card-editor>: the visual card editor (title and privacy mode; all other keys like grid_options are kept). */

import { translator } from "./format.js";
import { esc } from "./html.js";
import { openEditPage } from "./navigation.js";
import { CARD_EDITOR_STYLE } from "./styles.js";

export const DEFAULT_PRIVACY_SECONDS = 30; // privacy mode: numbers are hidden again after this time
export const MIN_PRIVACY_SECONDS = 5;

const LABELS = { title: "title_optional", privacy: "privacy", privacy_seconds: "privacy_seconds" }; // field -> text

class EssentialBudgetCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = config || {};
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    if (this._form) this._form.hass = hass;
    else this._render();
  }

  _build() {
    const t = translator(this._hass);
    this._form = document.createElement("ha-form");
    this._form.computeLabel = (field) => t(LABELS[field.name]);
    this._form.addEventListener("value-changed", (e) => {
      const config = { ...this._config, ...e.detail.value };
      // only values that differ from the defaults are stored
      if (!config.title) delete config.title;
      if (!config.privacy) delete config.privacy;
      if (!config.privacy || !config.privacy_seconds || Number(config.privacy_seconds) === DEFAULT_PRIVACY_SECONDS) delete config.privacy_seconds;
      this._config = config;
      this.dispatchEvent(new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }));
    });
    this.append(this._form);
    // the budget itself is edited on its own page
    if (this._hass.user?.is_admin) {
      const link = document.createElement("div");
      link.className = "eb-edit-link";
      link.innerHTML = `<style>${CARD_EDITOR_STYLE}</style><span>${esc(t("edit_link_hint"))}</span>
        <button type="button"><ha-icon icon="mdi:pencil"></ha-icon>${esc(t("edit_title"))}</button>`;
      link.querySelector("button").addEventListener("click", () => openEditPage(this._hass, this));
      this.append(link);
    }
  }

  _render() {
    // Home Assistant may set hass before the config: wait for both
    if (!this._hass || !this._config) return;
    if (!this._form) this._build();
    this._form.hass = this._hass;
    this._form.schema = [
      { name: "title", selector: { text: {} } },
      { name: "privacy", selector: { boolean: {} } },
      // the delay only matters with the privacy mode
      ...(this._config.privacy
        ? [{ name: "privacy_seconds", selector: { number: { min: MIN_PRIVACY_SECONDS, max: 600, step: 5, mode: "box", unit_of_measurement: "s" } } }]
        : []),
    ];
    this._form.data = {
      title: this._config.title || "",
      privacy: !!this._config.privacy,
      privacy_seconds: Number(this._config.privacy_seconds) || DEFAULT_PRIVACY_SECONDS,
    };
  }
}

if (!customElements.get("essential-budget-card-editor")) customElements.define("essential-budget-card-editor", EssentialBudgetCardEditor);
