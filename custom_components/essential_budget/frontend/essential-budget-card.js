/* Essential Budget card for Home Assistant (loaded automatically by the integration).
 *
 * - EssentialBudgetCard shows the budget and has an edit mode (pencil button, admins only).
 *   The data comes from the integration via WebSocket and is saved to /config/essential_budget.json.
 * - EssentialBudgetCardEditor is the visual card editor (only the optional title; grid options are kept).
 *
 * All amounts are stored with cents and shown rounded to whole currency units.
 * Layout: one column on narrow cards, desktop layout from DESKTOP_WIDTH (container query).
 */

const VERSION = "0.1.0";
const WS = "essential_budget";
const PERSONS = ["a", "b"];
const PERSON_COLORS = { a: "#2f6fde", b: "#d9822b", shared: "#7a8794" };
// Category colors, assigned in alphabetical order of the category names
const PALETTE = ["#2f6fde", "#7c5cd6", "#d9822b", "#1f8f74", "#b0436e", "#0e7c99", "#8a6d1f", "#a23b3b", "#4b8b2f", "#5f6b78"];
const FREQUENCIES = [12, 6, 4, 3, 2, 1]; // offered first in the edit mode; any value from 1 to 12 is valid
const LISTS = ["income", "shared_income", "fixed_costs", "annual_gross", "bonuses"];
const AMOUNT_FIELDS = ["amount", "annual_gross"]; // text fields in the edit mode that hold amounts

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
    bonuses: "Bonuses (net)",
    bonuses_hint: "Part of the annual gross",
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
    edit: "Edit budget",
    empty: "No entries yet.",
    empty_admin: "No entries yet. Use the pencil to enter your budget.",
    error: "The budget could not be loaded",
    not_set_up: "Essential Budget is not set up yet (Settings > Devices & services).",
    update_available: "Essential Budget was updated. Tap to reload the page.",
    restart_needed: "Essential Budget was updated. Please restart Home Assistant.",
    freq: { 12: "monthly", 6: "every two months", 4: "quarterly", 3: "every four months", 2: "half-yearly", 1: "yearly", n: "{n}× a year" },
    edit_title: "Edit budget",
    persons: "Persons",
    name_of: "Name of person {n}",
    name_of_optional: "Name of person {n} (optional)",
    person_n: "Person {n}",
    net_per_month: "Net per month",
    gross_optional: "Annual gross (optional)",
    one_person_hint: "Leave the second name empty for a budget of one person.",
    second_person_in_use: "The second person still has income. Remove it or enter a name for the second person.",
    shared_income: "Shared income",
    received_by: "Received by",
    name: "Name",
    category: "Category",
    amount: "Amount",
    paid_by: "Paid by",
    add_income: "Add income",
    add_shared: "Add shared income",
    add_cost: "Add fixed cost",
    add_value: "Add value",
    add_bonus: "Add bonus",
    remove: "Remove",
    cancel: "Cancel",
    save: "Save",
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
    bonuses: "Boni (netto)",
    bonuses_hint: "Teil des Jahresbruttos",
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
    edit: "Budget bearbeiten",
    empty: "Noch keine Einträge.",
    empty_admin: "Noch keine Einträge. Über den Stift erfasst du dein Budget.",
    error: "Das Budget konnte nicht geladen werden",
    not_set_up: "Essential Budget ist noch nicht eingerichtet (Einstellungen > Geräte & Dienste).",
    update_available: "Essential Budget wurde aktualisiert. Tippen, um die Seite neu zu laden.",
    restart_needed: "Essential Budget wurde aktualisiert. Bitte Home Assistant neu starten.",
    freq: { 12: "monatlich", 6: "zweimonatlich", 4: "vierteljährlich", 3: "alle vier Monate", 2: "halbjährlich", 1: "jährlich", n: "{n}× jährlich" },
    edit_title: "Budget bearbeiten",
    persons: "Personen",
    name_of: "Name Person {n}",
    name_of_optional: "Name Person {n} (optional)",
    person_n: "Person {n}",
    net_per_month: "Netto pro Monat",
    gross_optional: "Jahresbrutto (optional)",
    one_person_hint: "Für das Budget einer einzelnen Person bleibt der zweite Name leer.",
    second_person_in_use: "Die zweite Person hat noch Einnahmen. Entferne sie oder trag einen Namen für die zweite Person ein.",
    shared_income: "Geteilte Einnahmen",
    received_by: "Eingang bei",
    name: "Bezeichnung",
    category: "Kategorie",
    amount: "Betrag",
    paid_by: "Zahlt",
    add_income: "Einnahme hinzufügen",
    add_shared: "Geteilte Einnahme hinzufügen",
    add_cost: "Fixkosten hinzufügen",
    add_value: "Wert hinzufügen",
    add_bonus: "Bonus hinzufügen",
    remove: "Entfernen",
    cancel: "Abbrechen",
    save: "Speichern",
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
    return { key: p, name: data.persons[p], color: PERSON_COLORS[p], items, sum: sum(items.map((i) => i.amount)) };
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

  // Annual gross: values entered with the income items first, then the free values
  const gross = [
    ...data.income
      .filter((i) => i.annual_gross != null && active.includes(i.person))
      .map((i) => ({ name: active.length > 1 ? `${i.name} (${data.persons[i.person]})` : i.name, amount: i.annual_gross })),
    ...data.annual_gross,
  ];

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
    gross,
    grossSum: sum(gross.map((i) => i.amount)),
    bonuses: data.bonuses,
    bonusSum: sum(data.bonuses.map((i) => i.amount)),
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

  set hass(hass) {
    const first = !this._hass;
    const langChanged = this._hass && pickLocale(hass) !== this._locale;
    this._hass = hass;
    this._lang = pickLanguage(hass);
    this._locale = pickLocale(hass);
    if (first) {
      this._load();
      this._subscribe();
    } else if (langChanged && !this._draft) {
      this._render();
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
  }

  disconnectedCallback() {
    this._unsubscribe();
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
        currency: this._currency || "EUR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    } catch (e) {
      return `${Math.round(value)} ${this._currency || ""}`.trim();
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
      this._currency = result.currency;
      this._file = result.file;
      this._error = null;
      this._notSetUp = false;
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
      case "toggle":
        this._open.has(key) ? this._open.delete(key) : this._open.add(key);
        break;
      case "detail":
        this._detail = key;
        break;
      case "back":
        this._detail = null;
        break;
      case "edit":
        this._startEdit();
        break;
      case "cancel":
        this._draft = null;
        this._saveError = null;
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
        ...(list === "income" ? { annual_gross: item.annual_gross != null ? amount(item.annual_gross) : "" } : {}),
        _id: uid(),
      }));
    this._detail = null;
    this._saveError = null;
  }

  _addRow(list, person) {
    const row = { _id: uid(), name: "", amount: "" };
    if (list === "income") row.person = person;
    if (list === "shared_income") row.to = "a";
    if (list === "fixed_costs") Object.assign(row, { category: "", person: "a", payments_per_year: 12 });
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
    if (list === "persons") {
      this._draft.persons[field] = el.value;
      // on leaving the field: show or hide the sections of the second person
      if (e.type === "change" && activePersons(this._draft.persons).length !== this._editPersons) this._render();
      return;
    }
    const row = this._draft[list]?.find((r) => r._id === id);
    if (!row) return;
    row[field] = field === "payments_per_year" ? Number(el.value) : el.value;
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
        if ("annual_gross" in row) {
          // optional: an empty field means no annual gross for this income
          const gross = String(row.annual_gross ?? "").trim() === "" ? null : parseAmount(row.annual_gross);
          if (gross === null) delete result.annual_gross;
          else result.annual_gross = gross;
          if (gross === null && String(row.annual_gross ?? "").trim() !== "") invalid = true;
        }
        return result;
      });
    }
    this._root.querySelectorAll(AMOUNT_FIELDS.map((f) => `[data-field="${f}"]`).join(",")).forEach((el) => this._markField(el));
    if (activePersons(data.persons).length === 1) {
      // without a second person everything belongs to the first one; income of the second person must be moved or removed first
      if (data.income.some((r) => r.person === "b")) {
        this._showSaveError(this.t("second_person_in_use"));
        return;
      }
      data.shared_income.forEach((r) => (r.to = "a"));
      data.fixed_costs.forEach((r) => (r.person = "a"));
    }
    if (invalid) {
      this._showSaveError(this.t("invalid"));
      return;
    }
    this._saving = true;
    this._render();
    try {
      const result = await this._hass.callWS({ type: `${WS}/save`, data });
      this._data = result.data;
      this._draft = null;
      this._saveError = null;
    } catch (e) {
      this._saveError = `${this.t("save_failed")}: ${errorText(e)}`;
    }
    this._saving = false;
    this._render();
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
    this._root.innerHTML = update + body;
  }

  _header() {
    if (!this._config.title && !this._isAdmin) return "";
    const title = this._config.title ? `<h1 class="title">${esc(this._config.title)}</h1>` : "<span></span>";
    const edit = this._isAdmin
      ? `<button class="icon-btn" data-action="edit" title="${esc(this.t("edit"))}" aria-label="${esc(this.t("edit"))}"><ha-icon icon="mdi:pencil"></ha-icon></button>`
      : "";
    return `<div class="header">${title}${edit}</div>`;
  }

  _section(icon, title, right = "", extra = "") {
    return `<div class="section-head"><ha-icon icon="${icon}"></ha-icon><h2>${esc(title)}</h2>${right ? `<span class="head-value">${right}</span>` : ""}</div>${extra}`;
  }

  _renderView(m) {
    if (m.empty) return `${this._header()}<div class="box msg">${esc(this.t(this._isAdmin ? "empty_admin" : "empty"))}</div>`;
    const negative = (v) => (v < 0 ? " negative" : "");

    const kpis = `<div class="kpis">
      <div class="box kpi"><span class="label">${esc(this.t("income"))}</span><span class="value">${esc(this._money(m.incomeTotal))}</span><span class="sub">${esc(this.t("per_month"))}</span></div>
      <div class="box kpi"><span class="label">${esc(this.t("fixed_costs"))}</span><span class="value">${esc(this._money(m.costTotal))}</span><span class="sub">${esc(this.t("of_income", { p: `${pct(m.costTotal, m.incomeTotal)} %` }))}</span></div>
      <div class="box kpi main${negative(m.budget)}"><span class="label">${esc(this.t("budget"))}</span><span class="value">${esc(this._money(m.budget))}</span><span class="sub">${esc(this.t("after_costs"))}</span></div>
    </div>`;

    const lines = (items) =>
      items.map((i) => `<div class="line"><span class="ellipsis">${esc(i.name)}</span><span>${esc(this._money(i.amount))}</span></div>`).join("");
    const block = (name, color, value, items) =>
      `<div class="block"><div class="block-head"><span class="dot" style="background:${color}"></span><span class="grow">${esc(name)}</span><span class="strong">${esc(this._money(value))}</span></div>${lines(items)}</div>`;
    const income = `<div class="box">${this._section("mdi:cash-plus", this.t("income"))}
      <div class="blocks">${m.people.map((p) => block(p.name, p.color, p.sum, p.items)).join("")}
      ${m.shared.length ? block(this.t("shared"), PERSON_COLORS.shared, m.sharedSum, m.shared) : ""}</div></div>`;

    const maxGroup = Math.max(...m.groups.map((g) => g.sum), 0);
    const categoryName = (g) => g.category || this.t("no_category");
    const costs = `<div class="box">${this._section("mdi:receipt-text-outline", this.t("fixed_costs"), esc(`${this._money(m.costTotal)} ${this.t("per_month")}`))}
      ${m.groups
        .map((g) => {
          const open = this._open.has(g.category);
          const name = categoryName(g);
          const maxItem = Math.max(...g.items.map((c) => c.monthly), 0);
          const items = open
            ? `<div class="items">${g.items
                .map(
                  (c) => `<div class="item"><div class="item-main"><span class="ellipsis" title="${esc(c.name)}">${esc(c.name)}</span>
                  <span class="item-freq">${esc(this._freq(c.payments_per_year))}</span>
                  <span class="bar thin"><i style="width:${maxItem ? (c.monthly / maxItem) * 100 : 0}%;background:${g.color}"></i></span></div>
                  <span class="item-value">${esc(this._money(c.monthly))}</span></div>`
                )
                .join("")}</div>`
            : "";
          return `<div class="cat">
            <div class="cat-row">
              <button class="icon-btn" data-action="toggle" data-key="${esc(g.category)}" aria-expanded="${open}" aria-label="${esc(this.t(open ? "collapse" : "expand", { c: name }))}"><ha-icon icon="mdi:chevron-${open ? "down" : "right"}"></ha-icon></button>
              <button class="cat-btn" data-action="detail" data-key="${esc(g.category)}" aria-label="${esc(this.t("open_details", { c: name }))}">
                <span class="cat-main"><span class="ellipsis strong">${esc(name)}</span><span class="bar"><i style="width:${maxGroup ? (g.sum / maxGroup) * 100 : 0}%;background:${g.color}"></i></span></span>
                <span class="cat-share">${pct(g.sum, m.costTotal)} %</span>
                <span class="cat-value">${esc(this._money(g.sum))}</span>
                <ha-icon class="muted" icon="mdi:chevron-right"></ha-icon>
              </button>
            </div>${items}</div>`;
        })
        .join("")}</div>`;

    const rows = (items) =>
      items.map((i) => `<div class="row"><span class="ellipsis">${esc(i.name)}</span><span>${esc(this._money(i.amount))}</span></div>`).join("");
    const perPerson = `<div class="box">${this._section("mdi:wallet-outline", this.t("budget_per_person"))}
      ${m.budgetPerPerson
        .map((p) => `<div class="row"><span class="strong" style="color:${p.color}">${esc(p.name)}</span><span class="strong${negative(p.value)}">${esc(this._money(p.value))}</span></div>`)
        .join("")}</div>`;
    const gross = `<div class="box">${this._section("mdi:calendar-range", this.t("annual_gross"), esc(this._money(m.grossSum)))}${rows(m.gross)}</div>`;
    const bonuses = `<div class="box">${this._section("mdi:gift-outline", this.t("bonuses"), esc(this._money(m.bonusSum)), `<div class="hint">${esc(this.t("bonuses_hint"))}</div>`)}${rows(m.bonuses)}</div>`;

    // With one person the budget per person equals the budget: no extra box
    return `${this._header()}${kpis}<div class="row1">${income}${costs}</div><div class="row2 ${m.single ? "two" : ""}">${m.single ? "" : perPerson}${gross}${bonuses}</div>`;
  }

  _renderDetail(m, g) {
    const name = g.category || this.t("no_category");
    const tile = (label, value) => `<div class="box kpi small"><span class="label">${esc(label)}</span><span class="value">${esc(value)}</span></div>`;
    const items = g.items
      .map((c) => {
        const person = this._data.persons[c.person];
        return `<div class="drow">
          <span class="d-name strong">${esc(c.name)}</span>
          <span class="d-person"><span class="chip" style="--c:${PERSON_COLORS[c.person]}">${esc(person)}</span></span>
          <span class="d-freq">${esc(this._freq(c.payments_per_year))}</span>
          <span class="d-paid"><span class="narrow-only">${esc(this._money(c.amount))} ${esc(this._freq(c.payments_per_year))}</span><span class="wide-only">${esc(this._money(c.amount))}</span></span>
          <span class="d-month strong">${esc(this._money(c.monthly))}<span class="narrow-only muted small"> ${esc(this.t("per_month"))}</span></span>
          <span class="d-year">${esc(this._money(c.monthly * 12))}<span class="narrow-only"> ${esc(this.t("per_year"))}</span></span>
        </div>`;
      })
      .join("");
    return `<div class="detail-head">
        <button class="icon-btn round" data-action="back" aria-label="${esc(this.t("back"))}" title="${esc(this.t("back"))}"><ha-icon icon="mdi:arrow-left"></ha-icon></button>
        <span class="dot square" style="background:${g.color}"></span><h1 class="title grow">${esc(name)}</h1>
      </div>
      <div class="kpis detail">${tile(this.t("per_month"), this._money(g.sum))}${tile(this.t("per_year"), this._money(g.sum * 12))}${tile(this.t("share"), `${pct(g.sum, m.costTotal)} %`)}</div>
      <div class="box table ${m.single ? "single" : ""}">
        <div class="drow dhead"><span class="d-name">${esc(this.t("item"))}</span><span class="d-person">${esc(this.t("person"))}</span><span class="d-freq">${esc(this.t("frequency"))}</span><span class="d-paid">${esc(this.t("per_payment"))}</span><span class="d-month">${esc(this.t("per_month"))}</span><span class="d-year">${esc(this.t("per_year"))}</span></div>
        ${items}
        <div class="drow dsum"><span class="d-name">${esc(this.t("sum"))}</span><span class="d-month">${esc(this._money(g.sum))}</span><span class="d-year">${esc(this._money(g.sum * 12))}</span></div>
      </div>`;
  }

  _renderEdit() {
    const d = this._draft;
    const input = (list, row, field, label, extra = "") =>
      `<label class="field f-${field}"><span class="sr">${esc(label)}</span><input type="text" placeholder="${esc(label)}" data-list="${list}" data-id="${row._id}" data-field="${field}" value="${esc(row[field])}" ${extra}></label>`;
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
    const simpleRows = (list) =>
      d[list].map((r) => `<div class="erow simple" data-id="${r._id}">${input(list, r, "name", this.t("name"))}${amount(list, r)}${remove(list, r)}</div>`).join("");

    const categories = [...new Set(d.fixed_costs.map((c) => c.category.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));

    const active = activePersons(d.persons);
    const single = active.length === 1;
    this._editPersons = active.length;
    const persons = `<div class="box">${this._section("mdi:account-multiple", this.t("persons"))}<div class="erow persons">${PERSONS.map(
      (p, i) =>
        `<label class="field"><span>${esc(this.t(p === "a" ? "name_of" : "name_of_optional", { n: i + 1 }))}</span><input type="text" data-list="persons" data-field="${p}" value="${esc(d.persons[p])}"></label>`
    ).join("")}</div><div class="hint flat">${esc(this.t("one_person_hint"))}</div></div>`;

    // column headers, only shown on wide cards
    const head = (cls, cols) => `<div class="erow ${cls} ehead">${cols.map(([f, label]) => `<span class="f-${f}">${esc(label)}</span>`).join("")}</div>`;
    // the second person's income stays visible while it has entries, so it can be removed after clearing the name
    const incomePersons = PERSONS.filter((p) => active.includes(p) || d.income.some((r) => r.person === p));
    const income = `<div class="box">${this._section("mdi:cash-plus", this.t("income"))}${incomePersons.map(
      (p, i) => `<div class="esub"><div class="block-head"><span class="dot" style="background:${PERSON_COLORS[p]}"></span>${esc(d.persons[p].trim() || this.t("person_n", { n: i + 1 }))}</div>
        ${d.income.some((r) => r.person === p) ? head("income", [["name", this.t("name")], ["amount", this.t("net_per_month")], ["gross", this.t("gross_optional")]]) : ""}
        ${d.income
          .filter((r) => r.person === p)
          .map(
            (r) =>
              `<div class="erow income" data-id="${r._id}">${input("income", r, "name", this.t("name"))}${input("income", r, "amount", this.t("net_per_month"), 'inputmode="decimal" autocomplete="off"')}${input("income", r, "annual_gross", this.t("gross_optional"), 'inputmode="decimal" autocomplete="off"')}${remove("income", r)}</div>`
          )
          .join("")}
        ${add("income", this.t("add_income"), p)}</div>`
    ).join("")}</div>`;

    const shared = `<div class="box">${this._section("mdi:account-group-outline", this.t("shared_income"))}
      ${d.shared_income.length && !single ? head("shared", [["name", this.t("name")], ["to", this.t("received_by")], ["amount", this.t("amount")]]) : ""}
      ${d.shared_income.map((r) => `<div class="erow ${single ? "simple" : "shared"}" data-id="${r._id}">${input("shared_income", r, "name", this.t("name"))}${single ? "" : personSelect("shared_income", r, "to", this.t("received_by"))}${amount("shared_income", r)}${remove("shared_income", r)}</div>`).join("")}
      ${add("shared_income", this.t("add_shared"))}</div>`;

    const costs = `<div class="box">${this._section("mdi:receipt-text-outline", this.t("fixed_costs"))}
      ${d.fixed_costs.length ? head(`cost ${single ? "single" : ""}`, [["name", this.t("name")], ["category", this.t("category")], ...(single ? [] : [["person", this.t("paid_by")]]), ["freq", this.t("frequency")], ["amount", this.t("amount")]]) : ""}
      <datalist id="eb-categories">${categories.map((c) => `<option value="${esc(c)}"></option>`).join("")}</datalist>
      ${d.fixed_costs
        .map(
          (r) => `<div class="erow cost ${single ? "single" : ""}" data-id="${r._id}">${input("fixed_costs", r, "name", this.t("name"))}${input("fixed_costs", r, "category", this.t("category"), 'list="eb-categories"')}${single ? "" : personSelect("fixed_costs", r, "person", this.t("paid_by"))}${freqSelect(r)}${amount("fixed_costs", r)}${remove("fixed_costs", r)}</div>`
        )
        .join("")}
      ${add("fixed_costs", this.t("add_cost"))}</div>`;

    const gross = `<div class="box">${this._section("mdi:calendar-range", this.t("annual_gross"))}${simpleRows("annual_gross")}${add("annual_gross", this.t("add_value"))}</div>`;
    const bonuses = `<div class="box">${this._section("mdi:gift-outline", this.t("bonuses"), "", `<div class="hint">${esc(this.t("bonuses_hint"))}</div>`)}${simpleRows("bonuses")}${add("bonuses", this.t("add_bonus"))}</div>`;

    const footer = `<div class="box footer">
      <div class="save-error" ${this._saveError ? "" : "hidden"}>${esc(this._saveError || "")}</div>
      <span class="hint grow">${esc(this.t("file_hint", { file: this._file || "essential_budget.json" }))}</span>
      <button class="btn" data-action="cancel" ${this._saving ? "disabled" : ""}>${esc(this.t("cancel"))}</button>
      <button class="btn primary" data-action="save" ${this._saving ? "disabled" : ""}>${esc(this.t(this._saving ? "saving" : "save"))}</button>
    </div>`;

    // With one person shared income is just income: the section only stays while it still has entries
    const showShared = !single || d.shared_income.length > 0;
    return `<div class="header"><h1 class="title">${esc(this.t("edit_title"))}</h1></div>${persons}${income}${showShared ? shared : ""}${costs}${gross}${bonuses}${footer}`;
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
      this._form.computeLabel = () => (pickLanguage(this._hass) === "de" ? "Titel (optional)" : "Title (optional)");
      this._form.addEventListener("value-changed", (e) => {
        const config = { ...this._config, ...e.detail.value };
        if (!config.title) delete config.title;
        this._config = config;
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }));
      });
      this.append(this._form);
    }
    this._form.hass = this._hass;
    this._form.schema = [{ name: "title", selector: { text: {} } }];
    this._form.data = { title: this._config.title || "" };
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
  .kpi .value { font-size: 24px; font-weight: 700; }
  .kpi.main { grid-column: 1 / -1; order: -1; box-shadow: inset 0 0 0 2px var(--primary-color); }
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
  .table.single .d-person { display: none; }
  .table.single .drow { grid-template-areas: "name month" "paid year"; }
  .table.single .dsum { grid-template-areas: "name month" ". year"; }
  .erow.cost.single { grid-template-areas: "name name remove" "category amount amount" "freq freq freq"; }

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
  .erow.income { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 40px; grid-template-areas: "name name remove" "amount gross gross"; }
  .erow.income .f-name { grid-area: name; } .erow.income .f-amount { grid-area: amount; }
  .erow.income .f-annual_gross, .erow.income .f-gross { grid-area: gross; } .erow.income .remove { grid-area: remove; }
  .field.f-annual_gross input { text-align: right; font-variant-numeric: tabular-nums; }
  /* narrow: both amounts of an income need visible labels (wide cards have column headers) */
  .erow.income .f-amount .sr, .erow.income .f-annual_gross .sr { position: static; width: auto; height: auto; clip: auto; overflow: visible; }
  .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
  .ehead { display: none; }
  .erow.shared { grid-template-columns: minmax(0, 1fr) 110px 40px; grid-template-areas: "name name remove" "to amount amount"; }
  .erow.shared .f-name { grid-area: name; } .erow.shared .f-to { grid-area: to; }
  .erow.shared .f-amount { grid-area: amount; } .erow.shared .remove { grid-area: remove; }
  .erow.cost { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 40px;
    grid-template-areas: "name name remove" "category amount amount" "person freq freq"; }
  .erow.cost .f-name { grid-area: name; } .erow.cost .f-category { grid-area: category; } .erow.cost .f-person { grid-area: person; }
  .erow.cost .f-freq { grid-area: freq; } .erow.cost .f-amount { grid-area: amount; } .erow.cost .remove { grid-area: remove; }
  .field { display: flex; flex-direction: column; gap: 4px; min-width: 0; font-size: 12px; color: var(--secondary-text-color); }
  .field input, .field select { font: inherit; font-size: 14px; color: var(--primary-text-color); height: 40px; box-sizing: border-box; min-width: 0;
    padding: 0 10px; border-radius: 8px; border: 1px solid var(--divider-color); background: var(--ha-card-background, var(--card-background-color)); }
  .field input:focus, .field select:focus { outline: 2px solid var(--primary-color); outline-offset: -1px; }
  .field.f-amount input { text-align: right; font-variant-numeric: tabular-nums; }
  .field input.invalid { background: color-mix(in srgb, var(--error-color, #db4437) 18%, transparent); border-color: var(--error-color, #db4437); }
  .remove { width: 40px; height: 40px; }
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
    .kpi.main { grid-column: auto; order: 0; }
    .kpi .value { font-size: 28px; }
    .kpi.small .value { font-size: 24px; }
    .row1 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .row2 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .drow { grid-template-columns: minmax(0, 1fr) 140px 130px 120px 100px 100px; grid-template-areas: "name person freq paid month year"; padding: 10px 0; min-height: 28px; }
    .d-paid { text-align: right; font-size: 14px; }
    .d-freq { display: block; grid-area: freq; font-size: 14px; color: var(--secondary-text-color); }
    .d-year { font-size: 14px; }
    .dhead { display: grid; font-size: 11px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: var(--secondary-text-color); }
    .dhead > span { font-size: 11px; color: var(--secondary-text-color); }
    .dsum { grid-template-areas: "name person freq paid month year"; }
    .table.single .drow, .table.single .dsum { grid-template-columns: minmax(0, 1fr) 130px 120px 100px 100px; grid-template-areas: "name freq paid month year"; }
    .row2.two { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .erow.cost.single { grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr) 160px 120px 40px; grid-template-areas: "name category freq amount remove"; }
    .narrow-only { display: none; }
    .wide-only { display: inline; }
    .erow.shared { grid-template-columns: minmax(0, 1fr) 160px 120px 40px; grid-template-areas: "name to amount remove"; }
    .erow.cost { grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr) 140px 160px 120px 40px; grid-template-areas: "name category person freq amount remove"; }
    .erow.simple { grid-template-columns: minmax(0, 1fr) 140px 40px; }
    .erow.income { grid-template-columns: minmax(0, 1fr) 140px 180px 40px; grid-template-areas: "name amount gross remove"; }
    .erow.income .f-amount .sr, .erow.income .f-annual_gross .sr { position: absolute; width: 1px; height: 1px; clip: rect(0 0 0 0); overflow: hidden; }
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
