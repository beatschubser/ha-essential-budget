import assert from "node:assert/strict";
import { test } from "node:test";

import { activePersons, buildModel, monthly, pct } from "../../custom_components/essential_budget/frontend/model.js";
import { BUDGET, SINGLE } from "./sample.js";

const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} != ${expected}`);

test("monthly value of a fixed cost", () => {
  assert.equal(monthly({ amount: 90, interval_months: 12 }), 7.5);
  assert.equal(monthly({ amount: 1480, interval_months: 1 }), 1480);
});

test("percent", () => {
  assert.equal(pct(1, 3), 33);
  assert.equal(pct(5, 0), 0);
});

test("active persons", () => {
  assert.deepEqual(activePersons({ a: "Alex", b: "Sam" }), ["a", "b"]);
  assert.deepEqual(activePersons({ a: "Alex", b: "  " }), ["a"]);
  assert.deepEqual(activePersons({ a: "", b: "" }), ["a"]);
});

test("totals of a budget of two persons", () => {
  const m = buildModel(BUDGET);
  assert.equal(m.incomeTotal, 3150 + 2200 + 536 + 255);
  near(m.costTotal, 1480 + 95 + 7.5 + 18.36);
  near(m.budget, m.incomeTotal - m.costTotal);
  assert.equal(m.sharedSum, 255);
  assert.equal(m.single, false);
  assert.equal(m.empty, false);
});

test("annual gross: 12 x monthly gross plus special payments, income without gross is left out", () => {
  const [alex, sam] = buildModel(BUDGET).people;
  assert.equal(alex.gross, 12 * 4800 + 3400);
  assert.deepEqual(
    alex.grossItems.map((i) => i.name),
    ["Salary", "Christmas bonus"],
  );
  assert.equal(sam.gross, 12 * 3200);
  assert.equal(buildModel(BUDGET).grossTotal, alex.gross + sam.gross);
});

test("budget per person: own and received joint income minus the costs it pays", () => {
  const [alex, sam] = buildModel(BUDGET).people;
  near(alex.budget, 3150 + 255 - 1480 - 18.36);
  near(sam.budget, 2200 + 536 - 95 - 7.5);
  const m = buildModel(BUDGET);
  near(alex.budget + sam.budget, m.budget);
});

test("categories: sorted by sum, items by monthly value, colors by name", () => {
  const { groups } = buildModel(BUDGET);
  assert.deepEqual(
    groups.map((g) => g.category),
    ["Home", "", "Insurance"],
  );
  assert.deepEqual(
    groups[0].items.map((c) => c.name),
    ["Rent", "Power"],
  );
  // colors follow the alphabetical order ("", Home, Insurance), not the order by sum
  const byName = [...groups].sort((a, b) => a.category.localeCompare(b.category));
  assert.equal(new Set(byName.map((g) => g.color)).size, 3);
});

test("one person and empty budget", () => {
  const m = buildModel(SINGLE);
  assert.equal(m.single, true);
  assert.equal(m.people.length, 1);
  near(m.people[0].budget, m.budget);
  const empty = buildModel({ persons: { a: "Alex", b: "" }, income: [], special_payments: [], shared_income: [], fixed_costs: [] });
  assert.equal(empty.empty, true);
  assert.equal(empty.budget, 0);
});
