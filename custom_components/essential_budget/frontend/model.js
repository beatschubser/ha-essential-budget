/* The calculation: everything the view shows is derived here from the saved budget. */

export const PERSONS = ["a", "b"];
export const PERSON_COLORS = { a: "#2f6fde", b: "#d9822b" }; // defaults; persons can get own colors while editing
export const JOINT_COLOR = "#7a8794"; // joint income belongs to no single person
// Category colors, assigned in alphabetical order of the category names
const PALETTE = ["#2f6fde", "#7c5cd6", "#d9822b", "#1f8f74", "#b0436e", "#0e7c99", "#8a6d1f", "#a23b3b", "#4b8b2f", "#5f6b78"];

export const sum = (values) => values.reduce((total, value) => total + value, 0);

/** Share in whole percent, 0 if there is no whole. */
export const pct = (part, whole) => (whole > 0 ? Math.round((part / whole) * 100) : 0);

/** A fixed cost per month: its amount is paid every interval_months months. */
export const monthly = (cost) => cost.amount / cost.interval_months;

/** ["a"] for one person, ["a", "b"] when the second person has a name. */
export const activePersons = (persons) => PERSONS.filter((p) => p === "a" || String(persons?.[p] || "").trim());

/** Color of a person: own color or the default. */
export const personColor = (colors, p) => colors?.[p] || PERSON_COLORS[p];

/** Name of a person, "Person 2" while it has none. */
export const personLabel = (persons, p, t) => String(persons?.[p] || "").trim() || t("person_n", { n: PERSONS.indexOf(p) + 1 });

/** Name of a category, "No category" for the empty one. */
export const categoryLabel = (category, t) => category || t("no_category");

const byName = (a, b) => a.localeCompare(b);

export const buildModel = (data) => {
  const active = activePersons(data.persons);
  const costs = data.fixed_costs.map((cost) => ({ ...cost, monthly: monthly(cost) }));

  const people = active.map((p) => {
    const items = data.income.filter((i) => i.person === p);
    // annual gross = 12 × monthly gross of the income + gross of the special payments
    const grossItems = [
      ...items.filter((i) => i.gross != null).map((i) => ({ name: i.name, value: i.gross * 12, monthly: i.gross })),
      ...data.special_payments.filter((i) => i.person === p).map((i) => ({ name: i.name, value: i.gross })),
    ];
    const net = sum(items.map((i) => i.amount));
    const joint = sum(data.shared_income.filter((i) => i.to === p).map((i) => i.amount));
    const cost = sum(costs.filter((c) => c.person === p).map((c) => c.monthly));
    return {
      key: p,
      name: data.persons[p],
      color: personColor(data.colors, p),
      items,
      sum: net,
      grossItems,
      gross: sum(grossItems.map((i) => i.value)),
      // what is left on the account of this person: own and received joint income minus the costs it pays
      budget: net + joint - cost,
    };
  });
  const sharedSum = sum(data.shared_income.map((i) => i.amount));
  const incomeTotal = sum(people.map((p) => p.sum)) + sharedSum;

  const costTotal = sum(costs.map((c) => c.monthly));
  const groups = [...new Set(costs.map((c) => c.category))]
    .sort(byName)
    .map((category, i) => {
      const items = costs.filter((c) => c.category === category).sort((a, b) => b.monthly - a.monthly);
      return { category, color: PALETTE[i % PALETTE.length], items, sum: sum(items.map((c) => c.monthly)) };
    })
    .sort((a, b) => b.sum - a.sum);

  return {
    people,
    shared: data.shared_income,
    sharedSum,
    incomeTotal,
    grossTotal: sum(people.map((p) => p.gross)),
    groups,
    costTotal,
    budget: incomeTotal - costTotal,
    single: active.length === 1,
    empty: !data.income.length && !data.special_payments.length && !data.shared_income.length && !data.fixed_costs.length,
  };
};

/* ---------- Debits: when the fixed costs are taken from the accounts ---------- */

export const MONTH_END = 31; // due_day 31 = the last day of every month

const monthIndex = (year, month) => year * 12 + month - 1;

/**
 * Is a fixed cost debited in this month (1 = January)? Monthly costs need a day, the others also the month
 * of a debit; further debits follow the interval, counted within each year from that month
 * (exact for intervals that fit into a year: 1, 2, 3, 4, 6 and 12 months).
 */
export const isDueIn = (cost, year, month) => {
  if (!cost.due_day) return false;
  const n = cost.interval_months;
  if (n === 1) return true;
  if (!cost.due_month) return false;
  const diff = monthIndex(year, month) - monthIndex(year, cost.due_month);
  return ((diff % n) + n) % n === 0;
};

/** Months (1..12) with a debit, or null while the fixed cost has no (complete) debit date. */
export const dueMonths = (cost) => {
  if (!cost.due_day || (cost.interval_months !== 1 && !cost.due_month)) return null;
  return [...Array(12)].map((_, i) => i + 1).filter((month) => isDueIn(cost, 2000, month));
};

/** The day of the debit in a month (31 and days a month does not have = its last day). */
const dueDate = (cost, year, month) => new Date(year, month - 1, Math.min(cost.due_day, new Date(year, month, 0).getDate()));

/**
 * Debits of the next 12 months, starting with the month of today:
 * { months: [{ year, month, total, items: [{ cost, date }] }], upcoming: [{ cost, date }] (the next `days` days),
 *   missing: fixed costs without debit date, any: at least one fixed cost has a date }.
 */
export const buildSchedule = (data, today = new Date(), days = 30) => {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + days);
  const dated = data.fixed_costs.filter((cost) => dueMonths(cost));
  const debitsIn = (year, month) =>
    dated
      .filter((cost) => isDueIn(cost, year, month))
      .map((cost) => ({ cost, date: dueDate(cost, year, month) }))
      .sort((a, b) => a.date - b.date || b.cost.amount - a.cost.amount);
  const months = [...Array(13)].map((_, i) => {
    const first = new Date(start.getFullYear(), start.getMonth() + i, 1);
    const year = first.getFullYear();
    const month = first.getMonth() + 1;
    const items = debitsIn(year, month);
    return { year, month, items, total: sum(items.map((d) => d.cost.amount)) };
  });
  // the 13th month only completes the upcoming days at the end of a month
  const upcoming = months.flatMap((m) => m.items).filter((d) => d.date >= start && d.date < end);
  return {
    days,
    months: months.slice(0, 12),
    upcoming,
    missing: data.fixed_costs.filter((cost) => !dueMonths(cost)),
    any: dated.length > 0,
  };
};
