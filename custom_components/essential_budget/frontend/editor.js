/*
 * <essential-budget-editor>: edits the budget (shown on the edit page, see panel.js).
 * It works on a draft (draft.js) and saves it with its own button; the HTML comes from edit-view.js.
 */

import { getBudget, getInfo, saveBudget } from "./api.js";
import {
  INTERVALS,
  TAB_COSTS,
  costCategories,
  createDraft,
  editTabs,
  fieldType,
  fieldValid,
  freshCategory,
  isAmount,
  newRow,
  problemPlace,
  renameCategory,
  validateDraft,
} from "./draft.js";
import { renderEditor } from "./edit-view.js";
import { formatter, translator } from "./format.js";
import { errorText, esc } from "./html.js";
import { BASE_STYLE, EDIT_STYLE } from "./styles.js";
import { reloadPage, renderUpdate, updateState } from "./version.js";

const SAVED_NOTE_MS = 4000; // how long "Saved" is shown
const NOT_AMOUNT = /[^\d.,]/g; // amount fields only take digits and separators (dot and comma)

/* Clicks: data-action of the clicked element -> what happens (ed = the editor, data = its data attributes). */
const ACTIONS = {
  reload: (ed) => reloadPage(ed._info.version),
  save: (ed) => ed._save(),
  cancel: (ed) => ed._startDraft(), // discard: start again from the saved budget
  tab(ed, { key }) {
    ed._state.tab = key;
    ed._state.renaming = false;
    ed._render();
  },
  category(ed, { key }) {
    ed._state.category = key;
    ed._state.renaming = false;
    ed._render();
  },
  add(ed, { list, person }) {
    const row = newRow(list, { ...(person ? { person } : {}), ...(list === TAB_COSTS ? { category: ed._state.category } : {}) });
    ed._draft[list].push(row);
    ed._render(`[data-id="${row._id}"] input`);
  },
  remove(ed, { list, id }) {
    ed._draft[list] = ed._draft[list].filter((row) => row._id !== id);
    ed._render();
  },
  addperson(ed) {
    ed._addingPerson = true;
    ed._state.tab = "b";
    ed._render('[data-bind="person-name"]');
  },
  resetcolor(ed, { key }) {
    delete ed._draft.colors[key];
    ed._render();
  },
  newcategory(ed) {
    // a new tab with one empty entry (empty entries are not saved), ready to be named
    const category = freshCategory(ed._draft, ed._t("new_category_name"));
    ed._draft.fixed_costs.push(newRow(TAB_COSTS, { category }));
    Object.assign(ed._state, { category, renaming: true });
    ed._render(".tab-rename", true);
  },
  rename(ed) {
    ed._state.renaming = !ed._state.renaming;
    ed._render(".tab-rename", true);
  },
};

/*
 * Typing and choosing: data-bind of the field -> what happens (el = the field, done = the field was left
 * or a choice was made). Typing only updates the draft without drawing again, so the focus stays.
 */
const INPUTS = {
  "person-name"(ed, el, done) {
    ed._draft.persons[el.dataset.person] = el.value;
    if (done) ed._render(); // tab label, person selects and the tabs of the second person
  },
  "person-color"(ed, el, done) {
    ed._draft.colors[el.dataset.person] = el.value;
    if (done) ed._render(); // tab dot and reset button
  },
  "category-name"(ed, el, done) {
    if (!done) return;
    ed._state.category = renameCategory(ed._draft, ed._state.category, el.value);
    ed._state.renaming = false;
    ed._render();
  },
  "interval-select"(ed, el) {
    const row = ed._row(el);
    if (el.value === "custom") row._custom = true;
    else Object.assign(row, { interval_months: el.value, _custom: false });
    ed._render(row._custom ? `[data-id="${row._id}"][data-bind="interval"]` : null, true);
  },
  interval(ed, el, done) {
    const row = ed._row(el);
    el.value = el.value.replace(/\D/g, "");
    el.style.width = `${Math.max(1, el.value.length) + 0.4}ch`; // "N months" reads like the text of a select
    row.interval_months = el.value;
    ed._remark(el);
    // on leaving the field: 1, 3 or 12 months go back to the select
    if (done && INTERVALS.includes(Number(el.value))) {
      Object.assign(row, { interval_months: String(Number(el.value)), _custom: false });
      ed._render();
    }
  },
  row(ed, el) {
    const { list, field } = el.dataset;
    if (isAmount(fieldType(list, field)) && el.value.search(NOT_AMOUNT) >= 0) {
      // a pasted currency sign or spaces are removed right away, the caret stays where it was
      const caret = el.selectionStart ?? el.value.length;
      const removedBefore = el.value.slice(0, caret).match(NOT_AMOUNT)?.length ?? 0;
      el.value = el.value.replace(NOT_AMOUNT, "");
      el.setSelectionRange?.(caret - removedBefore, caret - removedBefore);
    }
    ed._row(el)[field] = el.value;
    ed._remark(el);
  },
};

class EssentialBudgetEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" }).innerHTML = `<style>${BASE_STYLE}${EDIT_STYLE}</style><div class="root"></div>`;
    this._root = this.shadowRoot.querySelector(".root");
    this._root.addEventListener("click", (e) => {
      const el = e.target.closest("[data-action]");
      if (el) ACTIONS[el.dataset.action]?.(this, el.dataset);
    });
    const onInput = (e) => this._draft && INPUTS[e.target.dataset?.bind]?.(this, e.target, e.type === "change");
    this._root.addEventListener("input", onInput);
    this._root.addEventListener("change", onInput);
    // an amount is checked when its field is left
    this._root.addEventListener("focusout", (e) => this._draft && e.target.dataset?.bind === "row" && this._mark(e.target));
    this._state = { tab: null, category: null, renaming: false, saving: false, saveError: null, saved: false };
    this._info = {};
  }

  set hass(hass) {
    const first = !this._hass;
    this._hass = hass;
    if (first) this._load();
  }

  get _t() {
    return translator(this._hass);
  }

  async _load() {
    try {
      this._data = await getBudget(this._hass);
      this._info = await getInfo(this._hass);
      this._startDraft();
    } catch (e) {
      this._error = e?.code === "not_found" ? this._t("not_set_up") : `${this._t("error")}: ${errorText(e)}`;
      this._render();
    }
  }

  /** Starts editing from the saved budget (also after saving and after "Discard changes"). */
  _startDraft() {
    this._draft = createDraft(this._data, formatter(this._hass).amountText);
    this._addingPerson = false;
    Object.assign(this._state, { renaming: false, saveError: null });
    this._render();
  }

  /** The draft row a field belongs to. */
  _row(el) {
    return this._draft[el.dataset.list].find((row) => row._id === el.dataset.id);
  }

  /** Marks a field whose text cannot be saved. */
  _mark(el) {
    const { list, field } = el.dataset;
    el.classList.toggle("invalid", !fieldValid(fieldType(list, field), el.value, this._info.limits));
  }

  /** While typing a mark is only taken away again, never set (that happens on leaving the field and on saving). */
  _remark(el) {
    if (el.classList.contains("invalid")) this._mark(el);
  }

  async _save() {
    const { data, problems, secondPersonInUse } = validateDraft(this._draft, this._info.limits);
    if (secondPersonInUse) return this._showProblem({ tab: "b" }, this._t("second_person_in_use"));
    if (problems.length) return this._showProblem(problemPlace(this._draft, problems[0]), this._t("invalid"));
    this._state.saving = true;
    this._render();
    try {
      this._data = await saveBudget(this._hass, data);
      this._state.saved = true;
      clearTimeout(this._savedTimer);
      this._savedTimer = setTimeout(() => {
        this._state.saved = false;
        this._render();
      }, SAVED_NOTE_MS);
      this._state.saving = false;
      this._startDraft(); // continue editing with the saved values
    } catch (e) {
      Object.assign(this._state, { saving: false, saveError: `${this._t("save_failed")}: ${errorText(e)}` });
      this._render();
    }
  }

  /** Opens the tab (and category) of a problem, shows the message and marks the fields there. */
  _showProblem({ tab, category }, message) {
    Object.assign(this._state, { tab, saveError: message, ...(category === undefined ? {} : { category }) });
    this._render();
    this._root.querySelectorAll('[data-bind="row"], [data-bind="interval"]').forEach((el) => this._mark(el));
  }

  /** Draws the page; focus = selector of the field to continue in (select = with its text selected). */
  _render(focus = null, select = false) {
    if (!this._hass) return;
    const t = this._t;
    this._root.lang = t.lang;
    const update = renderUpdate(updateState(this._info.version), t);
    if (this._error || !this._draft) {
      this._root.innerHTML = update + (this._error ? `<div class="box msg err">${esc(this._error)}</div>` : "");
      return;
    }
    // the open tab and category must exist (names change, entries are removed)
    const tabs = editTabs(this._draft, this._addingPerson);
    const categories = costCategories(this._draft);
    if (!tabs.keys.includes(this._state.tab)) this._state.tab = tabs.keys[0];
    if (!categories.includes(this._state.category)) this._state.category = categories[0] ?? "";
    const ctx = { t, fmt: formatter(this._hass), limits: this._info.limits ?? {} };
    this._root.innerHTML = update + renderEditor(this._draft, tabs, categories, this._state, ctx);
    const el = focus && this._root.querySelector(focus);
    if (el) select ? el.select() : el.focus();
  }
}

if (!customElements.get("essential-budget-editor")) customElements.define("essential-budget-editor", EssentialBudgetEditor);
