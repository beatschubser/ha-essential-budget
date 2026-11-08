/* Essential Budget card for Home Assistant (loaded automatically by the integration).
 *
 * - EssentialBudgetCard shows the budget. On the edit page it runs in edit mode; the budget is then
 *   saved with its own button to /config/.storage/essential_budget.json.
 * - EssentialBudgetPanel is the edit page (/essential-budget, admins only, no sidebar entry). It is
 *   linked from the card editor and from the "Configure" button of the integration.
 * - EssentialBudgetCardEditor is the visual card editor (title and privacy mode; grid options are kept).
 *
 * All amounts are stored with cents and shown rounded to whole units of the currency set in
 * Home Assistant (Settings > System > General).
 * Layout: one column on narrow cards, desktop layout from 700 px (container query).
 * Texts are in texts.js, styles in styles.js (served next to this file).
 */

import { TEXTS } from "./texts.js";
import { PANEL_STYLE, STYLE } from "./styles.js";
import { buildXlsx } from "./xlsx.js";

const VERSION = "0.2.7";
const WS = "essential_budget";
const PERSONS = ["a", "b"];
const PERSON_COLORS = { a: "#2f6fde", b: "#d9822b", shared: "#7a8794" }; // defaults; persons can get own colors in the edit mode
// Category colors, assigned in alphabetical order of the category names
const PALETTE = ["#2f6fde", "#7c5cd6", "#d9822b", "#1f8f74", "#b0436e", "#0e7c99", "#8a6d1f", "#a23b3b", "#4b8b2f", "#5f6b78"];
const INTERVALS = [1, 3, 12]; // months between two payments offered in the edit mode; any other value via "Other interval"
const MAX_INTERVAL = 120;
const LISTS = ["income", "special_payments", "shared_income", "fixed_costs"];
const AMOUNT_FIELDS = ["amount", "gross"]; // text fields in the edit mode that hold amounts (gross is optional)
const FALLBACK_CURRENCY = "EUR"; // if Home Assistant has no currency set
const SAVED_NOTE_MS = 4000; // how long "Saved" is shown in the edit mode
const DEFAULT_PRIVACY_SECONDS = 30; // privacy mode: numbers are hidden again after this time
const PANEL_PATH = "/essential-budget"; // edit page, registered by the integration (const.PANEL_URL_PATH)

const pickLanguage = (hass) => {
  const lang = String(hass?.locale?.language || hass?.language || "en").toLowerCase().split(/[-_]/)[0];
  return TEXTS[lang] ? lang : "en";
};

const pickLocale = (hass) => {
  const raw = String(hass?.locale?.language || hass?.language || "en").replace("_", "-");
  try {
    return Intl.NumberFormat.supportedLocalesOf([raw]).length ? raw : "en";
  } catch (e) {
    return "en";
  }
};

/* ---------------------------------------------------------------------
 * Helpers
 * --------------------------------------------------------------------- */

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const uid = () => "r" + Math.random().toString(36).slice(2, 10);
const sum = (xs) => xs.reduce((s, x) => s + x, 0);
const errorText = (e) => e?.message || String(e);
const pct = (part, whole) => (whole > 0 ? Math.round((part / whole) * 100) : 0);
const monthly = (cost) => cost.amount / cost.interval_months;
/** Color of a person: own color from the file or the default. */
const personColor = (data, p) => data.colors?.[p] || PERSON_COLORS[p];
const validInterval = (v) => /^\s*\d+\s*$/.test(String(v)) && Number(v) >= 1 && Number(v) <= MAX_INTERVAL;
/** ["a"] for one person, ["a", "b"] when the second person has a name. */
const activePersons = (persons) => PERSONS.filter((p) => p === "a" || String(persons?.[p] || "").trim());

const sessionGet = (key) => {
  try {
    return sessionStorage.getItem(key);
  } catch (e) {
    return null;
  }
};
const sessionSet = (key, value) => {
  try {
    sessionStorage.setItem(key, value);
  } catch (e) {
    /* storage blocked: nothing to remember */
  }
};

/**
 * Reads an amount typed by the user: "1.480,50", "1480.5", "1 480,50 €", "1,480.50".
 * Returns a number rounded to cents, or null if it is not a valid amount (empty counts as 0).
 */
const parseAmount = (text) => {
  let s = String(text ?? "").replace(/[\s  €$£]|CHF/g, "");
  if (s === "") return 0;
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  if (lastComma >= 0 && lastDot >= 0) {
    // both: the later one separates the cents
    s = lastComma > lastDot ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
  } else if (lastComma >= 0) {
    s = /^\d{1,3}(,\d{3})+$/.test(s) && !/,\d{1,2}$/.test(s) ? s.replace(/,/g, "") : s.replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
    s = s.replace(/\./g, ""); // 1.480 = thousands
  }
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  const value = Math.round(Number(s) * 100) / 100;
  return Number.isFinite(value) ? value : null;
};

/** The nearest ancestor with the given tag name, searched across shadow roots. */
const findAncestor = (el, tagName) => {
  for (let n = el; n; n = n.parentNode || n.host) {
    if (n.tagName === tagName) return n;
  }
  return null;
};

/** Opens a page of Home Assistant without reloading (like a link in the frontend). */
const navigate = (path) => {
  history.pushState(null, "", path);
  window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: false } }));
};

/**
 * Opens the edit page. From the card editor the dialog is closed first; if it keeps open
 * (unsaved card options, Home Assistant asks), nothing happens.
 */
const openEditPage = (from) => {
  const dialog = findAncestor(from, "HUI-DIALOG-EDIT-CARD");
  if (dialog?.closeDialog?.() === false) return;
  navigate(PANEL_PATH);
};

/** Negative if version a is older than b. "0.2.0-beta.1" is older than "0.2.0". */
const compareVersions = (a, b) => {
  const parse = (v) => {
    const [main, pre = ""] = String(v).split("-");
    return { numbers: main.split(".").map(Number), pre };
  };
  const x = parse(a);
  const y = parse(b);
  for (let i = 0; i < 3; i++) if ((x.numbers[i] || 0) !== (y.numbers[i] || 0)) return (x.numbers[i] || 0) - (y.numbers[i] || 0);
  if (x.pre === y.pre) return 0;
  if (!x.pre || !y.pre) return x.pre ? -1 : 1;
  return x.pre.localeCompare(y.pre, "en", { numeric: true });
};

/** "restart" = update downloaded but HA still runs the old integration, "reload" = the page runs old card code. */
const checkVersion = async (hass) => {
  let version;
  try {
    ({ version } = await hass.callWS({ type: `${WS}/version` }));
  } catch (e) {
    return null;
  }
  if (version === VERSION) return null;
  return { state: compareVersions(version, VERSION) < 0 ? "restart" : "reload", version };
};

/* ---------------------------------------------------------------------
 * Calculation (same rules as logic.py)
 * --------------------------------------------------------------------- */

