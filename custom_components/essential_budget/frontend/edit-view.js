/*
 * The card while the budget is edited, as HTML. It looks like the view (view.js): the same boxes, lines and
 * columns, only the values are fields. Overview: persons, income (net in the monthly net, gross in the annual
 * gross), joint income, special payments and the categories; detail view of a category: its fixed costs.
 */

import { INTERVALS, LIST_COSTS, LIST_SHARED, costCategories, costsOfCategory, editPersons, isMonthlyRow, parseAmount } from "./draft.js";
import { esc, iconButton, numSpan, sectionHead } from "./html.js";
import { JOINT_COLOR, PERSONS, activePersons, categoryLabel, pct, personColor, personLabel } from "./model.js";
import { renderCategory } from "./view.js";

/*
 * ctx: the context of the view (see view.js) and { limits, model, state }
 * with limits = limits of the integration, model = buildModel of the draft,
 * state = { adding (second person just added), confirm ({ kind, key } waiting for a yes), saving, saveError }.
 * Every field has data-bind (how its input is handled, see editing.js) and where needed
 * data-list, data-id and data-field (the place of its value in the draft).
 */

const AMOUNT_ATTRS = 'inputmode="decimal" autocomplete="off"';
const maxLength = (limit) => (limit ? ` maxlength="${limit}"` : "");
const money = (ctx, value) => numSpan(ctx.fmt.money(value));
/** Parts that follow the typed values; they are updated while typing (see editing.js). */
const live = (html, tag = "span") => `<${tag} class="live" data-live>${html}</${tag}>`;

const rowAttrs = (list, row, name) => `data-bind="row" data-list="${list}" data-id="${row._id}" data-field="${name}"`;

const nameInput = (list, row, ctx) =>
  `<input class="in" type="text" placeholder="${esc(ctx.t("name"))}" aria-label="${esc(ctx.t("name"))}" ${rowAttrs(list, row, "name")} value="${esc(row.name)}"${maxLength(ctx.limits.name)}>`;

/** An amount: the currency sign follows the field like in the view ("1480 €"). */
const amountInput = (list, row, name, label, ctx, cls = "") =>
  `<span class="in money ${cls}"><input type="text" placeholder="0" aria-label="${esc(label)}" ${rowAttrs(list, row, name)} value="${esc(row[name])}" ${AMOUNT_ATTRS}><span class="cur" aria-hidden="true">${esc(ctx.fmt.symbol)}</span></span>`;

/** A person, looking like the person chip of the view. */
const personSelect = (list, row, name, label, draft, ctx) => {
  const options = PERSONS.map(
    (p) => `<option value="${p}" ${row[name] === p ? "selected" : ""}>${esc(personLabel(draft.persons, p, ctx.t))}</option>`,
  ).join("");
  const color = personColor(draft.colors, row[name]);
  return live(`<select class="in chip" style="--c:${color}" aria-label="${esc(label)}" ${rowAttrs(list, row, name)}>${options}</select>`);
};

/** Monthly, quarterly, yearly or "Other interval": then the select becomes a field "N months" with a small menu to go back. */
const intervalField = (row, ctx) => {
  const { t } = ctx;
  const place = `data-list="${LIST_COSTS}" data-id="${row._id}"`;
  const options =
    INTERVALS.map(
      (n) => `<option value="${n}" ${!row._custom && String(n) === String(row.interval_months) ? "selected" : ""}>${esc(t.freq(n))}</option>`,
    ).join("") + `<option value="custom" ${row._custom ? "selected" : ""}>${esc(t("freq_custom"))}</option>`;
  const select = (cls) => `<select class="${cls}" aria-label="${esc(t("frequency"))}" data-bind="interval-select" ${place}>${options}</select>`;
  if (!row._custom) return select("in");
  const width = Math.max(1, String(row.interval_months).length) + 0.4;
  return `<span class="in money interval"><input type="text" inputmode="numeric" autocomplete="off" maxlength="3" aria-label="${esc(t("interval_label"))}" data-bind="interval" ${place} data-field="interval_months" value="${esc(row.interval_months)}" style="width:${width}ch"><span class="unit-months" aria-hidden="true">${esc(t("months"))}</span><span class="freq-menu"><ha-icon icon="mdi:chevron-down"></ha-icon>${select("")}</span></span>`;
};

/** The day field is as wide as its text, so that the dot follows it ("15."). */
export const dayWidth = (text) => `${text ? String(text).length + 0.2 : 3.2}ch`;

