/* Example budget for the tests (invented names and amounts). */

export const BUDGET = {
  version: 1,
  persons: { a: "Alex", b: "Sam" },
  income: [
    { name: "Salary", person: "a", gross: 4800, amount: 3150 },
    { name: "Salary", person: "b", gross: 3200, amount: 2200 },
    { name: "Side job", person: "b", amount: 536 },
  ],
  special_payments: [{ name: "Christmas bonus", person: "a", gross: 3400 }],
  shared_income: [{ name: "Child benefit", to: "a", amount: 255 }],
  fixed_costs: [
    { name: "Rent", category: "Home", person: "a", amount: 1480, interval_months: 1, due_day: 1 },
    { name: "Power", category: "Home", person: "b", amount: 95, interval_months: 1 },
    { name: "Liability", category: "Insurance", person: "b", amount: 90, interval_months: 12, due_day: 31, due_month: 2 },
    { name: "Broadcasting fee", category: "", person: "a", amount: 55.08, interval_months: 3, due_day: 15, due_month: 2 },
  ],
};

export const SINGLE = {
  ...BUDGET,
  persons: { a: "Alex", b: "" },
  income: BUDGET.income.filter((i) => i.person === "a"),
  shared_income: [],
  fixed_costs: BUDGET.fixed_costs.map(({ due_day, due_month, ...c }) => ({ ...c, person: "a" })), // without debit dates
};

export const english = { locale: { language: "en" }, config: { currency: "EUR" } };
export const german = { locale: { language: "de" }, config: { currency: "EUR" } };
