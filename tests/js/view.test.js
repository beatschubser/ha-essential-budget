import assert from "node:assert/strict";
import { test } from "node:test";

import { formatter, translator } from "../../custom_components/essential_budget/frontend/format.js";
import { buildModel } from "../../custom_components/essential_budget/frontend/model.js";
import { renderDetail, renderHeader, renderView } from "../../custom_components/essential_budget/frontend/view.js";
import { BUDGET, SINGLE, english } from "./sample.js";

const ctx = (extra = {}) => ({
  t: translator(english),
  fmt: formatter(english),
  title: "",
  isAdmin: true,
  numbersShown: true,
  open: new Set(),
  ...extra,
});
const clean = (html) => assert.ok(!/undefined|NaN|\[object/.test(html), html.match(/.{40}(undefined|NaN|\[object).{40}/s)?.[0]);

test("overview", () => {
  const html = renderView(buildModel(BUDGET), ctx());
  clean(html);
  for (const text of [
    "Monthly net",
    "€6,141",
    "Free budget per person",
    "Annual gross",
    "(12 × ",
    "No category",
    'data-action="export"',
    'data-action="openedit"',
  ])
    assert.ok(html.includes(text), text);
  assert.ok(!html.includes('class="items"')); // nothing expanded
});

test("expanded category, one person, no admin", () => {
  const html = renderView(buildModel(SINGLE), ctx({ open: new Set(["Home"]), isAdmin: false }));
  clean(html);
  assert.ok(html.includes('class="items"') && html.includes("Power"));
  assert.ok(!html.includes("Free budget per person"));
  assert.ok(!html.includes('data-action="openedit"'));
});

test("text is escaped", () => {
  const data = { ...BUDGET, persons: { a: "<b>Alex</b>", b: "Sam" }, fixed_costs: [{ ...BUDGET.fixed_costs[0], category: 'A"B' }] };
  const html = renderView(buildModel(data), ctx({ title: "<script>" }));
  assert.ok(html.includes("&lt;b&gt;Alex&lt;/b&gt;") && html.includes('data-key="A&quot;B"') && html.includes("&lt;script&gt;"));
  assert.ok(!html.includes("<b>Alex") && !html.includes("<script>"));
});

test("empty budget", () => {
  const empty = { persons: { a: "Alex", b: "" }, income: [], special_payments: [], shared_income: [], fixed_costs: [] };
  const html = renderView(buildModel(empty), ctx());
  assert.ok(html.includes("No entries yet.") && html.includes('data-action="openedit"'));
  assert.ok(!renderView(buildModel(empty), ctx({ isAdmin: false })).includes("openedit"));
});

test("header: eye button says what it does", () => {
  assert.ok(renderHeader(ctx()).includes("Hide numbers"));
  assert.ok(renderHeader(ctx({ numbersShown: false })).includes("Show numbers"));
});

test("detail view of a category", () => {
  const model = buildModel(BUDGET);
  const html = renderDetail(model, model.groups[0], ctx());
  clean(html);
  for (const text of ["Home", "Rent", "Alex", "monthly", "€1,575", "€18,900"]) assert.ok(html.includes(text), text);
});
