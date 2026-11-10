/*
 * The draft: the budget while it is edited. Amounts and intervals are texts as typed, every row has
 * an _id (and fixed costs _custom: the interval is typed, not chosen). Nothing here touches the page.
 */

import { activePersons } from "./model.js";

export const INTERVALS = [1, 3, 12]; // months between two payments offered as choice; any other value via "Other interval"

/*
 * Fields of every list in the order of the file (same as LISTS in logic.py) with their type:
 * text, person, amount (empty = 0), amount? (empty = not set), interval (months).
 */
export const SCHEMA = {
  income: { name: "text", person: "person", gross: "amount?", amount: "amount" },
  special_payments: { name: "text", person: "person", gross: "amount" },
  shared_income: { name: "text", to: "person", amount: "amount" },
  fixed_costs: { name: "text", category: "text", person: "person", amount: "amount", interval_months: "interval" },
};
export const LISTS = Object.keys(SCHEMA);

export const fieldType = (list, field) => SCHEMA[list]?.[field];
export const isAmount = (type) => type === "amount" || type === "amount?";

const uid = () => "r" + Math.random().toString(36).slice(2, 10);
const isEmpty = (text) => String(text ?? "").trim() === "";

/**
 * Reads an amount typed by the user: "1.480,50", "1480.5", "1 480,50 €", "1,480.50".
 * Returns a number rounded to cents, or null if it is not a valid amount (empty counts as 0).
 */
export const parseAmount = (text) => {
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

/** A whole number of months from 1 to max (the limit of the integration, if known). */
export const validInterval = (text, max = Infinity) => /^\s*\d+\s*$/.test(String(text)) && Number(text) >= 1 && Number(text) <= max;

/** Can the text of a field be saved? limits = the limits of the integration (see api.getInfo). */
export const fieldValid = (type, text, limits) => {
  if (isAmount(type)) return parseAmount(text) !== null;
  if (type === "interval") return validInterval(text, limits?.interval);
  return true;
};

// Text of a draft field for a saved value, and back (undefined = the field is left out)
const toText = (type, value, amountText) => {
  if (isAmount(type)) return value == null ? "" : amountText(value);
  if (type === "interval") return String(value ?? 1);
  return value ?? "";
};
const toValue = (type, text) => {
  if (type === "amount") return parseAmount(text) ?? 0;
  if (type === "amount?") return isEmpty(text) ? undefined : (parseAmount(text) ?? undefined);
  if (type === "interval") return Number(text) || 1;
  return text;
};

/** The draft for a saved budget; amountText formats a number for a text field (see format.js). */
export const createDraft = (data, amountText) => {
  const draft = { persons: { ...data.persons }, colors: { ...(data.colors || {}) } };
  for (const list of LISTS) {
    draft[list] = data[list].map((item) => {
      const row = { _id: uid() };
      for (const [field, type] of Object.entries(SCHEMA[list])) {
        row[field] = toText(type, item[field], amountText);
        if (type === "interval") row._custom = !INTERVALS.includes(item[field]);
      }
      return row;
    });
  }
  return draft;
};

/** A new empty row of a list (rows without name and amount are not saved); values presets fields. */
export const newRow = (list, values = {}) => {
  const row = { _id: uid() };
  for (const [field, type] of Object.entries(SCHEMA[list])) {
    row[field] = type === "person" ? "a" : type === "interval" ? "1" : "";
    if (type === "interval") row._custom = false;
  }
  return Object.assign(row, values);
};

/**
 * Checks the draft and turns it into data for saving:
 * { data, problems: [{ list, id, field }] (fields that cannot be saved), secondPersonInUse }.
 */
export const validateDraft = (draft, limits) => {
  const problems = [];
  const colors = Object.fromEntries(Object.entries(draft.colors).filter(([, color]) => color));
  const data = { persons: { ...draft.persons }, ...(Object.keys(colors).length ? { colors } : {}) };
  for (const list of LISTS) {
    data[list] = draft[list].map((row) => {
      const item = {};
      for (const [field, type] of Object.entries(SCHEMA[list])) {
        if (!fieldValid(type, row[field], limits)) problems.push({ list, id: row._id, field });
        const value = toValue(type, row[field]);
        if (value !== undefined) item[field] = value;
      }
      return item;
    });
  }
  // Without a second person everything belongs to the first one; income of the second person must be moved or removed first
  const single = activePersons(data.persons).length === 1;
  const secondPersonInUse = single && [...data.income, ...data.special_payments].some((item) => item.person === "b");
  if (single && !secondPersonInUse) {
    data.shared_income.forEach((item) => (item.to = "a"));
    data.fixed_costs.forEach((item) => (item.person = "a"));
  }
  return { data, problems, secondPersonInUse };
};

/* ---------- Categories of the fixed costs ---------- */

const categoryOf = (row) => row.category.trim();

/** Categories in the draft (alphabetical, "" = without category). */
export const costCategories = (draft) => [...new Set(draft.fixed_costs.map(categoryOf))].sort((a, b) => a.localeCompare(b));

export const costsOfCategory = (draft, category) => draft.fixed_costs.filter((row) => categoryOf(row) === category);

/** A category name that does not exist yet: "New category", "New category 2", ... */
export const freshCategory = (draft, base) => {
  const taken = new Set(costCategories(draft));
  let name = base;
  for (let i = 2; taken.has(name); i++) name = `${base} ${i}`;
  return name;
};

/** Renames a category for all its entries (an existing name merges both); returns the cleaned new name. */
export const renameCategory = (draft, from, to) => {
  const name = to.replace(/\s+/g, " ").trim();
  for (const row of draft.fixed_costs) if (categoryOf(row) === from) row.category = name;
  return name;
};

/* ---------- Tabs of the edit page ---------- */

export const TAB_SHARED = "shared_income";
export const TAB_COSTS = "fixed_costs";

const personHasEntries = (draft, p) => [...draft.income, ...draft.special_payments].some((row) => row.person === p);

/**
 * { persons, shared, keys }: one tab per person, joint income, fixed costs.
 * The second person's tab stays while it has entries (so they can be removed after clearing the name);
 * with one person joint income is only shown while it has entries.
 */
export const editTabs = (draft, addingPerson = false) => {
  const active = activePersons(draft.persons);
  const persons = ["a", ...(active.includes("b") || personHasEntries(draft, "b") || addingPerson ? ["b"] : [])];
  const shared = active.length > 1 || draft.shared_income.length > 0;
  return { persons, shared, keys: [...persons, ...(shared ? [TAB_SHARED] : []), TAB_COSTS] };
};

/** Where a problem of validateDraft is edited: { tab, category } (category only for fixed costs). */
export const problemPlace = (draft, { list, id }) => {
  const row = draft[list].find((r) => r._id === id);
  if (list === TAB_COSTS) return { tab: TAB_COSTS, category: categoryOf(row) };
  return { tab: list === TAB_SHARED ? TAB_SHARED : row.person };
};
