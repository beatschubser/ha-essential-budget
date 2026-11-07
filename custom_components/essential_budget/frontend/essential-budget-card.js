/* Essential Budget card for Home Assistant (loaded automatically by the integration).
 *
 * - EssentialBudgetCard shows the budget. In the preview of the dashboard card editor it opens in
 *   edit mode; the budget is then saved with its own button to /config/essential_budget.json.
 * - EssentialBudgetCardEditor is the visual card editor (only the title; grid options are kept).
 *
 * All amounts are stored with cents and shown rounded to whole units of the currency set in
 * Home Assistant (Settings > System > General).
 * Layout: one column on narrow cards, desktop layout from DESKTOP_WIDTH (container query).
 */

const VERSION = "0.2.0-beta.4";
const WS = "essential_budget";
const PERSONS = ["a", "b"];
const PERSON_COLORS = { a: "#2f6fde", b: "#d9822b", shared: "#7a8794" };
// Category colors, assigned in alphabetical order of the category names
const PALETTE = ["#2f6fde", "#7c5cd6", "#d9822b", "#1f8f74", "#b0436e", "#0e7c99", "#8a6d1f", "#a23b3b", "#4b8b2f", "#5f6b78"];
const FREQUENCIES = [12, 6, 4, 3, 2, 1]; // offered first in the edit mode; any value from 1 to 12 is valid
const LISTS = ["income", "special_payments", "shared_income", "fixed_costs"];
const AMOUNT_FIELDS = ["amount", "gross"]; // text fields in the edit mode that hold amounts (gross is optional)
const FALLBACK_CURRENCY = "EUR"; // if Home Assistant has no currency set
const SAVED_NOTE_MS = 4000; // how long "Saved" is shown in the edit mode
const DEFAULT_PRIVACY_SECONDS = 30; // privacy mode: numbers are hidden again after this time

/* ---------------------------------------------------------------------
 * Texts (English is the fallback)
 * --------------------------------------------------------------------- */