/** Debit date: the day ("15."), and for fixed costs that are not paid monthly the month of a debit (the others follow the interval). */
const dueField = (row, ctx) => {
  const { t, fmt } = ctx;
  const day = `<span class="in money day"><input type="text" style="width:${dayWidth(row.due_day)}" inputmode="numeric" autocomplete="off" maxlength="2" placeholder="${esc(t("due_day"))}" aria-label="${esc(`${t("due")}: ${t("due_day")}`)}" ${rowAttrs(LIST_COSTS, row, "due_day")} value="${esc(row.due_day)}"><span class="cur" aria-hidden="true">.</span></span>`;
  const months = [...Array(12)]
    .map((_, i) => `<option value="${i + 1}" ${String(row.due_month) === String(i + 1) ? "selected" : ""}>${esc(fmt.month(i + 1))}</option>`)
    .join("");
  const month = isMonthlyRow(row)
    ? ""
    : `<select class="in" aria-label="${esc(`${t("due")}: ${t("due_month")}`)}" ${rowAttrs(LIST_COSTS, row, "due_month")}><option value="">${esc(t("due_month"))}</option>${months}</select>`;
  return `<span class="due">${day}${month}</span>`;
};

const removeButton = (list, row, ctx) =>
  iconButton({ action: "remove", icon: "mdi:close", label: ctx.t("remove"), cls: "tiny", data: { list, id: row._id } });

const addButton = (list, label, person = "") =>
  `<button class="add" data-action="add" data-list="${list}" ${person ? `data-person="${person}"` : ""}><ha-icon icon="mdi:plus"></ha-icon>${esc(label)}</button>`;

/** A question before deleting: the text and the buttons "Cancel" and "Delete". */
const confirmBox = (text, ctx) =>
  `<div class="confirm" role="alertdialog"><span class="grow">${esc(text)}</span>
    <button class="btn" data-action="confirm-no">${esc(ctx.t("abort"))}</button>
    <button class="btn danger" data-action="confirm-yes">${esc(ctx.t("delete"))}</button></div>`;

const confirming = (ctx, kind, key) => ctx.state.confirm?.kind === kind && ctx.state.confirm.key === key;

const dot = (color) => `<span class="dot" style="background:${color}"></span>`;

/** The head of a block like in the view: colored dot, name and sum (name = HTML, extra = buttons before the sum). */
const blockHead = (mark, name, value, extra = "") =>
  `<div class="block-head">${mark}<span class="grow">${name}</span>${extra}<span class="strong">${value}</span></div>`;

/** A line of a block like in the view: name at the left, amount at the right, then the remove button. */
const line = (row, fields) => `<div class="line eline" data-id="${row._id}">${fields.join("")}</div>`;

/* ---------- Monthly net: a block per person (color, name, net income) and the joint income ---------- */

const personBlock = (p, draft, ctx) => {
  const { t, model } = ctx;
  const person = model.people.find((x) => x.key === p);
  const color = personColor(draft.colors, p);
  // the dot is the color field
  const colorDot = `<label class="dot color-dot" title="${esc(t("color"))}" style="background:${esc(color)}"><input type="color" data-bind="person-color" data-person="${p}" value="${esc(color)}" aria-label="${esc(t("color"))}"></label>`;
  const name = `<input class="in" type="text" data-bind="person-name" data-person="${p}" value="${esc(draft.persons[p])}" placeholder="${esc(t(p === "a" ? "person_name" : "name_optional"))}" aria-label="${esc(t("person_name"))}"${maxLength(ctx.limits.person_name)}>`;
  const reset = draft.colors[p]
    ? iconButton({ action: "resetcolor", icon: "mdi:restore", label: t("reset_color"), cls: "tiny", data: { key: p } })
    : "";
  const remove = p === "b" ? iconButton({ action: "removeperson", icon: "mdi:account-remove-outline", label: t("remove_person"), cls: "tiny" }) : "";
  const question = confirming(ctx, "person", p)
    ? confirmBox(t("remove_person_confirm", { name: personLabel(draft.persons, "b", t), other: personLabel(draft.persons, "a", t) }), ctx)
    : "";
  const lines = draft.income
    .filter((r) => r.person === p)
    .map((r) => line(r, [nameInput("income", r, ctx), amountInput("income", r, "amount", t("net_month"), ctx), removeButton("income", r, ctx)]))
    .join("");
  return `<div class="block">${blockHead(colorDot, name, live(money(ctx, person?.sum || 0)), reset + remove)}${question}${lines}
    ${addButton("income", t("add_income"), p)}</div>`;
};

