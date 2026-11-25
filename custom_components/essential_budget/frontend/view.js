/* The view of the card as HTML: header, overview, the detail view of a category and the debits by month. Pure functions of the model. */

import { dueText } from "./format.js";
import { esc, iconButton, numSpan, sectionHead } from "./html.js";
import { JOINT_COLOR, categoryLabel, pct } from "./model.js";

/*
 * ctx (what the functions need besides the model):
 * { t, fmt, title, isAdmin, numbersShown, open, hasSchedule, upcoming, month }
 * with t = translator, fmt = formatter, open = Set of expanded categories, hasSchedule = a fixed cost has a debit date,
 * upcoming = { days, items } for the box "Next debits" of the overview (null = no box), month = month chosen in the debits by month
 */

const money = (ctx, value) => numSpan(ctx.fmt.money(value));
const percent = (part, whole) => numSpan(`${pct(part, whole)} %`);
const barWidth = (value, max) => (max ? (value / max) * 100 : 0);

/** Title (optional) and the buttons: show/hide numbers at the left, debits by month, Excel download and (admins) the edit page at the right. */
export const renderHeader = (ctx, buttons = true) => {
  const { t, title, isAdmin, numbersShown } = ctx;
  const heading = title ? `<h1 class="title">${esc(title)}</h1>` : "";
  if (!buttons) return heading ? `<div class="header">${heading}</div>` : "";
  const eye = iconButton({
    action: "reveal",
    icon: numbersShown ? "mdi:eye-off-outline" : "mdi:eye-outline",
    label: t(numbersShown ? "hide_numbers" : "show_numbers"),
    cls: "eye",
    attrs: `aria-pressed="${!numbersShown}"`,
  });
  const actions =
    (ctx.hasSchedule ? iconButton({ action: "schedule", icon: "mdi:calendar-month-outline", label: t("show_schedule") }) : "") +
    iconButton({ action: "export", icon: "mdi:microsoft-excel", label: t("export") }) +
    (isAdmin ? iconButton({ action: "openedit", icon: "mdi:cog-outline", label: t("edit_title") }) : "");
  return `<div class="header">${eye}${heading}<div class="actions">${actions}</div></div>`;
};

const renderEmpty = (ctx) => {
  const { t, isAdmin } = ctx;
  const edit = isAdmin ? `<button class="add" data-action="openedit"><ha-icon icon="mdi:pencil"></ha-icon>${esc(t("edit_title"))}</button>` : "";
  return `${renderHeader(ctx, false)}<div class="box msg">${esc(t("empty"))}${edit}</div>`;
};

const renderKeyFigures = (m, ctx) => {
  const { t } = ctx;
  const share = esc(t("of_income", { p: "\u0000" })).replace("\u0000", percent(m.costTotal, m.incomeTotal));
  const figure = (cls, label, value, sub) =>
    `<div class="box kpi ${cls}"><span class="label">${esc(label)}</span><span class="value">${money(ctx, value)}</span><span class="sub">${sub}</span></div>`;
  return `<div class="kpis">
    ${figure("", t("monthly_net"), m.incomeTotal, esc(t("all_income")))}
    ${figure("", t("fixed_costs"), m.costTotal, share)}
    ${figure(`main ${m.budget < 0 ? "negative" : "positive"}`, t("free_budget"), m.budget, esc(t("after_costs")))}
  </div>`;
};

/** A block inside a box: colored dot, name, sum and its lines. */
const block = (ctx, name, color, value, lines) =>
  `<div class="block"><div class="block-head"><span class="dot" style="background:${color}"></span><span class="grow">${esc(name)}</span><span class="strong">${money(ctx, value)}</span></div>${lines}</div>`;

const line = (ctx, label, value) => `<div class="line"><span class="ellipsis">${label}</span><span>${money(ctx, value)}</span></div>`;

