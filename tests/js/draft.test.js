import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import {
  SCHEMA,
  TAB_COSTS,
  TAB_SHARED,
  costCategories,
  createDraft,
  editTabs,
  fieldValid,
  freshCategory,
  newRow,
  parseAmount,
  problemPlace,
  renameCategory,
  validInterval,
  validateDraft,
} from "../../custom_components/essential_budget/frontend/draft.js";
import { formatter } from "../../custom_components/essential_budget/frontend/format.js";
import { BUDGET, german } from "./sample.js";

const LIMITS = { interval: 120 };
const draftOf = (data) => createDraft(data, formatter(german).amountText);
const withoutVersion = ({ version, ...data }) => data;

test("amounts as typed", () => {
  const cases = {
    "": 0,
    1480: 1480,
    "1.480,50": 1480.5,
    1480.5: 1480.5,
    "1 480,50 €": 1480.5,
    "1,480.50": 1480.5,
    "1.480": 1480,
    "1,480": 1480,
    "0,5": 0.5,
    "12,34": 12.34,
  };
  for (const [text, value] of Object.entries(cases)) assert.equal(parseAmount(text), value, text);
  for (const text of ["abc", "1,2,3", "-5", "1.234.56", "12,345,6"]) assert.equal(parseAmount(text), null, text);
});

test("intervals", () => {
  assert.ok(validInterval("1") && validInterval(" 12 ") && validInterval("120", 120));
  for (const text of ["", "0", "1.5", "x", "-1"]) assert.equal(validInterval(text), false, text);
  assert.equal(validInterval("121", 120), false);
  assert.equal(validInterval("121"), true); // limit unknown: the integration checks it
});

test("a draft keeps the budget: saving it unchanged gives the same data", () => {
  const { data, problems, secondPersonInUse } = validateDraft(draftOf(BUDGET), LIMITS);
  assert.deepEqual(problems, []);
  assert.equal(secondPersonInUse, false);
  assert.deepEqual(data, withoutVersion(BUDGET));
});

test("draft rows: texts for amounts, typed interval marked", () => {
  const draft = draftOf(BUDGET);
  assert.equal(draft.income[0].gross, "4800,00");
  assert.equal(draft.income[2].gross, ""); // no gross set
  assert.equal(draft.fixed_costs[2].interval_months, "12");
  assert.equal(draft.fixed_costs[2]._custom, false);
  assert.equal(draftOf({ ...BUDGET, fixed_costs: [{ ...BUDGET.fixed_costs[0], interval_months: 4 }] }).fixed_costs[0]._custom, true);
  assert.equal(new Set(draft.fixed_costs.map((row) => row._id)).size, 4);
});

test("new rows", () => {
  assert.deepEqual(Object.keys(newRow("income")).sort(), ["_id", "amount", "gross", "name", "person"]);
  const cost = newRow("fixed_costs", { category: "Home" });
  assert.deepEqual({ ...cost, _id: null }, { _id: null, name: "", category: "Home", person: "a", amount: "", interval_months: "1", _custom: false });
  assert.equal(newRow("income", { person: "b" }).person, "b");
});

test("problems name the fields that cannot be saved", () => {
  const draft = draftOf(BUDGET);
  draft.income[1].gross = "abc";
  draft.fixed_costs[3].amount = "1,2,3";
  draft.fixed_costs[3].interval_months = "0";
  const { problems } = validateDraft(draft, LIMITS);
  assert.deepEqual(problems, [
    { list: "income", id: draft.income[1]._id, field: "gross" },
    { list: "fixed_costs", id: draft.fixed_costs[3]._id, field: "amount" },
    { list: "fixed_costs", id: draft.fixed_costs[3]._id, field: "interval_months" },
  ]);
  assert.deepEqual(problemPlace(draft, problems[0]), { tab: "b" });
  assert.deepEqual(problemPlace(draft, problems[1]), { tab: TAB_COSTS, category: "" });
  assert.deepEqual(problemPlace(draft, { list: TAB_SHARED, id: draft.shared_income[0]._id, field: "amount" }), { tab: TAB_SHARED });
});

test("empty amounts: 0 where needed, left out where optional", () => {
  const draft = draftOf(BUDGET);
  draft.income[0].gross = " ";
  draft.income[0].amount = "";
  draft.special_payments[0].gross = "";
  const { data, problems } = validateDraft(draft, LIMITS);
  assert.deepEqual(problems, []);
  assert.deepEqual(data.income[0], { name: "Salary", person: "a", amount: 0 });
  assert.equal(data.special_payments[0].gross, 0);
  assert.ok(fieldValid("amount?", "", LIMITS) && fieldValid("amount", "", LIMITS));
});

test("colors: only set ones are saved", () => {
  const draft = draftOf(BUDGET);
  assert.equal("colors" in validateDraft(draft, LIMITS).data, false);
  draft.colors.b = "#112233";
  assert.deepEqual(validateDraft(draft, LIMITS).data.colors, { b: "#112233" });
});

test("removing the second person", () => {
  const draft = draftOf(BUDGET);
  draft.persons.b = " ";
  assert.equal(validateDraft(draft, LIMITS).secondPersonInUse, true); // still has income
  draft.income = draft.income.filter((row) => row.person === "a");
  draft.shared_income[0].to = "b";
  const { data, secondPersonInUse } = validateDraft(draft, LIMITS);
  assert.equal(secondPersonInUse, false);
  assert.ok(data.fixed_costs.every((item) => item.person === "a"));
  assert.equal(data.shared_income[0].to, "a");
});

test("categories", () => {
  const draft = draftOf(BUDGET);
  assert.deepEqual(costCategories(draft), ["", "Home", "Insurance"]);
  assert.equal(freshCategory(draft, "Home"), "Home 2");
  assert.equal(freshCategory(draft, "New"), "New");
  assert.equal(renameCategory(draft, "Insurance", "  Home "), "Home"); // merges
  assert.deepEqual(costCategories(draft), ["", "Home"]);
});

test("tabs of the edit page", () => {
  const draft = draftOf(BUDGET);
  assert.deepEqual(editTabs(draft).keys, ["a", "b", TAB_SHARED, TAB_COSTS]);
  draft.persons.b = "";
  assert.deepEqual(editTabs(draft).keys, ["a", "b", TAB_SHARED, TAB_COSTS]); // the second person still has income
  draft.income = draft.income.filter((row) => row.person === "a");
  assert.deepEqual(editTabs(draft).keys, ["a", TAB_SHARED, TAB_COSTS]); // joint income still has an entry
  draft.shared_income = [];
  assert.deepEqual(editTabs(draft).keys, ["a", TAB_COSTS]);
  assert.deepEqual(editTabs(draft, true).persons, ["a", "b"]); // "+ Person" was pressed
});

test("the lists have the same fields in the same order as in logic.py", () => {
  const python = readFileSync(new URL("../../custom_components/essential_budget/logic.py", import.meta.url), "utf8");
  const block = python.match(/^LISTS: .*? = \{\n([\s\S]*?)\n\}/m)[1];
  const lists = Object.fromEntries(
    [...block.matchAll(/^\s+"(\w+)": \{(.*)\},$/gm)].map(([, list, fields]) => [list, [...fields.matchAll(/"(\w+)":/g)].map((m) => m[1])]),
  );
  assert.deepEqual(lists, Object.fromEntries(Object.entries(SCHEMA).map(([list, fields]) => [list, Object.keys(fields)])));
});