/** Joint income: received on the account of one person. */
const sharedBlock = (draft, ctx) => {
  const { t, model } = ctx;
  const single = activePersons(draft.persons).length === 1;
  const lines = draft.shared_income
    .map((r) =>
      line(r, [
        nameInput(LIST_SHARED, r, ctx),
        single ? "" : personSelect(LIST_SHARED, r, "to", t("received_by"), draft, ctx),
        amountInput(LIST_SHARED, r, "amount", t("amount"), ctx),
        removeButton(LIST_SHARED, r, ctx),
      ]),
    )
    .join("");
  return `<div class="block">${blockHead(dot(JOINT_COLOR), esc(t("shared")), live(money(ctx, model.sharedSum)))}${lines}
    ${addButton(LIST_SHARED, t("add_shared"))}</div>`;
};

const monthlyNetBox = (draft, ctx) => {
  const { t, state } = ctx;
  const persons = editPersons(draft, state.adding);
  const addPerson =
    persons.length === 1
      ? `<button class="add" data-action="addperson"><ha-icon icon="mdi:account-plus-outline"></ha-icon>${esc(t("add_person"))}</button>`
      : "";
  return `<div class="box editing">${sectionHead("mdi:cash-plus", t("monthly_net"))}
    <div class="blocks">${persons.map((p) => personBlock(p, draft, ctx)).join("")}${sharedBlock(draft, ctx)}</div>${addPerson}</div>`;
};

/* ---------- Annual gross: "Salary (12 × gross)" for every income, and the special payments ---------- */

const annualGrossBox = (draft, ctx) => {
  const { t, model, state } = ctx;
  const blocks = editPersons(draft, state.adding).map((p) => {
    const person = model.people.find((x) => x.key === p);
    // the name of an income is edited in the monthly net, its monthly gross here
    const salaries = draft.income
      .filter((r) => r.person === p)
      .map((r) =>
        line(r, [
          `<span class="ellipsis">${live(esc(r.name))} <span class="small">(12 ×</span></span>`,
          amountInput("income", r, "gross", t("gross_month"), ctx, "gross small"),
          `<span class="small grow">)</span>`,
          `<span class="calc">${live(money(ctx, (parseAmount(r.gross) ?? 0) * 12))}</span>`,
        ]),
      )
      .join("");
    const specials = draft.special_payments
      .filter((r) => r.person === p)
      .map((r) =>
        line(r, [
          nameInput("special_payments", r, ctx),
          amountInput("special_payments", r, "gross", t("gross"), ctx),
          removeButton("special_payments", r, ctx),
        ]),
      )
      .join("");
    const head = blockHead(dot(personColor(draft.colors, p)), live(esc(personLabel(draft.persons, p, t))), live(money(ctx, person?.gross || 0)));
    return `<div class="block">${head}${salaries}${specials}${addButton("special_payments", t("add_special"), p)}</div>`;
  });
  return `<div class="box editing">${sectionHead("mdi:calendar-range", t("annual_gross"), live(money(ctx, model.grossTotal)), t("special_hint"))}
    <div class="blocks">${blocks.join("")}</div></div>`;
};

/* ---------- Fixed costs: the categories like in the view (tap = edit), with a delete button ---------- */

const fixedCostsBox = (draft, ctx) => {
  const { t, model } = ctx;
  const maxGroup = Math.max(...model.groups.map((g) => g.sum), 0);
  // in the order of the view (by size), new categories without amounts at the end
  const order = model.groups.map((g) => g.category.trim());
  const categories = costCategories(draft).sort((a, b) => (order.indexOf(a) + 1 || 1e9) - (order.indexOf(b) + 1 || 1e9));
  const rows = categories.map((category) => {
    const group = model.groups.find((g) => g.category.trim() === category) || { color: JOINT_COLOR, items: [], sum: 0 };
    const remove = iconButton({ action: "deletecategory", icon: "mdi:delete-outline", label: t("delete_category"), data: { key: category } });
    const question = confirming(ctx, "category", category)
      ? confirmBox(t("delete_category_confirm", { c: categoryLabel(category, t), n: costsOfCategory(draft, category).length }), ctx)
      : "";
    return renderCategory({ ...group, category, items: [] }, model, maxGroup, ctx, remove) + question;
  });
  return `<div class="box editing">${sectionHead("mdi:receipt-text-outline", t("fixed_costs"))}${rows.join("")}
    <button class="add" data-action="newcategory"><ha-icon icon="mdi:plus"></ha-icon>${esc(t("new_category"))}</button></div>`;
};