const renderMonthlyNet = (m, ctx) => {
  const { t } = ctx;
  const lines = (items) => items.map((i) => line(ctx, esc(i.name), i.amount)).join("");
  return `<div class="box">${sectionHead("mdi:cash-plus", t("monthly_net"))}
    <div class="blocks">${m.people.map((p) => block(ctx, p.name, p.color, p.sum, lines(p.items))).join("")}
    ${m.shared.length ? block(ctx, t("shared"), JOINT_COLOR, m.sharedSum, lines(m.shared)) : ""}</div></div>`;
};

/** Annual gross per person: 12 × monthly gross of the income ("Salary (12 × 4,800 €)") and the special payments. */
const renderAnnualGross = (m, ctx) => {
  const people = m.people.filter((p) => p.grossItems.length);
  if (!people.length) return "";
  const lines = (p) =>
    p.grossItems
      .map((i) => line(ctx, esc(i.name) + (i.monthly != null ? ` <span class="small">(12 × ${money(ctx, i.monthly)})</span>` : ""), i.value))
      .join("");
  return `<div class="box">${sectionHead("mdi:calendar-range", ctx.t("annual_gross"), money(ctx, m.grossTotal))}
    <div class="blocks">${people.map((p) => block(ctx, p.name, p.color, p.gross, lines(p))).join("")}</div></div>`;
};

/** With one person the budget per person equals the budget: no extra box. */
const renderBudgetPerPerson = (m, ctx) => {
  if (m.single) return "";
  const rows = m.people
    .map(
      (p) =>
        `<div class="row"><span class="strong" style="color:${p.color}">${esc(p.name)}</span><span class="strong ${p.budget < 0 ? "negative" : ""}">${money(ctx, p.budget)}</span></div>`,
    )
    .join("");
  return `<div class="box">${sectionHead("mdi:wallet-outline", ctx.t("free_budget_per_person"))}${rows}</div>`;
};

const renderCategory = (g, m, maxGroup, ctx) => {
  const { t, open } = ctx;
  const name = categoryLabel(g.category, t);
  const expandable = g.items.length > 1; // a single item needs no expanding
  const expanded = expandable && open.has(g.category);
  const maxItem = Math.max(...g.items.map((c) => c.monthly), 0);
  const items = expanded
    ? `<div class="items">${g.items
        .map(
          (c) => `<div class="item"><div class="item-main"><span class="ellipsis" title="${esc(c.name)}">${esc(c.name)}</span>
            <span class="bar thin"><i style="width:${barWidth(c.monthly, maxItem)}%;background:${g.color}"></i></span></div>
            <span class="item-value">${money(ctx, c.monthly)}</span></div>`,
        )
        .join("")}</div>`
    : "";
  const toggle = expandable
    ? iconButton({
        action: "toggle",
        icon: `mdi:chevron-${expanded ? "down" : "right"}`,
        label: t(expanded ? "collapse" : "expand", { c: name }),
        data: { key: g.category },
        attrs: `aria-expanded="${expanded}"`,
      })
    : `<span class="toggle-space"></span>`;
  return `<div class="cat">
    <div class="cat-row">
      ${toggle}
      <button class="cat-btn" data-action="detail" data-key="${esc(g.category)}" aria-label="${esc(t("open_details", { c: name }))}">
        <span class="cat-main"><span class="ellipsis strong">${esc(name)}</span><span class="bar"><i style="width:${barWidth(g.sum, maxGroup)}%;background:${g.color}"></i></span></span>
        <span class="cat-share">${percent(g.sum, m.costTotal)}</span>
        <span class="cat-value">${money(ctx, g.sum)}</span>
        <ha-icon class="muted" icon="mdi:chevron-right"></ha-icon>
      </button>
    </div>${items}</div>`;
};

const renderFixedCosts = (m, ctx) => {
  const maxGroup = Math.max(...m.groups.map((g) => g.sum), 0);
  return `<div class="box">${sectionHead("mdi:receipt-text-outline", ctx.t("fixed_costs"))}
    ${m.groups.map((g) => renderCategory(g, m, maxGroup, ctx)).join("")}</div>`;
};

