/*
 * Essential Budget card for Home Assistant (loaded automatically by the integration).
 *
 * <essential-budget-card> shows the budget: key figures, income, annual gross, fixed costs by category
 * and the detail view of a category. The budget is edited on the edit page (panel.js, editor.js),
 * the card options in the visual card editor (card-editor.js).
 *
 * Files next to this one:
 *   api.js         WebSocket commands of the integration
 *   model.js       the calculation
 *   view.js        the view as HTML
 *   format.js      texts (texts.js) and number formats
 *   export.js      Excel export (xlsx.js writes the file)
 *   version.js     hint after updates
 *   draft.js, edit-view.js, editor.js, panel.js   the edit page
 *   styles.js, html.js, navigation.js             shared parts
 *
 * All amounts are stored with cents and shown rounded to whole units of the currency set in
 * Home Assistant (Settings > System > General).
 */

import { getBudget, getInfo, onBudgetSaved } from "./api.js";
import { DEFAULT_PRIVACY_SECONDS, MIN_PRIVACY_SECONDS } from "./card-editor.js";
import { downloadExcel } from "./export.js";
import { formatter, localeOf, translator } from "./format.js";
import { errorText, esc } from "./html.js";
import { buildModel } from "./model.js";
import { openEditPage } from "./navigation.js";
import "./panel.js";
import { BASE_STYLE, VIEW_STYLE } from "./styles.js";
import { reloadPage, renderUpdate, setOwnVersion, updateState } from "./version.js";
import { renderDetail, renderView } from "./view.js";

const VERSION = new URL(import.meta.url).searchParams.get("v"); // set by the integration from manifest.json
setOwnVersion(VERSION);

/* Clicks: data-action of the clicked element -> what happens (card = the card, data = its data attributes). */
const ACTIONS = {
  export: (card) => downloadExcel(card._data, translator(card._hass), formatter(card._hass).symbol),
  openedit: (card) => openEditPage(card._hass, card),
  reload: (card) => reloadPage(card._integrationVersion),
  reveal: (card) => card._showNumbers(!card._numbersShown),
  toggle(card, { key }) {
    card._open.has(key) ? card._open.delete(key) : card._open.add(key);
    card._render();
  },
  detail(card, { key }) {
    card._detail = key;
    card._render();
    // the detail view always starts at its top (on phones the page may be scrolled down)
    if (card.getBoundingClientRect().top < 0) card.scrollIntoView({ block: "start" });
  },
  back(card) {
    const category = card._detail;
    card._detail = null;
    card._render();
    // back at the category the detail view was opened from
    const row = card._root.querySelector(`[data-action="detail"][data-key="${CSS.escape(category ?? "")}"]`);
    const rect = row?.getBoundingClientRect();
    if (rect && (rect.top < 0 || rect.bottom > window.innerHeight)) row.scrollIntoView({ block: "center" });
  },
};

class EssentialBudgetCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" }).innerHTML = `<style>${BASE_STYLE}${VIEW_STYLE}</style><ha-card><div class="root"></div></ha-card>`;
    this._root = this.shadowRoot.querySelector(".root");
    this._root.addEventListener("click", (e) => {
      const el = e.target.closest("[data-action]");
      if (el) ACTIONS[el.dataset.action]?.(this, el.dataset);
    });
    this._config = {};
    this._open = new Set(); // expanded categories
    this._detail = null; // category shown in the detail view
    this._shown = null; // numbers shown? null = as the card options say
    // privacy mode: hide the numbers again as soon as the app or browser tab goes to the background
    this._onVisibility = () => document.hidden && this._hideIfPrivate();
    // connection is back (Home Assistant restarted, app reopened): the budget or the version may have changed
    this._onReady = () => {
      this._checkVersion();
      this._load();
    };
  }

  /* ---------------- Home Assistant card interface ---------------- */

  static getConfigElement() {
    return document.createElement("essential-budget-card-editor");
  }

  static getStubConfig() {
    return {};
  }

  setConfig(config) {
    if (!!config?.privacy !== !!this._config.privacy) this._shown = null;
    this._config = config || {};
    this._render();
  }

  set hass(hass) {
    const first = !this._hass;
    const localeChanged = !first && localeOf(hass) !== localeOf(this._hass);
    this._hass = hass;
    if (first) {
      this._connect();
      this._load();
    } else if (localeChanged) this._render();
  }

  getCardSize() {
    return 12;
  }

  getGridOptions() {
    return { columns: 12, min_columns: 6, rows: "auto" };
  }

  connectedCallback() {
    document.addEventListener("visibilitychange", this._onVisibility);
    if (!this._hass) return;
    this._connect();
    // the budget may have been saved on the edit page while this card was not shown (no updates then)
    if (this._data) this._load();
  }

  disconnectedCallback() {
    document.removeEventListener("visibilitychange", this._onVisibility);
    this._disconnect();
    this._hideIfPrivate(false);
  }

  /* ---------------- Data ---------------- */

  /** Listens for saved budgets and reconnects while the card is on the page. */
  _connect() {
    if (this._unsubscribe || !this._hass?.connection) return;
    this._unsubscribe = onBudgetSaved(this._hass, () => this._load()).catch(() => null);
    this._hass.connection.addEventListener("ready", this._onReady);
    this._checkVersion();
  }

  _disconnect() {
    const pending = this._unsubscribe;
    if (!pending) return;
    this._unsubscribe = null;
    this._hass.connection.removeEventListener("ready", this._onReady);
    pending.then((unsubscribe) => unsubscribe?.());
  }

  async _load() {
    try {
      this._data = await getBudget(this._hass);
      this._error = null;
    } catch (e) {
      this._error = e?.code === "not_found" ? translator(this._hass)("not_set_up") : `${translator(this._hass)("error")}: ${errorText(e)}`;
    }
    this._render();
  }

  async _checkVersion() {
    let version = null;
    try {
      ({ version } = await getInfo(this._hass));
    } catch (e) {
      /* not reachable: nothing to compare */
    }
    if (version === this._integrationVersion) return;
    this._integrationVersion = version;
    this._render();
  }

  /* ---------------- Showing and hiding the numbers ---------------- */

  /** With the privacy mode the numbers start hidden, without it they start shown. */
  get _numbersShown() {
    return this._shown ?? !this._config.privacy;
  }

  /**
   * Shows or hides all numbers. With the privacy mode shown numbers are hidden again after
   * privacy_seconds, when the page goes to the background or when the card is left;
   * without it they stay hidden until the page is reloaded.
   */
  _showNumbers(shown, render = true) {
    clearTimeout(this._hideTimer);
    this._shown = shown;
    if (shown && this._config.privacy) {
      const seconds = Math.max(MIN_PRIVACY_SECONDS, Number(this._config.privacy_seconds) || DEFAULT_PRIVACY_SECONDS);
      this._hideTimer = setTimeout(() => this._showNumbers(false), seconds * 1000);
    }
    if (render) this._render();
  }

  _hideIfPrivate(render = true) {
    if (this._config.privacy && this._numbersShown) this._showNumbers(false, render);
  }

  /* ---------------- Rendering ---------------- */

  _render() {
    if (!this._hass) return;
    const t = translator(this._hass);
    this._root.lang = t.lang;
    this._root.classList.toggle("private", !this._numbersShown);
    this._root.innerHTML = renderUpdate(updateState(this._integrationVersion), t) + this._renderBody(t);
  }

  _renderBody(t) {
    if (this._error) return `<div class="box msg err">${esc(this._error)}</div>`;
    if (!this._data) return "";
    const ctx = {
      t,
      fmt: formatter(this._hass),
      title: this._config.title,
      isAdmin: !!this._hass.user?.is_admin,
      numbersShown: this._numbersShown,
      open: this._open,
    };
    const model = buildModel(this._data);
    const group = this._detail !== null && model.groups.find((g) => g.category === this._detail);
    if (!group) this._detail = null; // the category is gone
    return group ? renderDetail(model, group, ctx) : renderView(model, ctx);
  }
}

if (!customElements.get("essential-budget-card")) {
  customElements.define("essential-budget-card", EssentialBudgetCard);
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: "essential-budget-card",
    name: "Essential Budget",
    description: "Household budget: income, fixed costs and budget per person",
    preview: false,
  });
  console.info(`%c ESSENTIAL-BUDGET-CARD %c ${VERSION ?? ""} `, "background:#1f7a5c;color:#fff", "");
}
