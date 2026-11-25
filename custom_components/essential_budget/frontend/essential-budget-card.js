/*
 * Essential Budget card for Home Assistant (loaded automatically by the integration).
 *
 * <essential-budget-card> shows the budget: key figures, income, annual gross, fixed costs by category
 * the detail view of a category and the debits by month. Admins edit the budget right in the card (editing.js),
 * the card options in the visual card editor (card-editor.js).
 *
 * Files next to this one:
 *   api.js         WebSocket commands of the integration
 *   model.js       the calculation
 *   view.js        the view as HTML
 *   format.js      texts (texts.js) and number formats
 *   export.js      Excel export (xlsx.js writes the file)
 *   version.js     hint after updates
 *   editing.js     editing (draft.js the draft, draft-store.js keeps it, edit-view.js its HTML)
 *   styles.js, html.js   shared parts
 *
 * All amounts are stored with cents and shown rounded to whole units of the currency set in
 * Home Assistant (Settings > System > General).
 */

import { getBudget, getInfo, onBudgetSaved } from "./api.js";
import { DEFAULT_PRIVACY_SECONDS, DEFAULT_UPCOMING_DAYS, MAX_UPCOMING_DAYS, MIN_PRIVACY_SECONDS } from "./card-editor.js";
import { dropDraft, keptDraft } from "./draft-store.js";
import { EDIT_ACTIONS, EDIT_INPUTS, markFields, renderEditing, startEditing } from "./editing.js";
import { downloadExcel } from "./export.js";
import { formatter, localeOf, translator } from "./format.js";
import { errorText, esc } from "./html.js";
import { buildModel, buildSchedule } from "./model.js";
import { BASE_STYLE, EDIT_STYLE, VIEW_STYLE } from "./styles.js";
import { reloadPage, renderUpdate, setOwnVersion, updateState } from "./version.js";
import { renderDetail, renderHeader, renderKeptDraft, renderKeyFigures, renderSchedule, renderView } from "./view.js";

const VERSION = new URL(import.meta.url).searchParams.get("v"); // set by the integration from manifest.json
setOwnVersion(VERSION);