/** The overview. Wide: income, annual gross and budget per person at the left, fixed costs at the right. */
export const renderView = (m, ctx) => {
  if (m.empty) return renderEmpty(ctx);
  const left = renderMonthlyNet(m, ctx) + renderAnnualGross(m, ctx) + renderBudgetPerPerson(m, ctx);
  const right = renderFixedCosts(m, ctx) + renderUpcoming(m, ctx);
  return `${renderHeader(ctx)}${renderKeyFigures(m, ctx)}<div class="columns"><div class="column">${left}</div><div class="column costs">${right}</div></div>`;
};

/** The detail view of one category: its sums and a table of its fixed costs (a list on narrow cards). */
export const renderDetail = (m, g, ctx) => {
  const { t } = ctx;
  const tile = (label, value) => `<div class="box kpi small"><span class="label">${esc(label)}</span><span class="value">${value}</span></div>`;
  const rows = g.items
    .map((c) => {
      const person = m.people.find((p) => p.key === c.person);
      const freq = esc(t.freq(c.interval_months));
      const due = esc(dueText(c, t, ctx.fmt));
      return `<div class="drow ${due ? "" : "no-due"}">
        <span class="d-name strong">${esc(c.name)}</span>
        <span class="d-person"><span class="chip" style="--c:${person?.color}">${esc(person?.name)}</span></span>
        <span class="d-freq">${freq}</span>
        <span class="d-due">${due ? `<span class="narrow-only">${esc(t("due"))}: </span>${due}` : ""}</span>
        <span class="d-paid"><span class="narrow-only">${money(ctx, c.amount)} ${freq}</span><span class="wide-only">${money(ctx, c.amount)}</span></span>
        <span class="d-month strong">${money(ctx, c.monthly)}<span class="narrow-only muted small"> ${esc(t("per_month"))}</span></span>
        <span class="d-year">${money(ctx, c.monthly * 12)}<span class="narrow-only"> ${esc(t("per_year"))}</span></span>
      </div>`;
    })
    .join("");
  const head = ["name:item", "person:person", "freq:frequency", "due:due", "paid:per_payment", "month:per_month", "year:per_year"]
    .map((pair) => pair.split(":"))
    .map(([cls, key]) => `<span class="d-${cls}">${esc(t(key))}</span>`)
    .join("");
  return `<div class="detail-head">
      ${iconButton({ action: "back", icon: "mdi:arrow-left", label: t("back"), cls: "round" })}
      <span class="dot square" style="background:${g.color}"></span><h1 class="title grow">${esc(categoryLabel(g.category, t))}</h1>
    </div>
    <div class="kpis detail">${tile(t("per_month"), money(ctx, g.sum))}${tile(t("per_year"), money(ctx, g.sum * 12))}${tile(t("share"), percent(g.sum, m.costTotal))}</div>
    <div class="box table ${m.single ? "single" : ""}">
      <div class="drow dhead">${head}</div>
      ${rows}
      <div class="drow dsum"><span class="d-name">${esc(t("sum"))}</span><span class="d-month">${money(ctx, g.sum)}</span><span class="d-year">${money(ctx, g.sum * 12)}</span></div>
    </div>`;
};

/* ---------- Debits by month ---------- */

/** A bar per month (tap = its debits below). */
const renderMonthBars = (s, m, ctx) => {
  const { t, fmt } = ctx;
  const max = Math.max(...s.months.map((month) => month.total), 1);
  const bars = s.months
    .map((month, i) => {
      const label = `${fmt.monthYear(month.year, month.month)}: ${fmt.money(month.total)}`;
      const cls = `${i === 0 ? "now" : ""} ${i === ctx.month ? "selected" : ""}`;
      return `<button class="mbar ${cls}" data-action="month" data-key="${i}" aria-pressed="${i === ctx.month}" aria-label="${esc(label)}" title="${esc(label)}">
        <span class="mbar-value">${money(ctx, month.total)}</span>
        <span class="mbar-track"><i style="height:${(month.total / max) * 100}%"></i></span>
        <span class="mbar-label">${esc(fmt.month(month.month))}</span>
      </button>`;
    })
    .join("");
  return `<div class="box">${sectionHead("mdi:chart-bar", t("show_schedule"))}<div class="months">${bars}</div></div>`;
};

