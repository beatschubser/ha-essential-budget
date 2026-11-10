/* Excel export: one sheet for the income, one for the fixed costs, with formulas for sums and derived values. */

import { activePersons, categoryLabel, monthly, personLabel, sum } from "./model.js";
import { buildXlsx, colName } from "./xlsx.js";

/*
 * A sheet from column definitions and records.
 * column: { key, header, width, money, value(record), formula(letters, row, record), total }
 *   formula returns an Excel formula for the cell (letters.key = column letter) or nothing for a plain value;
 *   total: the last row gets a SUM of the column.
 */
const sheet = (name, columns, records, totalLabel) => {
  const letters = Object.fromEntries(columns.map((column, i) => [column.key, colName(i)]));
  const rows = records.map((record, i) =>
    columns.map((column) => {
      const f = column.formula?.(letters, i + 2, record);
      return f ? { f, v: column.value(record) } : column.value(record);
    }),
  );
  const last = records.length + 1;
  const total = columns.map((column, i) => {
    if (i === 0) return totalLabel;
    if (!column.total) return null;
    return { f: `SUM(${letters[column.key]}2:${letters[column.key]}${last})`, v: sum(records.map((record) => column.value(record) || 0)) };
  });
  total.bold = true;
  return { name, columns: columns.map(({ header, width, money }) => ({ header, width, money })), rows: [...rows, total] };
};

/** The sheets of the export for a saved budget (t = translator). */
export const budgetSheets = (data, t) => {
  const person = (p) => personLabel(data.persons, p, t);
  const twoPersons = activePersons(data.persons).length > 1;
  const money = { width: 16, money: true, total: true };

  // income: monthly income (gross per year = 12 × gross), special payments (gross per year only), joint income (net only)
  const income = [
    ...data.income.map((i) => ({
      person: i.person,
      type: t("xl_income"),
      name: i.name,
      gross: i.gross ?? null,
      net: i.amount,
      monthlyGross: i.gross != null,
    })),
    ...data.special_payments.map((i) => ({ person: i.person, type: t("xl_special"), name: i.name, gross: null, net: null, grossYear: i.gross })),
    ...data.shared_income.map((i) => ({ person: i.to, type: t("xl_shared"), name: i.name, gross: null, net: i.amount })),
  ];
  const incomeColumns = [
    { key: "person", header: t("person"), width: 16, value: (r) => person(r.person) },
    { key: "type", header: t("xl_type"), width: 22, value: (r) => r.type },
    { key: "name", header: t("name"), width: 28, value: (r) => r.name },
    { key: "gross", header: t("gross_month"), ...money, value: (r) => r.gross },
    { key: "net", header: t("net_month"), ...money, value: (r) => r.net },
    {
      key: "grossYear",
      header: t("gross_year"),
      ...money,
      value: (r) => (r.monthlyGross ? r.gross * 12 : (r.grossYear ?? null)),
      formula: (col, row, r) => (r.monthlyGross ? `${col.gross}${row}*12` : null),
    },
  ];

  // fixed costs, sorted by category and name: per month = amount / interval, per year = per month × 12
  const costs = [...data.fixed_costs].sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
  const costColumns = [
    { key: "category", header: t("category"), width: 20, value: (c) => categoryLabel(c.category, t) },
    { key: "name", header: t("name"), width: 28, value: (c) => c.name },
    ...(twoPersons ? [{ key: "person", header: t("person"), width: 16, value: (c) => person(c.person) }] : []),
    { key: "amount", header: t("per_payment"), width: 16, money: true, value: (c) => c.amount },
    { key: "interval", header: t("every_months"), width: 14, value: (c) => c.interval_months },
    {
      key: "month",
      header: t("per_month_title"),
      ...money,
      value: (c) => monthly(c),
      formula: (col, row) => `${col.amount}${row}/${col.interval}${row}`,
    },
    { key: "year", header: t("per_year_title"), ...money, value: (c) => monthly(c) * 12, formula: (col, row) => `${col.month}${row}*12` },
  ];

  return [sheet(t("income"), incomeColumns, income, t("sum")), sheet(t("fixed_costs"), costColumns, costs, t("sum"))];
};

/** Downloads the budget as "Budget 2026-11-09.xlsx"; currencySymbol is used for the number format. */
export const downloadExcel = (data, t, currencySymbol) => {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(buildXlsx(budgetSheets(data, t), currencySymbol));
  link.download = `${t("xl_file")} ${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 10000);
};