const TEXTS = {
  en: {
    income: "Income (net)",
    fixed_costs: "Fixed costs",
    budget: "Budget",
    budget_per_person: "Budget per person",
    annual_gross: "Annual gross",
    per_month: "per month",
    per_year: "per year",
    after_costs: "after fixed costs, per month",
    of_income: "{p} of income",
    shared: "Shared",
    share: "Share",
    share_long: "Share of all fixed costs",
    item: "Item",
    person: "Person",
    frequency: "Frequency",
    per_payment: "Amount per payment",
    sum: "Total",
    no_category: "No category",
    expand: "Expand {c}",
    collapse: "Collapse {c}",
    open_details: "{c}: show details",
    back: "Back to overview",
    empty: "No entries yet.",
    empty_admin: "No entries yet. Edit this card in the dashboard editor to enter your budget.",
    error: "The budget could not be loaded",
    not_set_up: "Essential Budget is not set up yet (Settings > Devices & services).",
    update_available: "Essential Budget was updated. Tap to reload the page.",
    restart_needed: "Essential Budget was updated. Please restart Home Assistant.",
    freq: { 12: "monthly", 6: "every two months", 4: "quarterly", 3: "every four months", 2: "half-yearly", 1: "yearly", n: "{n}× a year" },
    edit_title: "Edit budget",
    persons: "Persons",
    person_name: "Name",
    person_n: "Person {n}",
    income_edit: "Income",
    special_payments: "Special payments",
    special_hint: "Paid once a year; only part of the annual gross, not of the monthly income",
    add_special: "Add special payment",
    gross_month: "Gross per month",
    net_month: "Net per month",
    gross_month_short: "Gross/month",
    net_month_short: "Net/month",
    gross: "Gross",
    net: "Net",
    categories: "Categories",
    new_category: "Category",
    new_category_name: "New category",
    rename_category: "Rename category",
    net_short: "Net",
    gross_short: "Gross",
    one_person_hint: "Leave the name empty for a budget of one person.",
    second_person_in_use: "The second person still has entries. Remove them or enter a name for the second person.",
    name_optional: "Name (optional)",
    shared_hint: "Received on the account of {name}",
    shared_income: "Shared income",
    received_by: "Received by",
    name: "Name",
    category: "Category",
    amount: "Amount",
    paid_by: "Paid by",
    add_income: "Add income",
    add_shared: "Add shared income",
    add_cost: "Add fixed cost",
    remove: "Remove",
    cancel: "Discard changes",
    save: "Save budget",
    saved: "Saved",
    editor_hint: "Save the budget with the button below. The save button of this dialog only saves the card options.",
    title_optional: "Title (optional)",
    privacy: "Privacy mode (numbers blurred until a key figure is tapped)",
    privacy_seconds: "Hide numbers again after (seconds)",
    show_numbers: "Show numbers",
    hide_numbers: "Hide numbers",
    saving: "Saving …",
    invalid: "Please check the marked fields.",
    save_failed: "Saving failed",
    file_hint: "Saved in {file} in the config folder.",
  },
  de: {
    income: "Einnahmen (netto)",
    fixed_costs: "Fixkosten",
    budget: "Budget",
    budget_per_person: "Budget je Person",
    annual_gross: "Jahresbrutto",
    per_month: "pro Monat",
    per_year: "pro Jahr",
    after_costs: "nach Fixkosten, pro Monat",
    of_income: "{p} der Einnahmen",
    shared: "Geteilt",
    share: "Anteil",
    share_long: "Anteil an allen Fixkosten",
    item: "Posten",
    person: "Person",
    frequency: "Turnus",
    per_payment: "Betrag je Zahlung",
    sum: "Summe",
    no_category: "Ohne Kategorie",
    expand: "{c} aufklappen",
    collapse: "{c} zuklappen",
    open_details: "{c}: Details öffnen",
    back: "Zurück zur Übersicht",
    empty: "Noch keine Einträge.",
    empty_admin: "Noch keine Einträge. Bearbeite die Karte im Dashboard-Editor, um dein Budget zu erfassen.",
    error: "Das Budget konnte nicht geladen werden",
    not_set_up: "Essential Budget ist noch nicht eingerichtet (Einstellungen > Geräte & Dienste).",
    update_available: "Essential Budget wurde aktualisiert. Tippen, um die Seite neu zu laden.",
    restart_needed: "Essential Budget wurde aktualisiert. Bitte Home Assistant neu starten.",
    freq: { 12: "monatlich", 6: "zweimonatlich", 4: "vierteljährlich", 3: "alle vier Monate", 2: "halbjährlich", 1: "jährlich", n: "{n}× jährlich" },
    edit_title: "Budget bearbeiten",
    persons: "Personen",
    person_name: "Name",
    person_n: "Person {n}",
    income_edit: "Einnahmen",
    special_payments: "Sonderzahlungen",
    special_hint: "Einmal im Jahr; zählt nur zum Jahresbrutto, nicht zu den monatlichen Einnahmen",
    add_special: "Sonderzahlung hinzufügen",
    gross_month: "Brutto pro Monat",
    net_month: "Netto pro Monat",
    gross_month_short: "Brutto/Monat",
    net_month_short: "Netto/Monat",
    gross: "Brutto",
    net: "Netto",
    categories: "Kategorien",
    new_category: "Kategorie",
    new_category_name: "Neue Kategorie",
    rename_category: "Kategorie umbenennen",
    net_short: "Netto",
    gross_short: "Brutto",
    one_person_hint: "Für das Budget einer einzelnen Person bleibt der Name leer.",
    second_person_in_use: "Die zweite Person hat noch Einträge. Entferne sie oder trag einen Namen für die zweite Person ein.",
    name_optional: "Name (optional)",
    shared_hint: "Eingang auf dem Konto von {name}",
    shared_income: "Geteilte Einnahmen",
    received_by: "Eingang bei",
    name: "Bezeichnung",
    category: "Kategorie",
    amount: "Betrag",
    paid_by: "Zahlt",
    add_income: "Einnahme hinzufügen",
    add_shared: "Geteilte Einnahme hinzufügen",
    add_cost: "Fixkosten hinzufügen",
    remove: "Entfernen",
    cancel: "Änderungen verwerfen",
    save: "Budget speichern",
    saved: "Gespeichert",
    editor_hint: "Das Budget speicherst du mit dem Button unten. Der Speichern-Button dieses Dialogs speichert nur die Kartenoptionen.",
    title_optional: "Titel (optional)",
    privacy: "Privatsphäremodus (Zahlen verschwommen, bis eine Kennzahl angetippt wird)",
    privacy_seconds: "Zahlen wieder verbergen nach (Sekunden)",
    show_numbers: "Zahlen anzeigen",
    hide_numbers: "Zahlen verbergen",
    saving: "Speichert …",
    invalid: "Bitte die markierten Felder prüfen.",
    save_failed: "Speichern fehlgeschlagen",
    file_hint: "Gespeichert in {file} im config-Ordner.",
  },
};

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
const monthly = (cost) => (cost.amount * cost.payments_per_year) / 12;
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

/**
 * True if the card is shown in the preview of the card editor dialog (searched across shadow roots).
 * The "preview" property of cards is not used for this: Home Assistant also sets it for every card
 * while the dashboard itself is in edit mode.
 */