/** A row per debit: date, name, category (and person), amount. */
const debitRows = (items, m, ctx) => {
  const { t, fmt } = ctx;
  if (!items.length) return `<div class="msg">${esc(t("no_debits"))}</div>`;
  const color = Object.fromEntries(m.groups.map((g) => [g.category, g.color]));
  const person = Object.fromEntries(m.people.map((p) => [p.key, p]));
  return items
    .map(
      ({ cost, date }) => `<div class="debit">
        <span class="debit-date">${esc(fmt.date(date))}</span>
        <span class="debit-main"><span class="ellipsis strong">${esc(cost.name)}</span>
          <span class="debit-sub"><span class="dot" style="background:${color[cost.category]}"></span><span class="ellipsis">${esc(categoryLabel(cost.category, t))}</span>${
            m.single ? "" : `<span class="chip" style="--c:${person[cost.person]?.color}">${esc(person[cost.person]?.name)}</span>`
          }</span></span>
        <span class="debit-value strong">${money(ctx, cost.amount)}</span>
      </div>`,
    )
    .join("");
};

const debitsTotal = (ctx, items) =>
  money(
    ctx,
    items.reduce((total, d) => total + d.cost.amount, 0),
  );

/** The debits of the chosen month, or of the next days. */
const renderDebits = (s, m, ctx) => {
  const { t, fmt } = ctx;
  const month = ctx.month === null ? null : s.months[ctx.month];
  const items = month ? month.items : s.upcoming;
  const title = month ? fmt.monthYear(month.year, month.month) : t("next_days", { n: s.days });
  return `<div class="box">${sectionHead("mdi:calendar-arrow-right", title, debitsTotal(ctx, items))}${debitRows(items, m, ctx)}</div>`;
};

/** Overview: the debits of the next days below the fixed costs; the button opens the debits by month. */
const renderUpcoming = (m, ctx) => {
  const { t, upcoming } = ctx;
  if (!upcoming) return "";
  const all = `<button class="add" data-action="schedule"><ha-icon icon="mdi:calendar-month-outline"></ha-icon>${esc(t("show_schedule"))}</button>`;
  return `<div class="box">${sectionHead("mdi:calendar-arrow-right", t("upcoming"), debitsTotal(ctx, upcoming.items))}
    ${debitRows(upcoming.items, m, ctx)}${all}</div>`;
};

/** The debits by month: key figures, a bar per month for the next 12 months and the list of debits. */
export const renderSchedule = (m, s, ctx) => {
  const { t, fmt } = ctx;
  const tile = (label, value, sub = "") =>
    `<div class="box kpi small"><span class="label">${esc(label)}</span><span class="value">${value}</span>${sub ? `<span class="sub">${esc(sub)}</span>` : ""}</div>`;
  const highest = s.months.reduce((a, b) => (b.total > a.total ? b : a));
  const missing = s.missing.length ? `<div class="hint flat">${esc(t("missing_due", { n: s.missing.length }))}</div>` : "";
  return `<div class="detail-head">
      ${iconButton({ action: "back", icon: "mdi:arrow-left", label: t("back"), cls: "round" })}
      <h1 class="title grow">${esc(t("schedule"))}</h1>
    </div>
    <div class="kpis detail">
      ${tile(t("this_month"), money(ctx, s.months[0].total), fmt.monthYear(s.months[0].year, s.months[0].month))}
      ${tile(t("highest_month"), money(ctx, highest.total), fmt.monthYear(highest.year, highest.month))}
      ${tile(t("average_month"), money(ctx, m.costTotal))}
    </div>
    ${renderMonthBars(s, m, ctx)}
    ${renderDebits(s, m, ctx)}
    ${missing}`;
};