/** The overview while editing: key figures (kpis = their HTML), then the boxes. */
export const renderEditOverview = (draft, kpis, ctx) => {
  const left = monthlyNetBox(draft, ctx) + annualGrossBox(draft, ctx);
  return `${live(kpis, "div")}<div class="columns"><div class="column">${left}</div><div class="column costs">${fixedCostsBox(draft, ctx)}</div></div>${footer(ctx)}`;
};

/* ---------- A category: its name, its sums and its fixed costs as a table like in the view ---------- */

/** The monthly value of a draft row (0 while its amount cannot be read). */
const monthlyOf = (row) => (parseAmount(row.amount) ?? 0) / (Number(row.interval_months) || 1);

export const renderEditCategory = (draft, category, ctx) => {
  const { t, model } = ctx;
  const single = activePersons(draft.persons).length === 1;
  const rows = costsOfCategory(draft, category);
  const group = model.groups.find((g) => g.category.trim() === category);
  const total = group?.sum || 0;
  const name = `<input class="in title" type="text" data-bind="category-name" data-key="${esc(category)}" value="${esc(category)}" placeholder="${esc(t("no_category"))}" aria-label="${esc(t("rename_category"))}"${maxLength(ctx.limits.category)}>`;
  const question = confirming(ctx, "category", category)
    ? confirmBox(t("delete_category_confirm", { c: categoryLabel(category, t), n: rows.length }), ctx)
    : "";
  const tile = (label, value) => `<div class="box kpi small"><span class="label">${esc(label)}</span><span class="value">${live(value)}</span></div>`;
  const head = ["name:item", "person:person", "freq:frequency", "due:due", "paid:per_payment", "month:per_month", "year:per_year"]
    .map((pair) => pair.split(":"))
    .map(([cls, key]) => `<span class="d-${cls}">${esc(t(key))}</span>`)
    .join("");
  const lines = rows
    .map(
      (r) => `<div class="drow" data-id="${r._id}">
        <span class="d-name strong">${nameInput(LIST_COSTS, r, ctx)}</span>
        <span class="d-person">${single ? "" : personSelect(LIST_COSTS, r, "person", t("paid_by"), draft, ctx)}</span>
        <span class="d-freq">${intervalField(r, ctx)}</span>
        <span class="d-due">${dueField(r, ctx)}</span>
        <span class="d-paid">${amountInput(LIST_COSTS, r, "amount", t("per_payment"), ctx)}</span>
        <span class="d-month strong">${live(money(ctx, monthlyOf(r)))}</span>
        <span class="d-year">${live(money(ctx, monthlyOf(r) * 12))}</span>
        <span class="d-remove">${removeButton(LIST_COSTS, r, ctx)}</span>
      </div>`,
    )
    .join("");
  return `<div class="detail-head">
      ${iconButton({ action: "back", icon: "mdi:arrow-left", label: t("back"), cls: "round" })}
      <span class="dot square" style="background:${group?.color || JOINT_COLOR}"></span>
      <span class="grow">${name}</span>
      ${iconButton({ action: "deletecategory", icon: "mdi:delete-outline", label: t("delete_category"), data: { key: category } })}
    </div>${question}
    <div class="kpis detail">${tile(t("per_month"), money(ctx, total))}${tile(t("per_year"), money(ctx, total * 12))}${tile(t("share"), numSpan(`${pct(total, model.costTotal)} %`))}</div>
    <div class="box table edit ${single ? "single" : ""}">
      <div class="drow dhead">${head}</div>
      ${lines}
      <div class="drow dsum"><span class="d-name">${esc(t("sum"))}</span><span class="d-month">${live(money(ctx, total))}</span><span class="d-year">${live(money(ctx, total * 12))}</span></div>
      ${addButton(LIST_COSTS, t("add_cost"))}
    </div>${footer(ctx)}`;
};

/* ---------- Footer: stays at the bottom while editing ---------- */

const footer = (ctx) => {
  const { t, state } = ctx;
  const disabled = state.saving ? "disabled" : "";
  return `<div class="box footer">
    <div class="save-error" ${state.saveError ? "" : "hidden"}>${esc(state.saveError || "")}</div>
    <button class="btn" data-action="cancel" ${disabled}>${esc(t("cancel"))}</button>
    <button class="btn primary" data-action="save" ${disabled}>${esc(t(state.saving ? "saving" : "save"))}</button>
  </div>`;
};
