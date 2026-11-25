/*
 * Editing the budget inside the card (admins): the pencil starts it, "Save budget" or "Discard changes" end it.
 * It works on a draft (draft.js) that is kept in the browser until it is saved or discarded (draft-store.js);
 * the HTML comes from edit-view.js. card = the card (essential-budget-card.js).
 */

import { saveBudget } from "./api.js";
import { dropDraft, keepDraft, keptDraft } from "./draft-store.js";
import {
  INTERVALS,
  LIST_COSTS,
  costsOfCategory,
  createDraft,
  deleteCategory,
  fieldType,
  fieldValid,
  freshCategory,
  isAmount,
  newRow,
  problemCategory,
  removeSecondPerson,
  renameCategory,
  validateDraft,
} from "./draft.js";
import { dayWidth, renderEditCategory, renderEditOverview } from "./edit-view.js";
import { formatter, translator } from "./format.js";
import { errorText } from "./html.js";
import { buildModel } from "./model.js";

const NOT_AMOUNT = /[^\d.,]/g; // amount fields only take digits and separators (dot and comma)
// checked = saving was tried: all problems stay marked
const FRESH_STATE = () => ({ adding: false, confirm: null, saving: false, saveError: null, checked: false });

/** Starts editing: with the unsaved changes kept from before, else from the saved budget. */
export const startEditing = (card) => {
  card._draft = keptDraft(card._data) ?? createDraft(card._data, formatter(card._hass).amountText);
  card._edit = FRESH_STATE();
  card._schedule = false;
  card._openPage();
};

/** Back to the view, at the category that was open (if it still exists). */
const stopEditing = (card) => {
  card._draft = null;
  card._openPage();
};

/** After every change: keep the draft and draw again (the focused field stays focused). */
const changed = (card, focus = null, select = false) => {
  keepDraft(card._data, card._draft);
  card._render(focus, select);
};

const ask = (card, kind, key) => {
  card._edit.confirm = { kind, key };
  card._render();
};

/* Clicks while editing: data-action -> what happens (data = the data attributes of the clicked element). */
export const EDIT_ACTIONS = {
  save: (card) => save(card),
  cancel(card) {
    dropDraft();
    stopEditing(card);
  },
  add(card, { list, person }) {
    const row = newRow(list, { ...(person ? { person } : {}), ...(list === LIST_COSTS ? { category: card._detail ?? "" } : {}) });
    card._draft[list].push(row);
    changed(card, `[data-id="${row._id}"] input`);
  },
  remove(card, { list, id }) {
    card._draft[list] = card._draft[list].filter((row) => row._id !== id);
    changed(card);
  },
  addperson(card) {
    card._edit.adding = true;
    changed(card, '[data-bind="person-name"][data-person="b"]');
  },
  removeperson: (card) => ask(card, "person", "b"),
  resetcolor(card, { key }) {
    delete card._draft.colors[key];
    changed(card);
  },
  newcategory(card) {
    // a new category with one empty entry (empty entries are not saved), ready to be named
    const category = freshCategory(card._draft, translator(card._hass)("new_category_name"));
    card._draft.fixed_costs.push(newRow(LIST_COSTS, { category }));
    card._detail = category;
    keepDraft(card._data, card._draft);
    card._openPage();
    card._focus('[data-bind="category-name"]', true);
  },
  deletecategory: (card, { key }) => ask(card, "category", key),
  "confirm-no"(card) {
    card._edit.confirm = null;
    card._render();
  },
  "confirm-yes"(card) {
    const { kind, key } = card._edit.confirm || {};
    card._edit.confirm = null;
    if (kind === "person") {
      removeSecondPerson(card._draft);
      card._edit.adding = false;
    }
    if (kind === "category") {
      deleteCategory(card._draft, key);
      if (card._detail === key) card._detail = null;
    }
    changed(card);
  },
};

/** The draft row a field belongs to. */
const rowOf = (card, el) => card._draft[el.dataset.list].find((row) => row._id === el.dataset.id);

/*
 * Typing and choosing while editing: data-bind of the field -> what happens (el = the field, done = the field
 * was left or a choice was made). Typing only updates the draft and the key figures, so the caret stays.
 */
