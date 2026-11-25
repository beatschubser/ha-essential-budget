import assert from "node:assert/strict";
import { test } from "node:test";

import { budgetSheets } from "../../custom_components/essential_budget/frontend/export.js";
import { formatter, translator } from "../../custom_components/essential_budget/frontend/format.js";
import { buildXlsx, colName } from "../../custom_components/essential_budget/frontend/xlsx.js";
import { BUDGET, SINGLE, english } from "./sample.js";

const fmt = formatter(english);
const TODAY = new Date(2026, 10, 25); // the debits by month start in November 2026

const t = translator(english);

test("column names", () => {
  assert.deepEqual([0, 25, 26, 51, 52].map(colName), ["A", "Z", "AA", "AZ", "BA"]);
});

test("income sheet: one row per income, special payment and joint income, sums as formulas", () => {
  const [income] = budgetSheets(BUDGET, t, fmt, TODAY);
  assert.equal(income.name, "Income");
  assert.deepEqual(
    income.columns.map((c) => c.header),
    ["Person", "Type", "Name", "Gross per month", "Net per month", "Gross per year"],
  );
  assert.deepEqual(income.rows[0], ["Alex", "Income", "Salary", 4800, 3150, { f: "D2*12", v: 57600 }]);
  assert.deepEqual(income.rows[2], ["Sam", "Income", "Side job", null, 536, null]); // no gross set
  assert.deepEqual(income.rows[3], ["Alex", "Special payment", "Christmas bonus", null, null, 3400]);
  assert.deepEqual(income.rows[4], ["Alex", "Joint income", "Child benefit", null, 255, null]);
  const total = income.rows.at(-1);
  assert.equal(total.bold, true);
  assert.deepEqual(
    [...total],
    ["Total", null, null, { f: "SUM(D2:D6)", v: 8000 }, { f: "SUM(E2:E6)", v: 6141 }, { f: "SUM(F2:F6)", v: 57600 + 38400 + 3400 }],
  );
});

test("fixed costs sheet: sorted by category and name, monthly and yearly values as formulas", () => {
  const [, costs] = budgetSheets(BUDGET, t, fmt, TODAY);
  assert.deepEqual(
    costs.rows.slice(0, -1).map((r) => r[1]),
    ["Broadcasting fee", "Power", "Rent", "Liability"],
  );
  assert.deepEqual(costs.rows[0], [
    "No category",
    "Broadcasting fee",
    "Alex",
    55.08,
    3,
    "Feb, May, Aug, Nov, day 15",
    { f: "D2/E2", v: 55.08 / 3 },
    { f: "G2*12", v: (55.08 / 3) * 12 },
  ]);
  assert.deepEqual(
    costs.rows.slice(0, -1).map((r) => r[5]),
    ["Feb, May, Aug, Nov, day 15", "", "day 1", "Feb, end of month"],
  );
  assert.equal(costs.rows.at(-1)[6].f, "SUM(G2:G5)");
  assert.equal(costs.rows.at(-1)[3], null); // amounts per payment are not added up
});

test("debits by month: the next 12 months with the monthly average", () => {
  const sheets = budgetSheets(BUDGET, t, fmt, TODAY);
  assert.equal(sheets.length, 3);
  const months = sheets[2];
  assert.deepEqual(
    months.columns.map((c) => c.header),
    ["Month", "Debits", "Fixed costs per month"],
  );
  assert.equal(months.rows.length, 13); // 12 months and the total
  assert.deepEqual(months.rows[0], ["November 2026", 1480 + 55.08, 1480 + 95 + 7.5 + 18.36]); // rent, broadcasting fee
  assert.deepEqual(months.rows[3], ["February 2027", 1480 + 55.08 + 90, 1480 + 95 + 7.5 + 18.36]); // and the yearly liability
  assert.equal(months.rows.at(-1)[1].f, "SUM(B2:B13)");
});

test("one person: no person column, formulas follow the columns, no debits by month without dates", () => {
  const sheets = budgetSheets(SINGLE, t, fmt, TODAY);
  assert.equal(sheets.length, 2);
  const [, costs] = sheets;
  assert.deepEqual(
    costs.columns.map((c) => c.header),
    ["Category", "Name", "Amount per payment", "Every … months", "Per month", "Per year"],
  );
  assert.equal(costs.rows[0][4].f, "C2/D2");
  assert.equal(costs.rows[0][5].f, "E2*12");
  assert.equal(costs.rows.at(-1)[4].f, "SUM(E2:E5)");
});

test("the file is a zip with the parts of a workbook", async () => {
  const bytes = new Uint8Array(await buildXlsx(budgetSheets(BUDGET, t, fmt, TODAY), "€").arrayBuffer());
  const text = new TextDecoder().decode(bytes);
  assert.deepEqual([...bytes.slice(0, 4)], [0x50, 0x4b, 0x03, 0x04]);
  for (const part of ["[Content_Types].xml", "xl/workbook.xml", "xl/styles.xml", "xl/worksheets/sheet1.xml", "xl/worksheets/sheet2.xml"])
    assert.ok(text.includes(part), part);
  assert.ok(text.includes("<f>SUM(G2:G5)</f>"));
  assert.ok(text.includes("xl/worksheets/sheet3.xml"));
  assert.ok(text.includes('<sheet name="Fixed costs"'));
});