const buildModel = (data) => {
  const active = activePersons(data.persons);
  const people = active.map((p) => {
    const items = data.income.filter((i) => i.person === p);
    // annual gross = 12 × monthly gross of the income + gross of the special payments (listed below the net income)
    const grossItems = [
      ...items.filter((i) => i.gross != null).map((i) => ({ name: i.name, value: i.gross * 12, monthly: i.gross })),
      ...data.special_payments.filter((i) => i.person === p).map((i) => ({ name: i.name, value: i.gross })),
    ];
    return {
      key: p,
      name: data.persons[p],
      color: personColor(data, p),
      items,
      sum: sum(items.map((i) => i.amount)),
      grossItems,
      gross: sum(grossItems.map((i) => i.value)),
    };
  });
  const sharedSum = sum(data.shared_income.map((i) => i.amount));
  const incomeTotal = sum(people.map((p) => p.sum)) + sharedSum;

  const costs = data.fixed_costs.map((c) => ({ ...c, monthly: monthly(c) }));
  const costTotal = sum(costs.map((c) => c.monthly));
  const names = [...new Set(costs.map((c) => c.category))].sort((a, b) => a.localeCompare(b));
  const groups = names
    .map((category, i) => {
      const items = costs.filter((c) => c.category === category).sort((a, b) => b.monthly - a.monthly);
      return { category, color: PALETTE[i % PALETTE.length], items, sum: sum(items.map((c) => c.monthly)) };
    })
    .sort((a, b) => b.sum - a.sum);

  const budgetPerPerson = active.map((p) => {
    const own = sum(data.income.filter((i) => i.person === p).map((i) => i.amount));
    const shared = sum(data.shared_income.filter((i) => i.to === p).map((i) => i.amount));
    const cost = sum(costs.filter((c) => c.person === p).map((c) => c.monthly));
    return { key: p, name: data.persons[p], color: personColor(data, p), value: own + shared - cost };
  });

  return {
    people,
    shared: data.shared_income,
    sharedSum,
    incomeTotal,
    groups,
    costTotal,
    budget: incomeTotal - costTotal,
    budgetPerPerson,
    single: active.length === 1,
    empty: LISTS.every((k) => !data[k].length),
  };
};

/* =====================================================================
 * Card
 * ===================================================================== */

class EssentialBudgetCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" }).innerHTML = `<style>${STYLE}</style><ha-card><div class="root"></div></ha-card>`;
    this._root = this.shadowRoot.querySelector(".root");
    this._root.addEventListener("click", (e) => this._onClick(e));
    this._root.addEventListener("input", (e) => this._onInput(e));
    this._root.addEventListener("change", (e) => this._onInput(e));
    this._root.addEventListener("focusout", (e) => this._onBlur(e));
    // privacy mode: hide the numbers again as soon as the app or browser tab goes to the background
    this._onVisibility = () => document.hidden && this._setRevealed(false);
    this._config = {};
    this._open = new Set(); // expanded categories
  }

  static getConfigElement() {
    return document.createElement("essential-budget-card-editor");
  }

  static getStubConfig() {
    return {};
  }

  setConfig(config) {
    this._config = config || {};
    if (this._hass) this._render();
  }

  /** Set by the edit page: the card then always runs in edit mode (dashboards only show the budget). */
  set editPage(value) {
    this._editPage = !!value;
    this._syncEdit();
  }

  /** Starts the edit mode on the edit page; true if it did. */
  _autoEdit() {
    if (this._draft || !this._data || !this._isAdmin || !this._editPage) return false;
    this._startEdit();
    return true;
  }

  _syncEdit() {
    if (this._autoEdit()) this._render();
  }

  set hass(hass) {
    const first = !this._hass;
    const langChanged = this._hass && pickLocale(hass) !== this._locale;
    this._hass = hass;
    this._lang = pickLanguage(hass);
    this._locale = pickLocale(hass);
    if (first) {
      this._load();
      this._subscribe();
    } else {
      this._syncEdit();
      if (langChanged && !this._draft) this._render();
    }
  }

  getCardSize() {
    return 12;
  }

  getGridOptions() {
    return { columns: 12, min_columns: 6, rows: "auto" };
  }

  connectedCallback() {
    if (this._hass) {
      this._subscribe();
      // the budget may have been saved on the edit page while this card was not shown (no updates then)
      if (this._data && !this._draft) this._load();
    }
    document.addEventListener("visibilitychange", this._onVisibility);
    this._syncEdit();
  }

  disconnectedCallback() {
    this._unsubscribe();
    document.removeEventListener("visibilitychange", this._onVisibility);
    this._setRevealed(false, false);
  }

  /**
   * Privacy mode: show or hide all numbers. Shown numbers are hidden again after
   * privacy_seconds, when the page goes to the background or when the card is left.
   */
  _setRevealed(value, render = true) {
    clearTimeout(this._revealTimer);
    this._revealed = !!value && !!this._config.privacy;
    if (this._revealed) {
      const seconds = Number(this._config.privacy_seconds) || DEFAULT_PRIVACY_SECONDS;
      this._revealTimer = setTimeout(() => this._setRevealed(false), Math.max(5, seconds) * 1000);
    }
    if (render) this._render();
  }

  t(key, vars = {}) {
    const text = key.split(".").reduce((o, k) => (o ? o[k] : undefined), TEXTS[this._lang]) ??
      key.split(".").reduce((o, k) => (o ? o[k] : undefined), TEXTS.en) ?? key;
    return String(text).replace(/\{(\w+)\}/g, (_, v) => vars[v] ?? "");
  }

  get _isAdmin() {
    return !!this._hass?.user?.is_admin;
  }

  _money(value) {
    try {
      return new Intl.NumberFormat(this._locale, {
        style: "currency",
        currency: this._currencyCode,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    } catch (e) {
      return `${Math.round(value)} ${this._currencyCode}`;
    }
  }

  /** A number for the view: wrapped so that the privacy mode can blur it. */
  _num(value, money = true) {
    return `<span class="num">${esc(money ? this._money(value) : value)}</span>`;
  }

  /** A text with a number in it ("{p} der Einnahmen"), the number wrapped like _num. */
  _withNum(key, placeholder, value) {
    const marker = "\u0000";
    return esc(this.t(key, { [placeholder]: marker })).replace(marker, this._num(value, false));
  }

  get _currencyCode() {
    return String(this._hass?.config?.currency || FALLBACK_CURRENCY).trim().toUpperCase();
  }

  /** Symbol shown next to amount fields, e.g. "€" (the code if the browser does not know it). */
  get _currencySymbol() {
    try {
      const parts = new Intl.NumberFormat(this._locale, { style: "currency", currency: this._currencyCode }).formatToParts(0);
      return parts.find((p) => p.type === "currency")?.value || this._currencyCode;
    } catch (e) {
      return this._currencyCode;
    }
  }

  _freq(n) {
    return TEXTS[this._lang].freq[n] || TEXTS.en.freq[n] || this.t("freq.n", { n });
  }

  /* ---------------- Data ---------------- */

  _subscribe() {
    if (this._unsub || !this._hass?.connection) return;
    this._unsub = this._hass.connection
      .subscribeMessage(() => !this._draft && this._load(), { type: `${WS}/subscribe` })
      .catch(() => (this._unsub = null));
    this._onReady = () => {
      this._checkVersion();
      if (!this._draft) this._load();
    };
    this._hass.connection.addEventListener?.("ready", this._onReady);
    this._checkVersion();
  }

  async _unsubscribe() {
    const pending = this._unsub;
    this._unsub = null;
    if (this._onReady) this._hass?.connection?.removeEventListener?.("ready", this._onReady);
    this._onReady = null;
    if (pending) (await pending)?.();
  }

  async _load() {
    try {
      const result = await this._hass.callWS({ type: `${WS}/get` });
      this._data = result.data;
      this._error = null;
      this._notSetUp = false;
      this._autoEdit();
    } catch (e) {
      this._notSetUp = e?.code === "not_found";
      this._error = errorText(e);
    }
    this._render();
  }

  async _checkVersion() {
    let update = await checkVersion(this._hass);
    if (update?.state === "reload" && sessionGet(`eb-reloaded-${update.version}`)) update = null;
    if (JSON.stringify(update) !== JSON.stringify(this._update ?? null)) {
      this._update = update;
      if (!this._draft) this._render();
    }
  }

  /* ---------------- Interaction ---------------- */

  _onClick(e) {
    const el = e.target.closest("[data-action]");
    if (!el) return;
    const { action, key, list, id } = el.dataset;
    switch (action) {
      case "export":
        this._export();
        return;
      case "openedit":
        openEditPage(this);
        return;
      case "reload":
        sessionSet(`eb-reloaded-${this._update.version}`, "1");
        location.reload();
        return;
      case "reveal":
        // privacy mode: show for a while; otherwise: hide until the page is reloaded
        if (this._config.privacy) this._setRevealed(!this._revealed);
        else {
          this._hidden = !this._hidden;
          this._render();
        }
        return;
      case "toggle":
        this._open.has(key) ? this._open.delete(key) : this._open.add(key);
        break;
      case "detail":
        this._detail = key;
        break;
      case "back":
        this._detail = null;
        break;
      case "cancel":
        // discard: start again from the saved budget (the edit mode stays open)
        this._draft = null;
        this._saveError = null;
        this._autoEdit();
        break;
      case "save":
        this._save();
        return;
      case "add":
        this._addRow(list, el.dataset.person);
        this._render();
        this._focusRow(list);
        return;
      case "remove":
        this._draft[list] = this._draft[list].filter((r) => r._id !== id);
        break;
      case "addperson":
        this._addingPerson = true;
        this._editTab = "b";
        this._render();
        this._root.querySelector('[data-list="persons"][data-field="b"]')?.focus();
        return;
      case "resetcolor":
        delete this._draft.colors[key];
        break;
      case "edittab":
        this._editTab = key;
        this._renaming = false;
        break;
      case "tab":
        this._costTab = key;
        this._renaming = false;
        break;
      case "newcat": {
        // a new tab with one empty entry (empty entries are not saved)
        const name = this._freshCategory();
        this._addRow("fixed_costs");
        this._draft.fixed_costs.find((r) => r._id === this._lastAdded).category = name;
        this._costTab = name;
        this._renaming = true;
        this._render();
        this._root.querySelector(".tab-rename")?.select();
        return;
      }
      case "rename":
        this._renaming = !this._renaming;
        this._render();
        this._root.querySelector(".tab-rename")?.select();
        return;
      default:
        return;
    }
    this._render();
  }

  /* ---------------- Edit mode ---------------- */

  _startEdit() {
    const amount = (v) =>
      new Intl.NumberFormat(this._locale, { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: false }).format(v);
    const d = this._data;
    this._draft = { persons: { ...d.persons }, colors: { ...(d.colors || {}) } };
    for (const list of LISTS)
      this._draft[list] = d[list].map((item) => ({
        ...item,
        ...(item.amount != null ? { amount: amount(item.amount) } : {}),
        ...(list === "income" || list === "special_payments" ? { gross: item.gross != null ? amount(item.gross) : "" } : {}),
        ...(list === "fixed_costs" ? { interval_months: String(item.interval_months), _custom: !INTERVALS.includes(item.interval_months) } : {}),
        _id: uid(),
      }));
    this._detail = null;
    this._saveError = null;
    this._renaming = false;
    this._addingPerson = false;
  }

  /** Categories of the fixed costs in the edit mode (alphabetical, "" = without category). */
  _costCategories() {
    const names = new Set(this._draft.fixed_costs.map((r) => r.category.trim()));
    return [...names].sort((a, b) => a.localeCompare(b));
  }

  _activeCostTab(categories = this._costCategories()) {
    if (!categories.includes(this._costTab)) this._costTab = categories[0] ?? "";
    return this._costTab;
  }

  /** A new category name that does not exist yet ("New category", "New category 2", ...). */
  _freshCategory() {
    const base = this.t("new_category_name");
    const taken = new Set(this._costCategories());
    let name = base;
    for (let i = 2; taken.has(name); i++) name = `${base} ${i}`;
    return name;
  }

  _addRow(list, person) {
    const row = { _id: uid(), name: "" };
    if (list !== "special_payments") row.amount = "";
    if (list === "income" || list === "special_payments") Object.assign(row, { person: person || "a", gross: "" });
    if (list === "shared_income") row.to = "a";
    if (list === "fixed_costs") Object.assign(row, { category: this._activeCostTab(), person: "a", interval_months: "1", _custom: false });
    this._draft[list].push(row);
    this._lastAdded = row._id;
  }

  _focusRow(list) {
    this._root.querySelector(`[data-id="${this._lastAdded}"] input`)?.focus();
  }

  /** Typing only updates the draft (no re-render, so the focus stays). */
  _onInput(e) {
    if (!this._draft) return;
    const el = e.target;
    const { list, id, field } = el.dataset;
    if (!field) return;
    if (list === "cat-rename") {
      if (e.type !== "change") return;
      // rename the active category for all its entries (an existing name merges both)
      const from = this._costTab;
      const to = el.value.replace(/\s+/g, " ").trim();
      for (const r of this._draft.fixed_costs) if (r.category.trim() === from) r.category = to;
      this._costTab = to;
      this._renaming = false;
      this._render();
      return;
    }
    if (list === "colors") {
      this._draft.colors[field] = el.value;
      if (e.type === "change") this._render(); // tab dot and reset button
      return;
    }
    if (list === "persons") {
      this._draft.persons[field] = el.value;
      // on leaving the field: show or hide the sections of the second person
      if (e.type === "change") this._render(); // tab label and person selects show the new name
      return;
    }
    const row = this._draft[list]?.find((r) => r._id === id);
    if (!row) return;
    if (AMOUNT_FIELDS.includes(field) && /[^\d.,]/.test(el.value)) {
      // only digits and separators: a pasted currency sign or spaces are removed right away
      const caret = el.selectionStart ?? el.value.length;
      const removedBefore = el.value.slice(0, caret).replace(/[\d.,]/g, "").length;
      el.value = el.value.replace(/[^\d.,]/g, "");
      el.setSelectionRange?.(caret - removedBefore, caret - removedBefore);
    }
    if (field === "interval_select") {
      // fixed intervals or "Other interval": the select becomes a number field for the months
      if (el.value === "custom") row._custom = true;
      else Object.assign(row, { interval_months: el.value, _custom: false });
      this._render();
      if (row._custom) this._root.querySelector(`[data-id="${id}"][data-field="interval_months"]`)?.select();
      return;
    }
    if (field === "interval_months") {
      el.value = el.value.replace(/\D/g, "");
      el.style.width = `${Math.max(1, el.value.length) + 0.4}ch`; // "N Monate" reads like the text of a select
      row.interval_months = el.value;
      if (el.classList.contains("invalid")) el.classList.toggle("invalid", !validInterval(el.value));
      // on leaving the field: 1, 3 or 12 months go back to the select
      if (e.type === "change" && INTERVALS.includes(Number(el.value))) {
        row.interval_months = String(Number(el.value));
        row._custom = false;
        this._render();
      }
      return;
    }
    row[field] = el.value;
    if (el.classList.contains("invalid")) this._markField(el);
  }

  _onBlur(e) {
    if (this._draft && AMOUNT_FIELDS.includes(e.target.dataset?.field)) this._markField(e.target);
  }

  _markField(el) {
    el.classList.toggle("invalid", parseAmount(el.value) === null);
  }

  async _save() {
    const colors = Object.fromEntries(Object.entries(this._draft.colors).filter(([, c]) => c));
    const data = { persons: { ...this._draft.persons }, ...(Object.keys(colors).length ? { colors } : {}) };
    let invalid = false;
    for (const list of LISTS) {
      data[list] = this._draft[list].map(({ _id, _custom, ...row }) => {
        const result = { ...row };
        if ("amount" in row) {
          const amount = parseAmount(row.amount);
          if (amount === null) invalid = true;
          result.amount = amount ?? 0;
        }
        if (list === "fixed_costs") {
          if (!validInterval(row.interval_months)) invalid = true;
          result.interval_months = Number(row.interval_months) || 1;
        }
        if (list === "special_payments") {
          // the gross is the only amount of a special payment
          const gross = parseAmount(row.gross);
          if (gross === null) invalid = true;
          result.gross = gross ?? 0;
        } else if ("gross" in row) {
          // optional: an empty field means no gross for this entry
          const empty = String(row.gross ?? "").trim() === "";
          const gross = empty ? null : parseAmount(row.gross);
          if (gross === null) delete result.gross;
          else result.gross = gross;
          if (!empty && gross === null) invalid = true;
        }
        return result;
      });
    }
    if (activePersons(data.persons).length === 1) {
      // without a second person everything belongs to the first one; income of the second person must be moved or removed first
      if (data.income.some((r) => r.person === "b") || data.special_payments.some((r) => r.person === "b")) {
        this._showProblem("b", this.t("second_person_in_use"));
        return;
      }
      data.shared_income.forEach((r) => (r.to = "a"));
      data.fixed_costs.forEach((r) => (r.person = "a"));
    }
    if (invalid) {
      // open the tab (and category) of the first invalid amount and mark the fields there
      const badGross = (l, r) => (l === "special_payments" ? parseAmount(r.gross) === null : "gross" in r && String(r.gross ?? "").trim() !== "" && parseAmount(r.gross) === null);
      const bad = (l) => (r) =>
        ("amount" in r && parseAmount(r.amount) === null) || badGross(l, r) || (l === "fixed_costs" && !validInterval(r.interval_months));
      const list = LISTS.find((l) => this._draft[l].some(bad(l)));
      const row = this._draft[list].find(bad(list));
      if (list === "fixed_costs") this._costTab = row.category.trim();
      this._showProblem(list === "fixed_costs" ? "costs" : list === "shared_income" ? "shared" : row.person, this.t("invalid"));
      return;
    }
    this._saving = true;
    this._render();
    try {
      const result = await this._hass.callWS({ type: `${WS}/save`, data });
      this._data = result.data;
      this._draft = null;
      this._saveError = null;
      this._autoEdit(); // continue editing with the saved values
      this._savedAt = Date.now();
      clearTimeout(this._savedTimer);
      this._savedTimer = setTimeout(() => this._draft && this._render(), SAVED_NOTE_MS + 50);
    } catch (e) {
      this._saveError = `${this.t("save_failed")}: ${errorText(e)}`;
    }
    this._saving = false;
    this._render();
  }

  /** Shows a save problem on the given edit tab and marks invalid amounts there. */
  _showProblem(tab, text) {
    this._editTab = tab;
    this._saveError = text;
    this._render();
    this._root.querySelectorAll(AMOUNT_FIELDS.map((f) => `[data-field="${f}"]`).join(",")).forEach((el) => this._markField(el));
    this._root.querySelectorAll('input[data-field="interval_months"]').forEach((el) => el.classList.toggle("invalid", !validInterval(el.value)));
  }


  /* ---------------- Rendering ---------------- */

  _render() {
    if (!this._hass) return;
    let update = "";
    if (this._update?.state === "reload")
      update = `<button class="update" data-action="reload">${esc(this.t("update_available"))}</button>`;
    if (this._update?.state === "restart") update = `<div class="update">${esc(this.t("restart_needed"))}</div>`;

    let body;
    if (this._error)
      body = `<div class="box msg err">${esc(this._notSetUp ? this.t("not_set_up") : `${this.t("error")}: ${this._error}`)}</div>`;
    else if (!this._data) body = "";
    else if (this._draft) body = this._renderEdit();
    else {
      const model = buildModel(this._data);
      const group = this._detail && model.groups.find((g) => g.category === this._detail);
      if (this._detail && !group) this._detail = null;
      body = group ? this._renderDetail(model, group) : this._renderView(model);
    }
    this._root.lang = this._lang;
    const hidden = this._config.privacy ? !this._revealed : !!this._hidden;
    this._root.classList.toggle("private", hidden && !this._draft);
    this._root.innerHTML = update + body;
  }

  /**
   * Title (optional) and the buttons: show/hide numbers (left on wide cards), Excel download and,
   * for admins, the edit page (right).
   */
  _header(actions = false) {
    const shown = this._config.privacy ? !!this._revealed : !this._hidden;
    const eye = actions
      ? `<button class="icon-btn eye" data-action="reveal" aria-pressed="${!shown}" title="${esc(this.t(shown ? "hide_numbers" : "show_numbers"))}" aria-label="${esc(this.t(shown ? "hide_numbers" : "show_numbers"))}"><ha-icon icon="${shown ? "mdi:eye-off-outline" : "mdi:eye-outline"}"></ha-icon></button>`
      : "";
    const buttons = actions
      ? `<div class="actions"><button class="icon-btn" data-action="export" title="${esc(this.t("export"))}" aria-label="${esc(this.t("export"))}"><ha-icon icon="mdi:microsoft-excel"></ha-icon></button>${
          this._isAdmin ? `<button class="icon-btn" data-action="openedit" title="${esc(this.t("edit_title"))}" aria-label="${esc(this.t("edit_title"))}"><ha-icon icon="mdi:cog-outline"></ha-icon></button>` : ""
        }</div>`
      : "";
    if (!this._config.title && !buttons) return "";
    return `<div class="header">${eye}${this._config.title ? `<h1 class="title">${esc(this._config.title)}</h1>` : ""}${buttons}</div>`;
  }

  /** Excel file with one sheet for the income and one for the fixed costs (formulas for sums and monthly values). */
  _export() {
    const d = this._data;
    const name = (p) => d.persons[p] || p;
    const two = activePersons(d.persons).length > 1;
    const money = (header) => ({ header, width: 16, money: true });
    const sumCol = (col, from, to, rows, pick) => ({ f: `SUM(${col}${from}:${col}${to})`, v: rows.reduce((s, r) => s + (pick(r) || 0), 0) });

    // income: person, type, name, gross per month, net per month, gross per year
    const inc = [
      ...d.income.map((i) => [name(i.person), this.t("xl_income"), i.name, i.gross ?? null, i.amount, null, i.gross ?? 0]),
      ...d.special_payments.map((s) => [name(s.person), this.t("xl_special"), s.name, null, null, s.gross, 0]),
      ...d.shared_income.map((s) => [name(s.to), this.t("xl_shared"), s.name, null, s.amount, null, 0]),
    ];
    const incRows = inc.map((r, i) => {
      const row = r.slice(0, 6);
      if (r[1] === this.t("xl_income") && r[3] !== null) row[5] = { f: `D${i + 2}*12`, v: r[3] * 12 };
      return row;
    });
    const n = incRows.length + 1;
    const incSum = [this.t("sum"), null, null, sumCol("D", 2, n, inc, (r) => r[3]), sumCol("E", 2, n, inc, (r) => r[4]),
      sumCol("F", 2, n, inc, (r) => (r[1] === this.t("xl_income") ? (r[3] || 0) * 12 : r[5]))];
    incSum.bold = true;

    // fixed costs: category, name, person, amount per payment, every N months, per month, per year
    const costs = [...d.fixed_costs].sort((a, b) => (a.category || "").localeCompare(b.category || "") || a.name.localeCompare(b.name));
    const costRows = costs.map((c, i) => {
      const r = i + 2;
      const row = [c.category || this.t("no_category"), c.name, name(c.person), c.amount, c.interval_months,
        { f: `D${r}/E${r}`, v: c.amount / c.interval_months }, { f: `F${r}*12`, v: (c.amount / c.interval_months) * 12 }];
      return two ? row : row.filter((_, k) => k !== 2);
    });
    const m = costRows.length + 1;
    const monthlyTotal = costs.reduce((s, c) => s + c.amount / c.interval_months, 0);
    const [colM, colY] = two ? ["F", "G"] : ["E", "F"];
    const costSum = [this.t("sum"), null, ...(two ? [null] : []), null, null,
      { f: `SUM(${colM}2:${colM}${m})`, v: monthlyTotal }, { f: `SUM(${colY}2:${colY}${m})`, v: monthlyTotal * 12 }];
    costSum.bold = true;
    // monthly and yearly formulas refer to the right columns when there is no person column
    if (!two) costRows.forEach((row, i) => {
      row[4] = { f: `C${i + 2}/D${i + 2}`, v: row[4].v };
      row[5] = { f: `E${i + 2}*12`, v: row[5].v };
    });

    const blob = buildXlsx([
      { name: this.t("income_edit"), columns: [
        { header: this.t("person"), width: 16 }, { header: this.t("xl_type"), width: 22 }, { header: this.t("name"), width: 28 },
        money(this.t("gross_month")), money(this.t("net_month")), money(this.t("gross_year"))],
        rows: [...incRows, incSum] },
      { name: this.t("fixed_costs"), columns: [
        { header: this.t("category"), width: 20 }, { header: this.t("name"), width: 28 }, ...(two ? [{ header: this.t("person"), width: 16 }] : []),
        money(this.t("per_payment")), { header: this.t("every_months"), width: 14 }, money(this.t("month")), money(this.t("year"))],
        rows: [...costRows, costSum] },
    ], this._currencySymbol);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${this.t("xl_file")} ${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 10000);
  }

  _section(icon, title, right = "", extra = "") {
    return `<div class="section-head"><ha-icon icon="${icon}"></ha-icon><h2>${esc(title)}</h2>${right ? `<span class="head-value">${right}</span>` : ""}</div>${extra}`;
  }

  _renderView(m) {
    if (m.empty)
      return `${this._header()}<div class="box msg">${esc(this.t(this._isAdmin ? "empty_admin" : "empty"))}${
        this._isAdmin ? `<button class="add" data-action="openedit"><ha-icon icon="mdi:pencil"></ha-icon>${esc(this.t("edit_title"))}</button>` : ""
      }</div>`;
    const negative = (v) => (v < 0 ? " negative" : "");

    const kpis = `<div class="kpis">
      <div class="box kpi"><span class="label">${esc(this.t("income"))}</span><span class="value">${this._num(m.incomeTotal)}</span><span class="sub">${esc(this.t("all_income"))}</span></div>
      <div class="box kpi"><span class="label">${esc(this.t("fixed_costs"))}</span><span class="value">${this._num(m.costTotal)}</span><span class="sub">${this._withNum("of_income", "p", `${pct(m.costTotal, m.incomeTotal)} %`)}</span></div>
      <div class="box kpi main ${m.budget < 0 ? "negative" : "positive"}"><span class="label">${esc(this.t("budget"))}</span><span class="value">${this._num(m.budget)}</span><span class="sub">${esc(this.t("after_costs"))}</span></div>
    </div>`;

    const lines = (items) =>
      items.map((i) => `<div class="line"><span class="ellipsis">${esc(i.name)}</span><span>${this._num(i.amount)}</span></div>`).join("");
    const block = (name, color, value, items, itemLines = lines(items)) =>
      `<div class="block"><div class="block-head"><span class="dot" style="background:${color}"></span><span class="grow">${esc(name)}</span><span class="strong">${this._num(value)}</span></div>${itemLines}</div>`;
    // annual gross per person: 12 × monthly gross of the income ("Gehalt (12 × 4.800 €)") and the special payments
    const grossLines = (p) =>
      p.grossItems
        .map(
          (i) =>
            `<div class="line"><span class="ellipsis">${esc(i.name)}${i.monthly != null ? ` <span class="small">(12 × ${this._num(i.monthly)})</span>` : ""}</span><span>${this._num(i.value)}</span></div>`
        )
        .join("");
    const grossPeople = m.people.filter((p) => p.grossItems.length);
    const income = `<div class="box">${this._section("mdi:cash-plus", this.t("income"))}
      <div class="blocks">${m.people.map((p) => block(p.name, p.color, p.sum, p.items)).join("")}
      ${m.shared.length ? block(this.t("shared"), PERSON_COLORS.shared, m.sharedSum, m.shared) : ""}</div></div>`;

    const maxGroup = Math.max(...m.groups.map((g) => g.sum), 0);
    const categoryName = (g) => g.category || this.t("no_category");
    const costs = `<div class="box">${this._section("mdi:receipt-text-outline", this.t("fixed_costs"))}
      ${m.groups
        .map((g) => {
          const open = g.items.length > 1 && this._open.has(g.category); // a single item needs no expanding
          const name = categoryName(g);
          const maxItem = Math.max(...g.items.map((c) => c.monthly), 0);
          const items = open
            ? `<div class="items">${g.items
                .map(
                  (c) => `<div class="item"><div class="item-main"><span class="ellipsis" title="${esc(c.name)}">${esc(c.name)}</span>
                  <span class="bar thin"><i style="width:${maxItem ? (c.monthly / maxItem) * 100 : 0}%;background:${g.color}"></i></span></div>
                  <span class="item-value">${this._num(c.monthly)}</span></div>`
                )
                .join("")}</div>`
            : "";
          return `<div class="cat">
            <div class="cat-row">
              ${g.items.length > 1
                ? `<button class="icon-btn" data-action="toggle" data-key="${esc(g.category)}" aria-expanded="${open}" aria-label="${esc(this.t(open ? "collapse" : "expand", { c: name }))}"><ha-icon icon="mdi:chevron-${open ? "down" : "right"}"></ha-icon></button>`
                : `<span class="toggle-space"></span>`}
              <button class="cat-btn" data-action="detail" data-key="${esc(g.category)}" aria-label="${esc(this.t("open_details", { c: name }))}">
                <span class="cat-main"><span class="ellipsis strong">${esc(name)}</span><span class="bar"><i style="width:${maxGroup ? (g.sum / maxGroup) * 100 : 0}%;background:${g.color}"></i></span></span>
                <span class="cat-share">${this._num(`${pct(g.sum, m.costTotal)} %`, false)}</span>
                <span class="cat-value">${this._num(g.sum)}</span>
                <ha-icon class="muted" icon="mdi:chevron-right"></ha-icon>
              </button>
            </div>${items}</div>`;
        })
        .join("")}</div>`;

    const perPerson = `<div class="box">${this._section("mdi:wallet-outline", this.t("budget_per_person"))}
      ${m.budgetPerPerson
        .map((p) => `<div class="row"><span class="strong" style="color:${p.color}">${esc(p.name)}</span><span class="strong${negative(p.value)}">${this._num(p.value)}</span></div>`)
        .join("")}</div>`;

    // With one person the budget per person equals the budget: no extra box.
    // Left column: income (net, annual gross) and the budget per person; right column: fixed costs
    const gross = `<div class="box">${this._section("mdi:calendar-range", this.t("annual_gross"), this._num(sum(grossPeople.map((p) => p.gross))))}
      <div class="blocks">${grossPeople.map((p) => block(p.name, p.color, p.gross, null, grossLines(p))).join("")}</div></div>`;
    const left = income + (grossPeople.length ? gross : "") + (m.single ? "" : perPerson);
    const right = costs;
    return `${this._header(true)}${kpis}<div class="columns"><div class="column">${left}</div><div class="column costs">${right}</div></div>`;
  }

  _renderDetail(m, g) {
    const name = g.category || this.t("no_category");
    const tile = (label, valueHtml) => `<div class="box kpi small"><span class="label">${esc(label)}</span><span class="value">${valueHtml}</span></div>`;
    const items = g.items
      .map((c) => {
        const person = this._data.persons[c.person];
        return `<div class="drow">
          <span class="d-name strong">${esc(c.name)}</span>
          <span class="d-person"><span class="chip" style="--c:${personColor(this._data, c.person)}">${esc(person)}</span></span>
          <span class="d-freq">${esc(this._freq(c.interval_months))}</span>
          <span class="d-paid"><span class="narrow-only">${this._num(c.amount)} ${esc(this._freq(c.interval_months))}</span><span class="wide-only">${this._num(c.amount)}</span></span>
          <span class="d-month strong">${this._num(c.monthly)}<span class="narrow-only muted small"> ${esc(this.t("per_month"))}</span></span>
          <span class="d-year">${this._num(c.monthly * 12)}<span class="narrow-only"> ${esc(this.t("per_year"))}</span></span>
        </div>`;
      })
      .join("");
    return `<div class="detail-head">
        <button class="icon-btn round" data-action="back" aria-label="${esc(this.t("back"))}" title="${esc(this.t("back"))}"><ha-icon icon="mdi:arrow-left"></ha-icon></button>
        <span class="dot square" style="background:${g.color}"></span><h1 class="title grow">${esc(name)}</h1>
      </div>
      <div class="kpis detail">${tile(this.t("per_month"), this._num(g.sum))}${tile(this.t("per_year"), this._num(g.sum * 12))}${tile(this.t("share"), this._num(`${pct(g.sum, m.costTotal)} %`, false))}</div>
      <div class="box table ${m.single ? "single" : ""}">
        <div class="drow dhead"><span class="d-name">${esc(this.t("item"))}</span><span class="d-person">${esc(this.t("person"))}</span><span class="d-freq">${esc(this.t("frequency"))}</span><span class="d-paid">${esc(this.t("per_payment"))}</span><span class="d-month">${esc(this.t("per_month"))}</span><span class="d-year">${esc(this.t("per_year"))}</span></div>
        ${items}
        <div class="drow dsum"><span class="d-name">${esc(this.t("sum"))}</span><span class="d-month">${this._num(g.sum)}</span><span class="d-year">${this._num(g.sum * 12)}</span></div>
      </div>`;
  }

  _renderEdit() {
    const d = this._draft;
    const symbol = esc(this._currencySymbol);
    const input = (list, row, field, label, extra = "") => {
      const control = `<input type="text" placeholder="${esc(label)}" data-list="${list}" data-id="${row._id}" data-field="${field}" value="${esc(row[field])}" ${extra}>`;
      // amounts: the currency sign is part of the field but not of the text
      const body = AMOUNT_FIELDS.includes(field) ? `<span class="money">${control}<span class="cur" aria-hidden="true">${symbol}</span></span>` : control;
      return `<label class="field f-${field}"><span class="sr">${esc(label)}</span>${body}</label>`;
    };
    const amount = (list, row) => input(list, row, "amount", this.t("amount"), 'inputmode="decimal" autocomplete="off"');
    const personSelect = (list, row, field, label) =>
      `<label class="field f-${field}"><span class="sr">${esc(label)}</span><select data-list="${list}" data-id="${row._id}" data-field="${field}">${PERSONS.map(
        (p) => `<option value="${p}" ${row[field] === p ? "selected" : ""}>${esc(d.persons[p] || p.toUpperCase())}</option>`
      ).join("")}</select></label>`;
    // monthly, quarterly, yearly or any other number of months: then the select becomes a field "N Monate"
    const freqSelect = (row) => {
      const options = INTERVALS.map((n) => `<option value="${n}" ${!row._custom && String(n) === String(row.interval_months) ? "selected" : ""}>${esc(this._freq(n))}</option>`).join("");
      if (row._custom)
        // the field "N Monate" keeps a small menu to go back to monthly, quarterly or yearly
        return `<div class="field f-freq"><span class="money"><input type="text" inputmode="numeric" autocomplete="off" maxlength="3" aria-label="${esc(this.t("interval_label"))}" data-list="fixed_costs" data-id="${row._id}" data-field="interval_months" value="${esc(row.interval_months)}" style="width:${Math.max(1, String(row.interval_months).length) + 0.4}ch"><span class="months" aria-hidden="true">${esc(this.t("months"))}</span><span class="freq-menu"><ha-icon icon="mdi:chevron-down"></ha-icon><select aria-label="${esc(this.t("frequency"))}" data-list="fixed_costs" data-id="${row._id}" data-field="interval_select">${options}<option value="custom" selected>${esc(this.t("freq_custom"))}</option></select></span></span></div>`;
      return `<label class="field f-freq"><span class="sr">${esc(this.t("frequency"))}</span><select data-list="fixed_costs" data-id="${row._id}" data-field="interval_select">${options}<option value="custom">${esc(this.t("freq_custom"))}</option></select></label>`;
    };
    const remove = (list, row) =>
      `<button class="icon-btn remove" data-action="remove" data-list="${list}" data-id="${row._id}" title="${esc(this.t("remove"))}" aria-label="${esc(this.t("remove"))}"><ha-icon icon="mdi:delete-outline"></ha-icon></button>`;
    const add = (list, label, person = "") =>
      `<button class="add" data-action="add" data-list="${list}" ${person ? `data-person="${person}"` : ""}><ha-icon icon="mdi:plus"></ha-icon>${esc(label)}</button>`;

    // Fixed costs are edited per category (tabs); a row belongs to the tab of its category
    const categories = this._costCategories();
    const tab = this._activeCostTab(categories);
    const catLabel = (c) => c || this.t("no_category");

    const active = activePersons(d.persons);
    const single = active.length === 1;

    // column headers, only shown on wide cards
    const head = (cls, cols) => `<div class="erow ${cls} ehead">${cols.map(([f, label]) => `<span class="f-${f}">${esc(label)}</span>`).join("")}</div>`;

    // One tab per person: name, color, income and special payments.
    // The second person's tab stays while it has entries (so they can be removed after clearing the name).
    const hasEntries = (p) => d.income.some((r) => r.person === p) || d.special_payments.some((r) => r.person === p);
    const colorOf = (p) => d.colors[p] || PERSON_COLORS[p];
    const personTabs = PERSONS.filter((p) => p === "a" || active.includes(p) || hasEntries(p) || this._addingPerson);
    const personLabel = (p) => d.persons[p].trim() || this.t("person_n", { n: PERSONS.indexOf(p) + 1 });

    const personSection = (p) => {
      // name and optional color (the reset button only while an own color is set)
      const color = `<label class="field f-color"><span class="sr">${esc(this.t("color"))}</span><input type="color" data-list="colors" data-field="${p}" value="${esc(colorOf(p))}" title="${esc(this.t("color"))}"></label>${
        d.colors[p]
          ? `<button class="icon-btn small-btn" data-action="resetcolor" data-key="${p}" title="${esc(this.t("reset_color"))}" aria-label="${esc(this.t("reset_color"))}"><ha-icon icon="mdi:restore"></ha-icon></button>`
          : ""
      }`;
      const name = `<div class="box">${this._section("mdi:account", this.t("person_name"))}
        <div class="name-row"><label class="field grow"><span class="sr">${esc(this.t("person_name"))}</span><input type="text" data-list="persons" data-field="${p}" value="${esc(d.persons[p])}" placeholder="${esc(this.t(p === "a" ? "person_name" : "name_optional"))}"></label>${color}</div>
        ${p === "b" ? `<div class="hint flat">${esc(this.t("one_person_hint"))}</div>` : ""}</div>`;
      // income (monthly): name, gross, net
      const rows = d.income.filter((r) => r.person === p);
      const income = `<div class="box">${this._section("mdi:cash-plus", this.t("income_edit"))}
        ${rows.length ? head("income", [["name", this.t("name")], ["gross", this.t("gross_month")], ["amount", this.t("net_month")]]) : ""}
        ${rows
          .map(
            (r) =>
              `<div class="erow income flow" data-id="${r._id}">${input("income", r, "name", this.t("name"))}${input("income", r, "gross", this.t("gross_month_short"), 'inputmode="decimal" autocomplete="off"')}${input("income", r, "amount", this.t("net_month_short"), 'inputmode="decimal" autocomplete="off"')}${remove("income", r)}</div>`
          )
          .join("")}
        ${add("income", this.t("add_income"), p)}</div>`;
      // special payments (once a year): name and gross only
      const specialRows = d.special_payments.filter((r) => r.person === p);
      const special = `<div class="box">${this._section("mdi:gift-outline", this.t("special_payments"), "", `<div class="hint">${esc(this.t("special_hint"))}</div>`)}
        ${specialRows.length ? head("special", [["name", this.t("name")], ["gross", this.t("gross")]]) : ""}
        ${specialRows
          .map(
            (r) =>
              `<div class="erow special flow" data-id="${r._id}">${input("special_payments", r, "name", this.t("name"))}${input("special_payments", r, "gross", this.t("gross"), 'inputmode="decimal" autocomplete="off"')}${remove("special_payments", r)}</div>`
          )
          .join("")}
        ${add("special_payments", this.t("add_special"), p)}</div>`;
      return name + income + special;
    };

    // Joint income (own tab): received on the account of one person; with one person only while entries exist
    const showShared = !single || d.shared_income.length > 0;
    const sharedSection = `<div class="box">${this._section("mdi:account-group-outline", this.t("shared_income"), "", `<div class="hint">${esc(this.t("shared_hint"))}</div>`)}
        ${d.shared_income.length && !single ? head("shared", [["name", this.t("name")], ["to", this.t("received_by")], ["amount", this.t("amount")]]) : ""}
        ${d.shared_income
          .map(
            (r) =>
              `<div class="erow ${single ? "simple" : "shared flow"}" data-id="${r._id}">${input("shared_income", r, "name", this.t("name"))}${single ? "" : personSelect("shared_income", r, "to", this.t("received_by"))}${amount("shared_income", r)}${remove("shared_income", r)}</div>`
          )
          .join("")}
        ${add("shared_income", this.t("add_shared"))}</div>`;

    const tabs = `<div class="tabs"><div class="tab-list" role="tablist" aria-label="${esc(this.t("categories"))}">${categories
      .map((c) =>
        c === tab && this._renaming
          ? `<input class="tab-rename" type="text" data-list="cat-rename" data-field="name" value="${esc(c)}" placeholder="${esc(this.t("category"))}" aria-label="${esc(this.t("rename_category"))}">`
          : `<button class="tab ${c === tab ? "active" : ""}" role="tab" aria-selected="${c === tab}" data-action="tab" data-key="${esc(c)}">${esc(catLabel(c))}</button>`
      )
      .join("")}</div>
      <div class="tab-actions">${categories.length ? `<button class="icon-btn small-btn" data-action="rename" title="${esc(this.t("rename_category"))}" aria-label="${esc(this.t("rename_category"))}"><ha-icon icon="mdi:pencil"></ha-icon></button>` : ""}
      <button class="tab new" data-action="newcat"><ha-icon icon="mdi:plus"></ha-icon>${esc(this.t("new_category"))}</button></div></div>`;
    const tabRows = d.fixed_costs.filter((r) => r.category.trim() === tab);
    const costs = `<div class="box">${this._section("mdi:receipt-text-outline", this.t("fixed_costs"))}
      ${tabs}
      ${tabRows.length ? head(`tabrow ${single ? "single" : ""}`, [["name", this.t("name")], ["amount", this.t("amount")], ["freq", this.t("frequency")], ...(single ? [] : [["person", this.t("paid_by")]])]) : ""}
      ${tabRows
        .map(
          (r) => `<div class="erow tabrow flow ${single ? "single" : ""}" data-id="${r._id}">${input("fixed_costs", r, "name", this.t("name"))}${amount("fixed_costs", r)}${freqSelect(r)}${remove("fixed_costs", r)}${single ? "" : personSelect("fixed_costs", r, "person", this.t("paid_by"))}</div>`
        )
        .join("")}
      ${add("fixed_costs", this.t("add_cost"))}</div>`;

    const saved = this._savedAt && Date.now() - this._savedAt < SAVED_NOTE_MS;
    const footer = `<div class="box footer">
      <div class="save-error" ${this._saveError ? "" : "hidden"}>${esc(this._saveError || "")}</div>
      ${saved && !this._saveError ? `<div class="saved"><ha-icon icon="mdi:check-circle"></ha-icon>${esc(this.t("saved"))}</div>` : ""}
      <span class="grow"></span>
      <button class="btn" data-action="cancel" ${this._saving ? "disabled" : ""}>${esc(this.t("cancel"))}</button>
      <button class="btn primary" data-action="save" ${this._saving ? "disabled" : ""}>${esc(this.t(this._saving ? "saving" : "save"))}</button>
    </div>`;

    const keys = [...personTabs, ...(showShared ? ["shared"] : []), "costs"];
    const current = keys.includes(this._editTab) ? this._editTab : keys[0];
    this._editTab = current;
    const tabButton = (k) =>
      `<button class="edit-tab ${k === current ? "active" : ""}" role="tab" aria-selected="${k === current}" data-action="edittab" data-key="${k}">${
        k === "costs" ? esc(this.t("fixed_costs")) : k === "shared" ? esc(this.t("shared_income")) : `<span class="dot" style="background:${colorOf(k)}"></span>${esc(personLabel(k))}`
      }</button>`;
    // "+ Person" sits after the person tabs, before joint income and fixed costs
    const addPerson = personTabs.includes("b") ? "" : `<button class="edit-tab add-person" data-action="addperson"><ha-icon icon="mdi:plus"></ha-icon>${esc(this.t("person"))}</button>`;
    const editTabs = `<div class="edit-tabs" role="tablist">${personTabs.map(tabButton).join("")}${addPerson}${showShared ? tabButton("shared") : ""}${tabButton("costs")}</div>`;
    const section = current === "costs" ? costs : current === "shared" ? sharedSection : personSection(current);
    // the title is shown by the edit page
    return `${editTabs}${section}${footer}`;
  }
}

/* =====================================================================
 * Edit page (panel): toolbar with back button and title, the card in edit mode below
 * ===================================================================== */

class EssentialBudgetPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" }).innerHTML = `<style>${PANEL_STYLE}</style>
      <div class="toolbar">
        <button class="back" data-action="back"><ha-icon icon="mdi:arrow-left"></ha-icon></button>
        <h1 class="page-title"></h1>
      </div>
      <div class="content"><div class="page"></div></div>`;
    this._card = document.createElement("essential-budget-card");
    this._card.setConfig({});
    this._card.editPage = true;
    this.shadowRoot.querySelector(".page").append(this._card);
    this.shadowRoot.querySelector(".back").addEventListener("click", () => {
      // back to where the page was opened from (dashboard, integration), else to the start page
      if (history.length > 1) history.back();
      else navigate("/");
    });
  }

  set hass(hass) {
    this._hass = hass;
    this._card.hass = hass;
    const texts = TEXTS[pickLanguage(hass)];
    const title = this.shadowRoot.querySelector(".page-title");
    if (title.textContent !== texts.edit_title) {
      title.textContent = texts.edit_title;
      const back = this.shadowRoot.querySelector(".back");
      back.title = texts.back_page;
      back.setAttribute("aria-label", texts.back_page);
    }
  }

  // set by Home Assistant, not needed
  set narrow(value) {}
  set route(value) {}
  set panel(value) {}
}

/* =====================================================================
 * Card editor (title and privacy mode; all other keys like grid_options are kept)
 * ===================================================================== */

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

  _render() {
    // Home Assistant may set hass before the config: wait for both
    if (!this._hass || !this._config) return;
    if (!this._form) {
      this._form = document.createElement("ha-form");
      const texts = TEXTS[pickLanguage(this._hass)];
      this._form.computeLabel = (field) => texts[field.name === "title" ? "title_optional" : field.name];
      this._form.addEventListener("value-changed", (e) => {
        const config = { ...this._config, ...e.detail.value };
        if (!config.title) delete config.title;
        delete config.currency; // option of 0.2.0 betas, the currency now comes from Home Assistant
        // only values that differ from the defaults are stored
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
        link.style.cssText = "display:flex;flex-direction:column;align-items:flex-start;gap:16px;margin-top:24px;color:var(--secondary-text-color);font-size:14px;";
        link.innerHTML = `<span>${esc(texts.edit_link_hint)}</span>
          <button type="button" style="display:inline-flex;align-items:center;gap:6px;min-height:40px;padding:0 16px 0 12px;border-radius:20px;cursor:pointer;font:inherit;font-weight:500;border:1px solid var(--primary-color);background:transparent;color:var(--primary-color);"><ha-icon icon="mdi:pencil" style="--mdc-icon-size:18px"></ha-icon>${esc(texts.edit_title)}</button>`;
        link.querySelector("button").addEventListener("click", () => openEditPage(this));
        this.append(link);
      }
    }
    this._form.hass = this._hass;
    this._form.schema = [
      { name: "title", selector: { text: {} } },
      { name: "privacy", selector: { boolean: {} } },
      // the delay only matters with the privacy mode
      ...(this._config.privacy ? [{ name: "privacy_seconds", selector: { number: { min: 5, max: 600, step: 5, mode: "box", unit_of_measurement: "s" } } }] : []),
    ];
    this._form.data = {
      title: this._config.title || "",
      privacy: !!this._config.privacy,
      privacy_seconds: Number(this._config.privacy_seconds) || DEFAULT_PRIVACY_SECONDS,
    };
  }
}

if (!customElements.get("essential-budget-card-editor")) customElements.define("essential-budget-card-editor", EssentialBudgetCardEditor);
if (!customElements.get("essential-budget-card")) {
  customElements.define("essential-budget-card", EssentialBudgetCard);
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: "essential-budget-card",
    name: "Essential Budget",
    description: "Household budget: income, fixed costs and budget per person",
    preview: false,
  });
  console.info(`%c ESSENTIAL-BUDGET-CARD %c ${VERSION} `, "background:#1f7a5c;color:#fff", "");
}
// the edit page uses the card, so it is defined last
if (!customElements.get("essential-budget-panel")) customElements.define("essential-budget-panel", EssentialBudgetPanel);