export const EDIT_INPUTS = {
  "person-name"(card, el, done) {
    card._draft.persons[el.dataset.person] = el.value;
    typed(card);
  },
  "person-color"(card, el, done) {
    card._draft.colors[el.dataset.person] = el.value;
    if (done) changed(card);
  },
  "category-name"(card, el, done) {
    if (!done) return;
    const from = el.dataset.key;
    const to = renameCategory(card._draft, from, el.value);
    if (card._detail === from) card._detail = to;
    // the fields stay as they are (a full redraw could swallow the click that left the field); the order follows later
    card._root.querySelectorAll(`[data-key="${CSS.escape(from)}"]`).forEach((x) => (x.dataset.key = to));
    el.value = to;
    typed(card);
  },
  "interval-select"(card, el) {
    const row = rowOf(card, el);
    if (el.value === "custom") row._custom = true;
    else Object.assign(row, { interval_months: el.value, _custom: false });
    changed(card, row._custom ? `[data-id="${row._id}"][data-bind="interval"]` : null, true);
  },
  interval(card, el, done) {
    const row = rowOf(card, el);
    el.value = el.value.replace(/\D/g, "");
    el.style.width = `${Math.max(1, el.value.length) + 0.4}ch`; // "N months" reads like the text of a select
    row.interval_months = el.value;
    // on leaving the field: 1, 3 or 12 months go back to the select; the month of the debit appears or goes
    if (done && INTERVALS.includes(Number(el.value))) Object.assign(row, { interval_months: String(Number(el.value)), _custom: false });
    done ? changed(card) : typed(card, el);
  },
  row(card, el, done) {
    const { list, field } = el.dataset;
    if (fieldType(list, field) === "day") {
      el.value = el.value.replace(/\D/g, "");
      el.style.width = dayWidth(el.value);
    }
    if (isAmount(fieldType(list, field)) && el.value.search(NOT_AMOUNT) >= 0) {
      // a pasted currency sign or spaces are removed right away, the caret stays where it was
      const caret = el.selectionStart ?? el.value.length;
      const removedBefore = el.value.slice(0, caret).match(NOT_AMOUNT)?.length ?? 0;
      el.value = el.value.replace(NOT_AMOUNT, "");
      el.setSelectionRange?.(caret - removedBefore, caret - removedBefore);
    }
    rowOf(card, el)[field] = el.value;
    // the fields stay as they are (a full redraw could swallow the click that left the field)
    typed(card, el);
    if (done) markField(card, el);
  },
};

/** While typing: keep the draft, update the key figures, and take a mark away once the text is valid. */
const typed = (card, el = null) => {
  keepDraft(card._data, card._draft);
  card._patch();
  if (el?.classList.contains("invalid")) markField(card, el);
};

/** Marks a field whose text cannot be saved. */
const markField = (card, el) => {
  const { list, field } = el.dataset;
  el.classList.toggle("invalid", !fieldValid(fieldType(list, field), el.value, card._limits));
};

/** After drawing: marks all fields that cannot be saved and those of the last save attempt (a debit day without month). */
export const markFields = (card) => {
  card._root.querySelectorAll('[data-bind="row"], [data-bind="interval"]').forEach((el) => markField(card, el));
  if (!card._edit.checked) return;
  for (const { id, field } of validateDraft(card._draft, card._limits).problems)
    card._root.querySelector(`[data-id="${id}"][data-field="${field}"]`)?.classList.add("invalid");
};

/** The card while editing: the overview with editable boxes, or the category open for editing. */
export const renderEditing = (card, ctx) => {
  const { data } = validateDraft(card._draft, card._limits);
  const model = buildModel(data);
  const editCtx = { ...ctx, limits: card._limits, model, state: card._edit };
  if (card._detail !== null && costsOfCategory(card._draft, card._detail).length) return renderEditCategory(card._draft, card._detail, editCtx);
  card._detail = null; // the category is gone
  return renderEditOverview(card._draft, card._renderKpis(model), editCtx);
};

/** Saves the draft; a problem opens the place where it can be fixed. */
const save = async (card) => {
  const t = translator(card._hass);
  const { data, problems, secondPersonInUse } = validateDraft(card._draft, card._limits);
  if (secondPersonInUse) return showProblem(card, null, t("second_person_in_use"));
  if (problems.length) return showProblem(card, problemCategory(card._draft, problems[0]), t("invalid"));
  Object.assign(card._edit, { saving: true, saveError: null });
  card._render();
  try {
    card._data = await saveBudget(card._hass, data);
    dropDraft();
    stopEditing(card);
  } catch (e) {
    Object.assign(card._edit, { saving: false, saveError: `${t("save_failed")}: ${errorText(e)}` });
    card._render();
  }
};

const showProblem = (card, category, message) => {
  card._detail = category;
  Object.assign(card._edit, { saveError: message, checked: true });
  card._openPage();
};