/* Clicks: data-action of the clicked element -> what happens (card = the card, data = its data attributes). */
const ACTIONS = {
  export: (card) => downloadExcel(card._data, translator(card._hass), formatter(card._hass)),
  edit: (card) => startEditing(card),
  dropdraft(card) {
    dropDraft();
    card._render();
  },
  reload: (card) => reloadPage(card._integrationVersion),
  reveal: (card) => card._showNumbers(!card._numbersShown),
  toggle(card, { key }) {
    card._open.has(key) ? card._open.delete(key) : card._open.add(key);
    card._render();
  },
  detail(card, { key }) {
    card._detail = key;
    card._openPage();
  },
  schedule(card) {
    card._schedule = true;
    card._month = null;
    card._openPage();
  },
  month(card, { key }) {
    // tapping a month shows its debits, tapping it again the next days
    card._month = card._month === Number(key) ? null : Number(key);
    card._render();
  },
  back(card) {
    const category = card._detail;
    card._detail = null;
    card._schedule = false;
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
    this.attachShadow({ mode: "open" }).innerHTML =
      `<style>${BASE_STYLE}${VIEW_STYLE}${EDIT_STYLE}</style><ha-card><div class="root"></div></ha-card>`;
    this._root = this.shadowRoot.querySelector(".root");
    this._root.addEventListener("click", (e) => {
      const el = e.target.closest("[data-action]");
      if (!el) return;
      const action = (this._draft && EDIT_ACTIONS[el.dataset.action]) || ACTIONS[el.dataset.action];
      action?.(this, el.dataset);
    });
    const onInput = (e) => this._draft && EDIT_INPUTS[e.target.dataset?.bind]?.(this, e.target, e.type === "change");
    this._root.addEventListener("input", onInput);
    this._root.addEventListener("change", onInput);
    this._config = {};
    this._draft = null; // the budget while it is edited (null = not editing)
    this._edit = {}; // state of editing (see editing.js)
    this._limits = {}; // limits of the integration for the fields
    this._open = new Set(); // expanded categories
    this._detail = null; // category shown in the detail view
    this._schedule = false; // debits by month shown
    this._month = null; // month chosen in the debits by month (0 = this month)
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
    // the budget may have been saved elsewhere while this card was not shown (no updates then)
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
      const info = await getInfo(this._hass);
      version = info.version;
      this._limits = info.limits ?? {};
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

  /** Shows a detail view; it always starts at its top (on phones the page may be scrolled down). */
  _openPage() {
    this._render();
    if (this.getBoundingClientRect().top < 0) this.scrollIntoView({ block: "start" });
  }

  /**
   * Draws the card. focus = selector of the field to continue in (select = with its text selected);
   * without it a field that had the focus while editing keeps it.
   */
  _render(focus = null, select = false) {
    if (!this._hass) return;
    const t = translator(this._hass);
    focus ??= this._draft && focusSelector(this.shadowRoot.activeElement);
    this._root.lang = t.lang;
    this._root.classList.toggle("private", !this._draft && !this._numbersShown);
    this._root.classList.toggle("editing", !!this._draft);
    this._root.innerHTML = this._html(t);
    if (this._draft) markFields(this);
    if (focus) this._focus(focus, select);
  }

  /** While typing: only the parts that follow the typed values (data-live) are drawn again, the fields stay. */
  _patch() {
    const template = document.createElement("template");
    template.innerHTML = this._html(translator(this._hass));
    const now = this._root.querySelectorAll("[data-live]");
    const next = template.content.querySelectorAll("[data-live]");
    if (now.length !== next.length) return this._render();
    const active = this.shadowRoot.activeElement;
    now.forEach((el, i) => el.innerHTML !== next[i].innerHTML && !el.contains(active) && el.replaceWith(next[i]));
  }

  _focus(selector, select = false) {
    const el = this._root.querySelector(selector);
    if (el) select ? el.select?.() : el.focus();
  }

  _html(t) {
    return renderUpdate(updateState(this._integrationVersion), t) + this._renderBody(t);
  }

  _ctx(t) {
    return {
      t,
      fmt: formatter(this._hass),
      title: this._config.title,
      isAdmin: !!this._hass.user?.is_admin,
      numbersShown: this._numbersShown,
      open: this._open,
      month: this._month,
    };
  }

  /** The key figures (also while editing, from the draft). */
  _renderKpis(model) {
    return renderKeyFigures(model, this._ctx(translator(this._hass)));
  }

  _renderBody(t) {
    if (this._error) return `<div class="box msg err">${esc(this._error)}</div>`;
    if (!this._data) return "";
    const ctx = this._ctx(t);
    if (this._draft) return renderHeader(ctx, false) + renderEditing(this, ctx);
    // unsaved changes from before (admins): continue or discard
    ctx.kept = ctx.isAdmin && !!keptDraft(this._data);
    const model = buildModel(this._data);
    const schedule = buildSchedule(this._data);
    ctx.hasSchedule = schedule.any;
    // box "Next debits" of the overview (card option upcoming_days, 0 = no box)
    const days = Math.min(MAX_UPCOMING_DAYS, Math.max(0, Math.round(Number(this._config.upcoming_days ?? DEFAULT_UPCOMING_DAYS)) || 0));
    ctx.upcoming = schedule.any && days ? { days, items: buildSchedule(this._data, new Date(), days).upcoming } : null;
    if (this._schedule && schedule.any) return renderSchedule(model, schedule, ctx);
    this._schedule = false; // no debit dates (any more)
    const group = this._detail !== null && model.groups.find((g) => g.category === this._detail);
    if (!group) this._detail = null; // the category is gone
    return group ? renderDetail(model, group, ctx) : renderView(model, ctx);
  }
}

/** A selector that finds a field again after drawing (by what it edits). */
const focusSelector = (el) => {
  if (!el?.dataset?.bind) return null;
  const keys = ["bind", "list", "id", "field", "person", "key"].filter((k) => el.dataset[k] !== undefined);
  return keys.map((k) => `[data-${k}="${CSS.escape(el.dataset[k])}"]`).join("");
};

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
