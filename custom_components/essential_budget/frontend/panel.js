/* <essential-budget-panel>: the edit page (admins only, no sidebar entry): a toolbar with back button and title, the editor below. */

import "./editor.js";
import { translator } from "./format.js";
import { navigate } from "./navigation.js";
import { PANEL_STYLE } from "./styles.js";

class EssentialBudgetPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" }).innerHTML = `<style>${PANEL_STYLE}</style>
      <div class="toolbar">
        <button class="back"><ha-icon icon="mdi:arrow-left"></ha-icon></button>
        <h1 class="page-title"></h1>
      </div>
      <div class="content"><div class="page"></div></div>`;
    this._editor = document.createElement("essential-budget-editor");
    this.shadowRoot.querySelector(".page").append(this._editor);
    this.shadowRoot.querySelector(".back").addEventListener("click", () => {
      // back to where the page was opened from (dashboard, integration), else to the start page
      if (history.length > 1) history.back();
      else navigate("/");
    });
  }

  set hass(hass) {
    this._editor.hass = hass;
    const t = translator(hass);
    const title = this.shadowRoot.querySelector(".page-title");
    if (title.textContent === t("edit_title")) return;
    title.textContent = t("edit_title");
    const back = this.shadowRoot.querySelector(".back");
    back.title = t("back_page");
    back.setAttribute("aria-label", t("back_page"));
  }

  // set by Home Assistant, not needed
  set narrow(value) {}
  set route(value) {}
  set panel(value) {}
}

if (!customElements.get("essential-budget-panel")) customElements.define("essential-budget-panel", EssentialBudgetPanel);
