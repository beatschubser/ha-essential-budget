import assert from "node:assert/strict";
import { test } from "node:test";

import {
  activePersons,
  buildModel,
  buildSchedule,
  dueMonths,
  isDueIn,
  monthly,
  pct,
} from "../../custom_components/essential_budget/frontend/model.js";
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

test("debit months follow the interval", () => {
  assert.deepEqual(dueMonths({ interval_months: 1, due_day: 5 }), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  assert.deepEqual(dueMonths({ interval_months: 3, due_day: 15, due_month: 2 }), [2, 5, 8, 11]);
  assert.deepEqual(dueMonths({ interval_months: 12, due_day: 1, due_month: 7 }), [7]);
  assert.deepEqual(dueMonths({ interval_months: 6, due_day: 1, due_month: 11 }), [5, 11]);
  assert.equal(dueMonths({ interval_months: 12, due_day: 1 }), null); // month missing
  assert.equal(dueMonths({ interval_months: 1 }), null); // no day
  assert.ok(isDueIn({ interval_months: 2, due_day: 1, due_month: 1 }, 2027, 3));
});

test("schedule: debits of the next 12 months and of the next days", () => {
  const s = buildSchedule(BUDGET, new Date(2026, 10, 25), 30); // 25 Nov 2026
  assert.equal(s.any, true);
  assert.deepEqual(s.months.map((m) => `${m.year}-${m.month}`).slice(0, 3), ["2026-11", "2026-12", "2027-1"]);
  assert.equal(s.months.length, 12);
  near(s.months[0].total, 1480 + 55.08); // rent and broadcasting fee in November
  near(s.months[3].total, 1480 + 55.08 + 90); // February: also the yearly liability
  // the liability is debited at the end of February: the 28th in 2027
  assert.equal(s.months[3].items.find((d) => d.cost.name === "Liability").date.getDate(), 28);
  // from 25 Nov: the rent on 1 Dec (the debits of November are before today)
  assert.deepEqual(
    s.upcoming.map((d) => [d.cost.name, d.date.getMonth() + 1, d.date.getDate()]),
    [["Rent", 12, 1]],
  );
  assert.deepEqual(
    s.missing.map((c) => c.name),
    ["Power"],
  );
  near(sum12(s), 12 * 1480 + 4 * 55.08 + 90); // a year of debits = a year of fixed costs (except costs without date)
});

test("schedule without debit dates", () => {
  const s = buildSchedule(SINGLE, new Date(2026, 10, 25));
  assert.equal(s.any, false);
  assert.equal(s.missing.length, 4);
  assert.ok(s.months.every((m) => m.total === 0));
});

const sum12 = (s) => s.months.reduce((total, m) => total + m.total, 0);
