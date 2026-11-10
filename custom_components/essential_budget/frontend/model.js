/* The calculation: everything the view shows is derived here from the saved budget. */

export const PERSONS = ["a", "b"];
export const PERSON_COLORS = { a: "#2f6fde", b: "#d9822b" }; // defaults; persons can get own colors on the edit page
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