const inCardEditor = (el) => {
  for (let n = el; n; n = n.parentNode || n.host) {
    if (n.tagName === "HUI-DIALOG-EDIT-CARD") return true;
  }
  return false;
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
      ...data.special_payments.filter((i) => i.person === p && i.gross != null).map((i) => ({ name: i.name, value: i.gross })),
    ];
    return {
      key: p,
      name: data.persons[p],
      color: PERSON_COLORS[p],
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
    return { key: p, name: data.persons[p], color: PERSON_COLORS[p], value: own + shared - cost };
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
    this._root.addEventListener("keydown", (e) => {
      if ((e.key === "Enter" || e.key === " ") && e.target.dataset?.action === "reveal") {
        e.preventDefault();
        e.target.click();
      }
    });
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

  /** Set by Home Assistant in the card editor and while the dashboard is edited: only a reason to check again. */
  set preview(value) {
    this._preview = !!value;
    this._syncEdit();
  }

  /** Starts the edit mode in the card editor preview; true if it did. */
  _autoEdit() {
    if (this._draft || !this._data || !this._isAdmin || !inCardEditor(this)) return false;
    this._startEdit();
    return true;
  }

  /** Edit mode only inside the card editor dialog: start it there, leave it (discarding) anywhere else. */
  _syncEdit() {
    if (this._autoEdit()) {
      this._render();
    } else if (this._draft && !inCardEditor(this)) {
      this._draft = null;
      this._saveError = null;
      this._load(); // show the current budget, it may have been saved in the card editor meanwhile
    }
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
    if (this._hass) this._subscribe();
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
      this._file = result.file;
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
      case "reload":
        sessionSet(`eb-reloaded-${this._update.version}`, "1");
        location.reload();
        return;
      case "reveal":
        this._setRevealed(!this._revealed);
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
        // discard: start again from the saved budget (in the card editor the edit mode stays open)
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
    this._draft = { persons: { ...d.persons } };
    for (const list of LISTS)
      this._draft[list] = d[list].map((item) => ({
        ...item,
        amount: amount(item.amount),
        ...(list === "income" || list === "special_payments" ? { gross: item.gross != null ? amount(item.gross) : "" } : {}),
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
    const row = { _id: uid(), name: "", amount: "" };
    if (list === "income" || list === "special_payments") Object.assign(row, { person: person || "a", gross: "" });
    if (list === "shared_income") row.to = person || "a";
    if (list === "fixed_costs") Object.assign(row, { category: this._activeCostTab(), person: "a", payments_per_year: 12 });
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
    row[field] = field === "payments_per_year" ? Number(el.value) : el.value;
    if (list === "shared_income" && field === "to" && e.type === "change") {
      this._render(); // moved to the other person's tab
      return;
    }
    if (el.classList.contains("invalid")) this._markField(el);
  }

  _onBlur(e) {
    if (this._draft && AMOUNT_FIELDS.includes(e.target.dataset?.field)) this._markField(e.target);
  }

  _markField(el) {
    el.classList.toggle("invalid", parseAmount(el.value) === null);
  }

  async _save() {
    const data = { persons: { ...this._draft.persons } };
    let invalid = false;
    for (const list of LISTS) {
      data[list] = this._draft[list].map(({ _id, ...row }) => {
        const amount = parseAmount(row.amount);
        if (amount === null) invalid = true;
        const result = { ...row, amount: amount ?? 0 };
        if ("gross" in row) {
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
      if (data.income.some((r) => r.person === "b") || data.special_payments.some((r) => r.person === "b") || data.shared_income.some((r) => r.to === "b")) {
        this._showProblem("b", this.t("second_person_in_use"));
        return;
      }
      data.shared_income.forEach((r) => (r.to = "a"));
      data.fixed_costs.forEach((r) => (r.person = "a"));
    }
    if (invalid) {
      // open the tab (and category) of the first invalid amount and mark the fields there
      const bad = (r) => parseAmount(r.amount) === null || ("gross" in r && String(r.gross ?? "").trim() !== "" && parseAmount(r.gross) === null);
      const list = LISTS.find((l) => this._draft[l].some(bad));
      const row = this._draft[list].find(bad);
      if (list === "fixed_costs") this._costTab = row.category.trim();
      this._showProblem(list === "fixed_costs" ? "costs" : list === "shared_income" ? row.to : row.person, this.t("invalid"));
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
  }

  _showSaveError(text) {
    this._saveError = text;
    const box = this._root.querySelector(".save-error");
    if (box) {
      box.textContent = text;
      box.hidden = false;
    }
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
    this._root.classList.toggle("private", !!this._config.privacy && !this._revealed && !this._draft);
    this._root.innerHTML = update + body;
    // keep the active category tab visible in a scrolled tab bar
    const tabs = this._root.querySelector(".tabs");
    const activeTab = tabs?.querySelector(".tab.active, .tab-rename");
    if (activeTab) tabs.scrollLeft = Math.max(0, activeTab.offsetLeft - tabs.offsetLeft - 16);
  }

  _header() {
    return this._config.title ? `<div class="header"><h1 class="title">${esc(this._config.title)}</h1></div>` : "";
  }

  _section(icon, title, right = "", extra = "") {
    return `<div class="section-head"><ha-icon icon="${icon}"></ha-icon><h2>${esc(title)}</h2>${right ? `<span class="head-value">${right}</span>` : ""}</div>${extra}`;
  }

  _renderView(m) {
    if (m.empty) return `${this._header()}<div class="box msg">${esc(this.t(this._isAdmin ? "empty_admin" : "empty"))}</div>`;
    const negative = (v) => (v < 0 ? " negative" : "");

    // privacy mode: the key figures show/hide all numbers; an eye shows the state
    const reveal = this._config.privacy
      ? ` data-action="reveal" role="button" tabindex="0" aria-pressed="${!!this._revealed}" title="${esc(this.t(this._revealed ? "hide_numbers" : "show_numbers"))}"`
      : "";
    const eye = this._config.privacy ? `<ha-icon class="eye" icon="mdi:${this._revealed ? "eye-outline" : "eye-off-outline"}"></ha-icon>` : "";
    const kpis = `<div class="kpis">
      <div class="box kpi"${reveal}><span class="label">${esc(this.t("income"))}${eye}</span><span class="value">${this._num(m.incomeTotal)}</span><span class="sub">${esc(this.t("per_month"))}</span></div>
      <div class="box kpi"${reveal}><span class="label">${esc(this.t("fixed_costs"))}${eye}</span><span class="value">${this._num(m.costTotal)}</span><span class="sub">${this._withNum("of_income", "p", `${pct(m.costTotal, m.incomeTotal)} %`)}</span></div>
      <div class="box kpi main${negative(m.budget)}"${reveal}><span class="label">${esc(this.t("budget"))}${eye}</span><span class="value">${this._num(m.budget)}</span><span class="sub">${esc(this.t("after_costs"))}</span></div>
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
    const costs = `<div class="box">${this._section("mdi:receipt-text-outline", this.t("fixed_costs"), `${this._num(m.costTotal)} ${esc(this.t("per_month"))}`)}
      ${m.groups
        .map((g) => {
          const open = g.items.length > 1 && this._open.has(g.category); // a single item needs no expanding
          const name = categoryName(g);
          const maxItem = Math.max(...g.items.map((c) => c.monthly), 0);
          const items = open
            ? `<div class="items">${g.items
                .map(
                  (c) => `<div class="item"><div class="item-main"><span class="ellipsis" title="${esc(c.name)}">${esc(c.name)}</span>
                  <span class="item-freq">${esc(this._freq(c.payments_per_year))}</span>
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

    // With one person the budget per person equals the budget: no extra box
    // second row: only the boxes that have something to show
    const gross = `<div class="box">${this._section("mdi:calendar-range", this.t("annual_gross"), this._num(sum(grossPeople.map((p) => p.gross))))}
      <div class="blocks">${grossPeople.map((p) => block(p.name, p.color, p.gross, null, grossLines(p))).join("")}</div></div>`;
    const row2 = [m.single ? "" : perPerson, grossPeople.length ? gross : ""].filter(Boolean);
    return `${this._header()}${kpis}<div class="row1">${income}${costs}</div>${row2.length ? `<div class="row2" style="--cols:${row2.length}">${row2.join("")}</div>` : ""}`;
  }

  _renderDetail(m, g) {
    const name = g.category || this.t("no_category");
    const tile = (label, valueHtml) => `<div class="box kpi small"><span class="label">${esc(label)}</span><span class="value">${valueHtml}</span></div>`;
    const items = g.items
      .map((c) => {
        const person = this._data.persons[c.person];
        return `<div class="drow">
          <span class="d-name strong">${esc(c.name)}</span>
          <span class="d-person"><span class="chip" style="--c:${PERSON_COLORS[c.person]}">${esc(person)}</span></span>
          <span class="d-freq">${esc(this._freq(c.payments_per_year))}</span>
          <span class="d-paid"><span class="narrow-only">${this._num(c.amount)} ${esc(this._freq(c.payments_per_year))}</span><span class="wide-only">${this._num(c.amount)}</span></span>
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
    const freqSelect = (row) => {
      const values = [...new Set([...FREQUENCIES, row.payments_per_year])].concat(
        Array.from({ length: 12 }, (_, i) => 12 - i).filter((n) => !FREQUENCIES.includes(n) && n !== row.payments_per_year)
      );
      return `<label class="field f-freq"><span class="sr">${esc(this.t("frequency"))}</span><select data-list="fixed_costs" data-id="${row._id}" data-field="payments_per_year">${values
        .map((n) => `<option value="${n}" ${row.payments_per_year === n ? "selected" : ""}>${esc(this._freq(n))}</option>`)
        .join("")}</select></label>`;
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
    this._editPersons = active.length;

    // column headers, only shown on wide cards
    const head = (cls, cols) => `<div class="erow ${cls} ehead">${cols.map(([f, label]) => `<span class="f-${f}">${esc(label)}</span>`).join("")}</div>`;

    // One tab per person: name, income and shared income received by the person.
    // The second person's tab stays while it has entries (so they can be removed after clearing the name).
    const hasEntries = (p) =>
      d.income.some((r) => r.person === p) || d.special_payments.some((r) => r.person === p) || d.shared_income.some((r) => r.to === p);
    const personTabs = PERSONS.filter((p) => p === "a" || active.includes(p) || hasEntries(p) || this._addingPerson);
    const personLabel = (p) => d.persons[p].trim() || this.t("person_n", { n: PERSONS.indexOf(p) + 1 });

    const personSection = (p) => {
      const name = `<div class="box">${this._section("mdi:account", this.t("person_name"))}
        <label class="field"><span class="sr">${esc(this.t("person_name"))}</span><input type="text" data-list="persons" data-field="${p}" value="${esc(d.persons[p])}" placeholder="${esc(this.t(p === "a" ? "person_name" : "name_optional"))}"></label>
        ${p === "b" ? `<div class="hint flat">${esc(this.t("one_person_hint"))}</div>` : ""}</div>`;
      // income (monthly) and special payments (once a year): name, gross, net
      const moneyRows = (list, label, shortGross, shortNet, longGross, longNet, icon, addLabel, hint = "") => {
        const rows = d[list].filter((r) => r.person === p);
        return `<div class="box">${this._section(icon, label, "", hint ? `<div class="hint">${esc(hint)}</div>` : "")}
        ${rows.length ? head("income", [["name", this.t("name")], ["gross", longGross], ["amount", longNet]]) : ""}
        ${rows
          .map(
            (r) =>
              `<div class="erow income flow" data-id="${r._id}">${input(list, r, "name", this.t("name"))}${input(list, r, "gross", shortGross, 'inputmode="decimal" autocomplete="off"')}${input(list, r, "amount", shortNet, 'inputmode="decimal" autocomplete="off"')}${remove(list, r)}</div>`
          )
          .join("")}
        ${add(list, addLabel, p)}</div>`;
      };
      const income = moneyRows("income", this.t("income_edit"), this.t("gross_month_short"), this.t("net_month_short"), this.t("gross_month"), this.t("net_month"), "mdi:cash-plus", this.t("add_income"));
      const special = moneyRows("special_payments", this.t("special_payments"), this.t("gross_short"), this.t("net_short"), this.t("gross"), this.t("net"), "mdi:gift-outline", this.t("add_special"), this.t("special_hint"));
      // shared income is listed with the person whose account receives it; with one person only while entries exist
      const sharedRows = d.shared_income.filter((r) => r.to === p);
      const shared =
        single && !d.shared_income.length
          ? ""
          : `<div class="box">${this._section("mdi:account-group-outline", this.t("shared_income"), "", `<div class="hint">${esc(this.t("shared_hint", { name: personLabel(p) }))}</div>`)}
        ${sharedRows.length && !single ? head("shared", [["name", this.t("name")], ["to", this.t("received_by")], ["amount", this.t("amount")]]) : ""}
        ${sharedRows
          .map(
            (r) =>
              `<div class="erow ${single ? "simple" : "shared flow"}" data-id="${r._id}">${input("shared_income", r, "name", this.t("name"))}${single ? "" : personSelect("shared_income", r, "to", this.t("received_by"))}${amount("shared_income", r)}${remove("shared_income", r)}</div>`
          )
          .join("")}
        ${add("shared_income", this.t("add_shared"), p)}</div>`;
      return name + income + special + shared;
    };

    const tabs = `<div class="tabs" role="tablist" aria-label="${esc(this.t("categories"))}">${categories
      .map((c) =>
        c === tab && this._renaming
          ? `<input class="tab-rename" type="text" data-list="cat-rename" data-field="name" value="${esc(c)}" placeholder="${esc(this.t("category"))}" aria-label="${esc(this.t("rename_category"))}">`
          : `<button class="tab ${c === tab ? "active" : ""}" role="tab" aria-selected="${c === tab}" data-action="tab" data-key="${esc(c)}">${esc(catLabel(c))}</button>`
      )
      .join("")}
      ${categories.length ? `<button class="icon-btn small-btn" data-action="rename" title="${esc(this.t("rename_category"))}" aria-label="${esc(this.t("rename_category"))}"><ha-icon icon="mdi:pencil"></ha-icon></button>` : ""}
      <button class="tab new" data-action="newcat"><ha-icon icon="mdi:plus"></ha-icon>${esc(this.t("new_category"))}</button></div>`;
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
      <span class="hint grow">${esc(this.t("file_hint", { file: this._file || "essential_budget.json" }))}</span>
      <button class="btn" data-action="cancel" ${this._saving ? "disabled" : ""}>${esc(this.t("cancel"))}</button>
      <button class="btn primary" data-action="save" ${this._saving ? "disabled" : ""}>${esc(this.t(this._saving ? "saving" : "save"))}</button>
    </div>`;

    const keys = [...personTabs, "costs"];
    const current = keys.includes(this._editTab) ? this._editTab : keys[0];
    this._editTab = current;
    const tabButton = (k) =>
      `<button class="edit-tab ${k === current ? "active" : ""}" role="tab" aria-selected="${k === current}" data-action="edittab" data-key="${k}">${
        k === "costs" ? esc(this.t("fixed_costs")) : `<span class="dot" style="background:${PERSON_COLORS[k]}"></span>${esc(personLabel(k))}`
      }</button>`;
    // "+ Person" sits after the person tabs, before the fixed costs
    const addPerson = personTabs.includes("b") ? "" : `<button class="edit-tab add-person" data-action="addperson"><ha-icon icon="mdi:plus"></ha-icon>${esc(this.t("person"))}</button>`;
    const editTabs = `<div class="edit-tabs" role="tablist">${personTabs.map(tabButton).join("")}${addPerson}${tabButton("costs")}</div>`;
    return `<div class="header"><h1 class="title">${esc(this.t("edit_title"))}</h1></div><div class="hint flat">${esc(this.t("editor_hint"))}</div>${editTabs}${current === "costs" ? costs : personSection(current)}${footer}`;
  }
}

/* =====================================================================
 * Card editor (only the title; all other keys like grid_options are kept)
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

/* =====================================================================
 * Styles (colors come from the Home Assistant theme)
 * ===================================================================== */

const STYLE = `
  :host { display: block; }
  ha-card { background: none; border: none; box-shadow: none; overflow: visible; }
  .root { container-type: inline-size; display: flex; flex-direction: column; gap: 12px; color: var(--primary-text-color); }
  .box {
    background: var(--ha-card-background, var(--card-background-color, #fff));
    border: var(--ha-card-border-width, 1px) solid var(--ha-card-border-color, var(--divider-color, #e0e0e0));
    border-radius: var(--ha-card-border-radius, 12px);
    box-shadow: var(--ha-card-box-shadow, none);
    padding: 16px; display: flex; flex-direction: column; min-width: 0; box-sizing: border-box;
  }
  button { font: inherit; color: inherit; }
  ha-icon { --mdc-icon-size: 22px; flex-shrink: 0; }
  .muted { color: var(--secondary-text-color); }
  .small { font-size: 12px; }
  .strong { font-weight: 600; }
  .grow { flex: 1; min-width: 0; }
  .ellipsis { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .negative, .kpi.negative .value { color: var(--error-color, #db4437) !important; }
  .msg { color: var(--secondary-text-color); }
  .msg.err { color: var(--error-color, #db4437); }
  .update { border: 0; border-radius: 12px; padding: 12px 16px; text-align: left; cursor: pointer;
    background: color-mix(in srgb, var(--primary-color) 15%, transparent); color: var(--primary-text-color); }

  .header { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-height: 44px; }
  .title { margin: 0; font-size: 20px; font-weight: 600; }
  .icon-btn { width: 44px; height: 44px; border: 0; background: transparent; border-radius: 50%; cursor: pointer;
    display: inline-flex; align-items: center; justify-content: center; color: var(--secondary-text-color); flex-shrink: 0; }
  .icon-btn:hover { background: color-mix(in srgb, var(--primary-text-color) 8%, transparent); }
  .icon-btn.round { background: var(--ha-card-background, var(--card-background-color)); border: 1px solid var(--divider-color); }

  /* Key figures: narrow = budget on top over the full width */
  .kpis { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
  .kpi { gap: 4px; }
  .kpi .label, .kpi .sub { font-size: 13px; color: var(--secondary-text-color); }
  .kpi .label { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
  .kpi .eye { --mdc-icon-size: 18px; }
  .kpi[data-action="reveal"] { cursor: pointer; user-select: none; }
  .kpi[data-action="reveal"]:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
  /* privacy mode: numbers unreadable until revealed */
  .num { transition: filter 0.2s; }
  .private .num { filter: blur(8px); user-select: none; }
  .kpi .value { font-size: 24px; font-weight: 700; }
  .kpi.main { grid-column: 1 / -1; box-shadow: inset 0 0 0 2px var(--primary-color); }
  .kpi.main .value { color: var(--primary-color); }
  .kpi.main.negative { box-shadow: inset 0 0 0 2px var(--error-color, #db4437); }
  .kpis.detail { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .kpi.small .value { font-size: 18px; }

  .row1, .row2 { display: grid; grid-template-columns: minmax(0, 1fr); gap: 12px; align-items: start; }

  .section-head { display: flex; align-items: center; gap: 10px; padding-bottom: 10px; }
  .section-head ha-icon { color: var(--primary-color); }
  .section-head h2 { margin: 0; flex: 1; font-size: 16px; font-weight: 600; }
  .head-value { font-size: 14px; font-weight: 600; }
  .hint { font-size: 12px; color: var(--secondary-text-color); margin: -6px 0 6px 32px; }
  .footer .hint { margin: 0; flex-basis: 100%; }
  .hint.flat { margin: 6px 0 0; }
  .header + .hint.flat { margin: -4px 0 0; }
  .table.single .d-person { display: none; }
  .table.single .drow { grid-template-areas: "name month" "paid year"; }
  .table.single .dsum { grid-template-areas: "name month" ". year"; }

  .blocks { display: flex; flex-direction: column; gap: 10px; }
  .block { display: flex; flex-direction: column; gap: 6px; padding: 12px; border-radius: 10px;
    background: color-mix(in srgb, var(--primary-text-color) 4%, transparent); }
  .block-head { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; }
  .dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
  .dot.square { width: 14px; height: 14px; border-radius: 4px; }
  .line { display: flex; justify-content: space-between; gap: 12px; padding-left: 18px; font-size: 13px; color: var(--secondary-text-color); }
  .row { display: flex; justify-content: space-between; gap: 12px; font-size: 14px; padding: 8px 0; border-top: 1px solid var(--divider-color); }

  /* Fixed costs */
  .cat { border-top: 1px solid var(--divider-color); }
  .cat-row { display: flex; align-items: center; min-height: 52px; }
  .cat-btn { flex: 1; min-width: 0; min-height: 44px; border: 0; background: transparent; border-radius: 10px; cursor: pointer;
    display: flex; align-items: center; gap: 10px; padding: 0 2px; text-align: left; }
  .cat-btn:hover { background: color-mix(in srgb, var(--primary-text-color) 4%, transparent); }
  .cat-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 5px; padding: 6px 0; font-size: 14px; }
  .cat-share { width: 34px; text-align: right; font-size: 11px; color: var(--secondary-text-color); font-variant-numeric: tabular-nums; }
  .cat-value { width: 66px; text-align: right; font-size: 14px; font-weight: 700; font-variant-numeric: tabular-nums; }
  .bar { display: block; height: 4px; border-radius: 2px; overflow: hidden; background: color-mix(in srgb, var(--primary-text-color) 8%, transparent); }
  .bar i { display: block; height: 100%; border-radius: 2px; }
  .bar.thin { height: 3px; }
  .bar.thin i { opacity: 0.7; }
  .items { display: flex; flex-direction: column; padding: 0 0 10px 44px; }
  .item { display: flex; align-items: center; gap: 12px; min-height: 44px; font-size: 14px; padding-right: 32px; }
  .item-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; padding: 4px 0; }
  .item-freq { font-size: 12px; color: var(--secondary-text-color); }
  .item-value { width: 76px; text-align: right; font-variant-numeric: tabular-nums; }

  /* Detail page: list on narrow cards, table on wide ones */
  .detail-head { display: flex; align-items: center; gap: 12px; }
  .table { padding-top: 4px; padding-bottom: 4px; }
  .drow { display: grid; grid-template-columns: minmax(0, 1fr) auto; grid-template-areas: "name month" "paid year" "person person";
    gap: 4px 12px; padding: 12px 0; border-bottom: 1px solid var(--divider-color); font-size: 14px; align-items: center; }
  .drow > span { min-width: 0; }
  .d-name { grid-area: name; } .d-person { grid-area: person; } .d-month { grid-area: month; text-align: right; }
  .d-year { grid-area: year; text-align: right; font-size: 12px; color: var(--secondary-text-color); }
  .d-paid { grid-area: paid; font-size: 13px; color: var(--secondary-text-color); }
  .d-freq { display: none; }
  .dsum { border-bottom: 0; grid-template-areas: "name month" ". year"; font-weight: 700; }
  .dsum .d-year { font-weight: 400; }
  .dhead { display: none; }
  .wide-only { display: none; }
  .chip { font-size: 12px; font-weight: 600; padding: 2px 8px; border-radius: 10px;
    background: color-mix(in srgb, var(--c) 16%, transparent); box-shadow: inset 0 0 0 1px var(--c); }

  /* Edit mode */
  .esub { display: flex; flex-direction: column; gap: 8px; padding: 8px 0 12px; border-top: 1px solid var(--divider-color); }
  .esub .block-head { padding-top: 4px; }
  .erow { display: grid; gap: 8px 10px; align-items: end; padding: 8px 0; border-top: 1px solid var(--divider-color); }
  .erow.persons { grid-template-columns: repeat(2, minmax(0, 1fr)); border-top: 0; }
  .erow.simple { grid-template-columns: minmax(0, 1fr) 110px 40px; }
  .erow.income .f-name { grid-area: name; } .erow.income .f-amount { grid-area: amount; }
  .erow.income .f-gross { grid-area: gross; } .erow.income .remove { grid-area: remove; }
  /* income on narrow cards: name, net, gross and delete in one line if it fits (short labels above the amounts) */
  .erow.income.flow { gap: 8px 6px; }
  .erow.income.flow .field.f-name { flex: 1 1 60px; order: 0; }
  .erow.income.flow .field.f-gross { flex: 0 1 100px; order: 1; }
  .erow.income.flow .field.f-amount { flex: 0 1 100px; order: 2; }
  .erow.income.flow .remove { order: 3; width: 32px; }
  .erow.income .sr { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .field.f-gross input { text-align: right; font-variant-numeric: tabular-nums; }
  /* narrow: both amounts of an income need visible labels (wide cards have column headers) */
  .erow.income .f-amount .sr, .erow.income .f-gross .sr { position: static; width: auto; height: auto; clip: auto; overflow: visible; }
  .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
  .ehead { display: none; }
  .erow.shared { grid-template-columns: minmax(0, 1fr) 110px 40px; grid-template-areas: "name name remove" "to amount amount"; }
  .erow.shared .f-name { grid-area: name; } .erow.shared .f-to { grid-area: to; }
  .erow.shared .f-amount { grid-area: amount; } .erow.shared .remove { grid-area: remove; }
  .field { display: flex; flex-direction: column; gap: 4px; min-width: 0; font-size: 12px; color: var(--secondary-text-color); }
  .field input, .field select { font: inherit; font-size: 14px; color: var(--primary-text-color); height: 40px; box-sizing: border-box; min-width: 0;
    padding: 0 10px; border-radius: 8px; border: 1px solid var(--divider-color); background: var(--ha-card-background, var(--card-background-color)); }
  .field input:focus, .field select:focus { outline: 2px solid var(--primary-color); outline-offset: -1px; }
  .field.f-amount input { text-align: right; font-variant-numeric: tabular-nums; }
  .field input.invalid { background: color-mix(in srgb, var(--error-color, #db4437) 18%, transparent); border-color: var(--error-color, #db4437); }
  .remove { width: 40px; height: 40px; }
  .toggle-space { width: 44px; flex-shrink: 0; }
  .edit-tabs { display: flex; gap: 4px; overflow-x: auto; border-bottom: 1px solid var(--divider-color); scrollbar-width: thin; }
  .edit-tab { flex-shrink: 0; height: 44px; padding: 0 16px; border: 0; border-bottom: 3px solid transparent; background: transparent;
    cursor: pointer; font-size: 14px; font-weight: 600; color: var(--secondary-text-color); white-space: nowrap; }
  .edit-tab.active { color: var(--primary-color); border-bottom-color: var(--primary-color); }
  .edit-tab { display: inline-flex; align-items: center; gap: 8px; }
  .edit-tab.add-person { color: var(--primary-color); font-weight: 500; }
  .edit-tab.add-person ha-icon { --mdc-icon-size: 18px; }
  .tabs { display: flex; gap: 8px; align-items: center; overflow-x: auto; padding: 2px 2px 12px; scrollbar-width: thin; }
  .tab { flex-shrink: 0; height: 36px; padding: 0 14px; border-radius: 18px; cursor: pointer; white-space: nowrap;
    border: 1px solid var(--divider-color); background: transparent; font-size: 14px; font-weight: 500; }
  .tab.active { background: var(--primary-color); border-color: var(--primary-color); color: var(--text-primary-color, #fff); }
  .tab.new { display: inline-flex; align-items: center; gap: 4px; border-style: dashed; color: var(--primary-color); padding-left: 8px; }
  .tab.new ha-icon { --mdc-icon-size: 18px; }
  .tab-rename { flex-shrink: 0; width: 180px; height: 36px; box-sizing: border-box; padding: 0 12px; border-radius: 18px; font: inherit; font-size: 14px;
    border: 2px solid var(--primary-color); background: var(--ha-card-background, var(--card-background-color)); color: var(--primary-text-color); }
  .small-btn { width: 36px; height: 36px; }
  .small-btn ha-icon { --mdc-icon-size: 18px; }
  .erow.tabrow { padding: 14px 0; }
  /* fixed costs on narrow cards: name, amount, frequency and delete in one line if it fits; the person below */
  .erow.tabrow.flow { gap: 8px 6px; }
  .erow.tabrow.flow .field.f-name { flex: 1 1 60px; order: 0; }
  .erow.tabrow.flow .field.f-amount { flex: 0 1 88px; order: 1; }
  .erow.tabrow.flow .field.f-freq { flex: 0 1 104px; order: 2; }
  .erow.tabrow.flow .remove { order: 3; width: 32px; }
  .erow.tabrow.flow .field.f-person { flex: 1 1 100%; order: 4; }
  .money { display: flex; align-items: center; height: 40px; box-sizing: border-box; border-radius: 8px;
    border: 1px solid var(--divider-color); background: var(--ha-card-background, var(--card-background-color)); }
  .money:focus-within { outline: 2px solid var(--primary-color); outline-offset: -1px; }
  .field .money input { flex: 1; width: 100%; height: 38px; border: 0; background: transparent; padding-right: 4px; }
  .field .money input:focus { outline: none; }
  .money .cur { padding: 0 10px 0 2px; font-size: 14px; color: var(--secondary-text-color); user-select: none; }
  .money:has(input.invalid) { background: color-mix(in srgb, var(--error-color, #db4437) 18%, transparent); border-color: var(--error-color, #db4437); }
  .field .money input.invalid { background: transparent; }
  /* narrow cards: name and delete on top, the other fields side by side as far as they fit */
  .erow.flow { display: flex; flex-wrap: wrap; }
  .erow.flow .f-name { flex: 1 1 calc(100% - 50px); order: 0; }
  .erow.flow .remove { order: 1; }
  .erow.flow .field:not(.f-name) { order: 5; flex: 1 1 92px; min-width: 0; }
  .erow.flow .field.f-amount { order: 3; }
  .erow.flow .field.f-freq { order: 4; flex: 1 1 104px; }
  .saved { display: inline-flex; align-items: center; gap: 6px; color: var(--success-color, #43a047); font-weight: 500; }
  .saved ha-icon { --mdc-icon-size: 18px; }
  .add { align-self: flex-start; display: inline-flex; align-items: center; gap: 6px; min-height: 40px; margin-top: 6px; padding: 0 12px 0 8px;
    border: 1px dashed var(--divider-color); border-radius: 20px; background: transparent; cursor: pointer; color: var(--primary-color); font-weight: 500; }
  .add ha-icon { --mdc-icon-size: 18px; }
  .footer { flex-direction: row; flex-wrap: wrap; align-items: center; gap: 10px; position: sticky; bottom: 8px; z-index: 1; }
  .save-error { flex-basis: 100%; color: var(--error-color, #db4437); font-size: 14px; }
  .btn { min-height: 44px; padding: 0 18px; border-radius: 22px; cursor: pointer; border: 1px solid var(--divider-color); background: transparent; font-weight: 500; }
  .btn.primary { background: var(--primary-color); border-color: var(--primary-color); color: var(--text-primary-color, #fff); }
  .btn[disabled] { opacity: 0.6; cursor: default; }

  /* Desktop layout */
  @container (min-width: 700px) {
    .kpis { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .kpi.main { grid-column: auto; }
    .kpi .value { font-size: 28px; }
    .kpi.small .value { font-size: 24px; }
    .row1 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .row2 { grid-template-columns: repeat(var(--cols, 3), minmax(0, 1fr)); }
    .drow { grid-template-columns: minmax(0, 1fr) 140px 130px 120px 100px 100px; grid-template-areas: "name person freq paid month year"; padding: 10px 0; min-height: 28px; }
    .d-paid { text-align: right; font-size: 14px; }
    .d-freq { display: block; grid-area: freq; font-size: 14px; color: var(--secondary-text-color); }
    .d-year { font-size: 14px; }
    .dhead { display: grid; font-size: 11px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: var(--secondary-text-color); }
    .dhead > span { font-size: 11px; color: var(--secondary-text-color); }
    .dsum { grid-template-areas: "name person freq paid month year"; }
    .table.single .drow, .table.single .dsum { grid-template-columns: minmax(0, 1fr) 130px 120px 100px 100px; grid-template-areas: "name freq paid month year"; }
    .narrow-only { display: none; }
    .wide-only { display: inline; }
    .erow.shared { grid-template-columns: minmax(0, 1fr) 160px 120px 40px; grid-template-areas: "name to amount remove"; }
    .erow.simple { grid-template-columns: minmax(0, 1fr) 140px 40px; }
    .erow.flow { display: grid; }
    .erow.tabrow { grid-template-columns: minmax(0, 1fr) 130px 160px 140px 40px; grid-template-areas: "name amount freq person remove"; }
    .erow.tabrow.single { grid-template-columns: minmax(0, 1fr) 130px 160px 40px; grid-template-areas: "name amount freq remove"; }
    .erow.tabrow .f-name { grid-area: name; } .erow.tabrow .f-amount { grid-area: amount; } .erow.tabrow .f-freq { grid-area: freq; }
    .erow.tabrow .f-person { grid-area: person; } .erow.tabrow .remove { grid-area: remove; width: 40px; }
    .ehead.tabrow { padding-bottom: 0; }
    .erow.income { grid-template-columns: minmax(0, 1fr) 150px 150px 40px; grid-template-areas: "name gross amount remove"; }
    .erow.income .f-amount .sr, .erow.income .f-gross .sr { position: absolute; width: 1px; height: 1px; clip: rect(0 0 0 0); overflow: hidden; }
    .ehead { display: grid; padding: 0 0 2px; border-top: 0; font-size: 12px; color: var(--secondary-text-color); }
    .ehead + .erow { border-top: 0; }
    .footer .hint { flex-basis: auto; }
    .cat-share { width: 44px; font-size: 12px; }
    .cat-value { width: 76px; }
  }
`;

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
