/*
 * The card while the budget is edited, as HTML: the overview with editable boxes (income, joint income, special
 * payments, categories) and the detail view of a category with its fixed costs. The key figures stay read-only.
 */

import { INTERVALS, LIST_COSTS, LIST_SHARED, costCategories, costsOfCategory, editPersons, isMonthlyRow } from "./draft.js";
import { esc, iconButton, numSpan, sectionHead } from "./html.js";
import { JOINT_COLOR, PERSONS, activePersons, categoryLabel, personColor, personLabel } from "./model.js";

/*
 * ctx: { t, fmt, limits, model, state }
 * with t = translator, fmt = formatter, limits = limits of the integration, model = buildModel of the draft,
 * state = { adding (second person just added), confirm ({ kind, key } waiting for a yes), saving, saveError }.
 * Every field has data-bind (how its input is handled, see editing.js) and where needed
 * data-list, data-id and data-field (the place of its value in the draft).
 */

const AMOUNT_ATTRS = 'inputmode="decimal" autocomplete="off"';
const maxLength = (limit) => (limit ? ` maxlength="${limit}"` : "");
const money = (ctx, value) => numSpan(ctx.fmt.money(value));
/** Parts that follow the typed values; they are updated while typing (see editing.js). */
const live = (html, tag = "span") => `<${tag} class="live" data-live>${html}</${tag}>`;

/** A field with a label that is only visible where the styles show it (else for screen readers). */
const field = (name, label, control) => `<label class="field f-${name}"><span class="sr">${esc(label)}</span>${control}</label>`;

const rowAttrs = (list, row, name) => `data-bind="row" data-list="${list}" data-id="${row._id}" data-field="${name}"`;

const nameInput = (list, row, ctx) =>
  field(
    "name",
    ctx.t("name"),
    `<input type="text" placeholder="${esc(ctx.t("name"))}" ${rowAttrs(list, row, "name")} value="${esc(row.name)}"${maxLength(ctx.limits.name)}>`,
  );

/** An amount: the currency sign is part of the field but not of its text. */
const amountInput = (list, row, name, label, ctx) =>
  field(
    name,
    label,
    `<span class="money"><input type="text" placeholder="${esc(label)}" ${rowAttrs(list, row, name)} value="${esc(row[name])}" ${AMOUNT_ATTRS}><span class="cur" aria-hidden="true">${esc(ctx.fmt.symbol)}</span></span>`,
  );

const personSelect = (list, row, name, label, draft, ctx) => {
  const options = PERSONS.map(
    (p) => `<option value="${p}" ${row[name] === p ? "selected" : ""}>${esc(personLabel(draft.persons, p, ctx.t))}</option>`,
  ).join("");
  return field(name, label, live(`<select ${rowAttrs(list, row, name)}>${options}</select>`));
};

/** Monthly, quarterly, yearly or "Other interval": then the select becomes a field "N months" with a small menu to go back. */
const intervalField = (row, ctx) => {
  const { t } = ctx;
  const place = `data-list="${LIST_COSTS}" data-id="${row._id}"`;
  const options =
    INTERVALS.map(
      (n) => `<option value="${n}" ${!row._custom && String(n) === String(row.interval_months) ? "selected" : ""}>${esc(t.freq(n))}</option>`,
    ).join("") + `<option value="custom" ${row._custom ? "selected" : ""}>${esc(t("freq_custom"))}</option>`;
  const select = (label) => `<select aria-label="${esc(label)}" data-bind="interval-select" ${place}>${options}</select>`;
  if (!row._custom) return `<div class="field f-freq">${select(t("frequency"))}</div>`;
  const width = Math.max(1, String(row.interval_months).length) + 0.4;
  return `<div class="field f-freq"><span class="money"><input type="text" inputmode="numeric" autocomplete="off" maxlength="3" aria-label="${esc(t("interval_label"))}" data-bind="interval" ${place} data-field="interval_months" value="${esc(row.interval_months)}" style="width:${width}ch"><span class="unit-months" aria-hidden="true">${esc(t("months"))}</span><span class="freq-menu"><ha-icon icon="mdi:chevron-down"></ha-icon>${select(t("frequency"))}</span></span></div>`;
};

/** Debit date: the day, and for fixed costs that are not paid monthly the month of a debit (the others follow the interval). */
const dueField = (row, ctx) => {
  const { t, fmt } = ctx;
  const day = `<input class="due-day" type="text" inputmode="numeric" autocomplete="off" maxlength="2" placeholder="${esc(t("due_day"))}" aria-label="${esc(`${t("due")}: ${t("due_day")}`)}" ${rowAttrs(LIST_COSTS, row, "due_day")} value="${esc(row.due_day)}">`;
  // the day reads like a date: "15."
  const dayField = `<span class="money due-day-frame">${day}<span class="cur" aria-hidden="true">.</span></span>`;
  const months = [...Array(12)]
    .map((_, i) => `<option value="${i + 1}" ${String(row.due_month) === String(i + 1) ? "selected" : ""}>${esc(fmt.month(i + 1))}</option>`)
    .join("");
  const month = isMonthlyRow(row)
    ? ""
    : `<select aria-label="${esc(`${t("due")}: ${t("due_month")}`)}" ${rowAttrs(LIST_COSTS, row, "due_month")}><option value="">${esc(t("due_month"))}</option>${months}</select>`;
  return `<div class="field f-due"><span class="label">${esc(t("due"))}</span><span class="due">${dayField}${month}</span></div>`;
};

const removeButton = (list, row, ctx) =>
  iconButton({ action: "remove", icon: "mdi:delete-outline", label: ctx.t("remove"), cls: "remove", data: { list, id: row._id } });

const addButton = (list, label, person = "") =>
  `<button class="add" data-action="add" data-list="${list}" ${person ? `data-person="${person}"` : ""}><ha-icon icon="mdi:plus"></ha-icon>${esc(label)}</button>`;

/** Column headers above the rows of a list, only shown on wide boxes (cols: [field, label]). */
const headRow = (cls, rows, cols) =>
  rows.length ? `<div class="erow ${cls} ehead">${cols.map(([name, label]) => `<span class="f-${name}">${esc(label)}</span>`).join("")}</div>` : "";

const row = (cls, r, fields) => `<div class="erow ${cls}" data-id="${r._id}">${fields.join("")}</div>`;

/** A question before deleting: the text and the buttons "Delete" and "Cancel". */
const confirmBox = (text, ctx) =>
  `<div class="confirm" role="alertdialog"><span class="grow">${esc(text)}</span>
    <button class="btn" data-action="confirm-no">${esc(ctx.t("abort"))}</button>
    <button class="btn danger" data-action="confirm-yes">${esc(ctx.t("delete"))}</button></div>`;

const confirming = (ctx, kind, key) => ctx.state.confirm?.kind === kind && ctx.state.confirm.key === key;

/* ---------- Monthly net: a block per person (name, color, income) and the joint income ---------- */

const personBlock = (p, draft, ctx) => {
  const { t } = ctx;
  const rows = draft.income.filter((r) => r.person === p);
  const color = `<input type="color" data-bind="person-color" data-person="${p}" value="${esc(personColor(draft.colors, p))}" title="${esc(t("color"))}" aria-label="${esc(t("color"))}">`;
  const name = `<input type="text" data-bind="person-name" data-person="${p}" value="${esc(draft.persons[p])}" placeholder="${esc(t(p === "a" ? "person_name" : "name_optional"))}" aria-label="${esc(t("person_name"))}"${maxLength(ctx.limits.person_name)}>`;
  // the reset button is only there while an own color is set
  const reset = draft.colors[p]
    ? iconButton({ action: "resetcolor", icon: "mdi:restore", label: t("reset_color"), cls: "small-btn", data: { key: p } })
    : "";
  const remove =
    p === "b" ? iconButton({ action: "removeperson", icon: "mdi:account-remove-outline", label: t("remove_person"), cls: "small-btn" }) : "";
  const question = confirming(ctx, "person", p)
    ? confirmBox(t("remove_person_confirm", { name: personLabel(draft.persons, "b", t), other: personLabel(draft.persons, "a", t) }), ctx)
    : "";
  return `<div class="block">
    <div class="person-head"><span class="field f-color">${color}</span><span class="field grow">${name}</span>${reset}${remove}</div>${question}
    ${headRow("income", rows, [
      ["name", t("name")],
      ["gross", t("gross_month")],
      ["amount", t("net_month")],
    ])}
    ${rows
      .map((r) =>
        row("income", r, [
          nameInput("income", r, ctx),
          amountInput("income", r, "gross", t("gross_month_short"), ctx),
          amountInput("income", r, "amount", t("net_month_short"), ctx),
          removeButton("income", r, ctx),
        ]),
      )
      .join("")}
    ${addButton("income", t("add_income"), p)}</div>`;
};

/** Joint income: received on the account of one person. */
const sharedBlock = (draft, ctx) => {
  const { t } = ctx;
  const single = activePersons(draft.persons).length === 1;
  const rows = draft.shared_income;
  const cls = `shared ${single ? "single" : ""}`;
  return `<div class="block">
    <div class="block-head"><span class="dot" style="background:${JOINT_COLOR}"></span><span class="grow">${esc(t("shared"))}</span></div>
    <div class="hint flat">${esc(t("shared_hint"))}</div>
    ${
      single
        ? ""
        : headRow(cls, rows, [
            ["name", t("name")],
            ["to", t("received_by")],
            ["amount", t("amount")],
          ])
    }
    ${rows
      .map((r) =>
        row(cls, r, [
          nameInput(LIST_SHARED, r, ctx),
          single ? "" : personSelect(LIST_SHARED, r, "to", t("received_by"), draft, ctx),
          amountInput(LIST_SHARED, r, "amount", t("amount"), ctx),
          removeButton(LIST_SHARED, r, ctx),
        ]),
      )
      .join("")}
    ${addButton(LIST_SHARED, t("add_shared"))}</div>`;
};

const monthlyNetBox = (draft, ctx) => {
  const { t, model, state } = ctx;
  const persons = editPersons(draft, state.adding);
  const addPerson =
    persons.length === 1
      ? `<button class="add" data-action="addperson"><ha-icon icon="mdi:account-plus-outline"></ha-icon>${esc(t("add_person"))}</button>`
      : "";
  return `<div class="box editing">${sectionHead("mdi:cash-plus", t("monthly_net"), live(money(ctx, model.incomeTotal)))}
    <div class="blocks">${persons.map((p) => personBlock(p, draft, ctx)).join("")}${sharedBlock(draft, ctx)}</div>${addPerson}</div>`;
};

/* ---------- Annual gross: salaries (12 × monthly gross, edited with the income) and special payments ---------- */

const annualGrossBox = (draft, ctx) => {
  const { t, model, state } = ctx;
  const blocks = editPersons(draft, state.adding).map((p) => {
    const person = model.people.find((x) => x.key === p);
    const salaries = (person?.grossItems || [])
      .filter((i) => i.monthly != null)
      .map(
        (i) =>
          `<div class="line"><span class="ellipsis">${esc(i.name)} <span class="small">(12 × ${money(ctx, i.monthly)})</span></span><span>${money(ctx, i.value)}</span></div>`,
      )
      .join("");
    const rows = draft.special_payments.filter((r) => r.person === p);
    return `<div class="block">
      <div class="block-head"><span class="dot" style="background:${personColor(draft.colors, p)}"></span><span class="grow">${live(esc(personLabel(draft.persons, p, t)))}</span><span class="strong">${live(money(ctx, person?.gross || 0))}</span></div>
      ${live(salaries, "div")}
      ${headRow("special", rows, [
        ["name", t("special_payments")],
        ["gross", t("gross")],
      ])}
      ${rows
        .map((r) =>
          row("special", r, [
            nameInput("special_payments", r, ctx),
            amountInput("special_payments", r, "gross", t("gross"), ctx),
            removeButton("special_payments", r, ctx),
          ]),
        )
        .join("")}
      ${addButton("special_payments", t("add_special"), p)}</div>`;
  });
  return `<div class="box editing">${sectionHead("mdi:calendar-range", t("annual_gross"), live(money(ctx, model.grossTotal)), t("special_hint"))}
    <div class="blocks">${blocks.join("")}</div></div>`;
};

/* ---------- Fixed costs: the categories (rename, delete, open to edit their entries) ---------- */

const categoryRow = (category, draft, ctx) => {
  const { t, model } = ctx;
  const group = model.groups.find((g) => g.category === category);
  const count = costsOfCategory(draft, category).length;
  const name = `<input type="text" data-bind="category-name" data-key="${esc(category)}" value="${esc(category)}" placeholder="${esc(t("no_category"))}" aria-label="${esc(t("rename_category"))}"${maxLength(ctx.limits.category)}>`;
  const question = confirming(ctx, "category", category)
    ? confirmBox(t("delete_category_confirm", { c: categoryLabel(category, t), n: count }), ctx)
    : "";
  return `<div class="ecat">
    <span class="dot" style="background:${group?.color || JOINT_COLOR}"></span>
    <span class="field">${name}</span>
    <span class="cat-value">${live(money(ctx, group?.sum || 0))}</span>
    ${iconButton({ action: "detail", icon: "mdi:pencil", label: t("edit_entries", { c: categoryLabel(category, t) }), data: { key: category } })}
    ${iconButton({ action: "deletecategory", icon: "mdi:delete-outline", label: t("delete_category"), data: { key: category } })}
  </div>${question}`;
};

const fixedCostsBox = (draft, ctx) => {
  const { t, model } = ctx;
  return `<div class="box editing">${sectionHead("mdi:receipt-text-outline", t("fixed_costs"), live(money(ctx, model.costTotal)))}
    ${costCategories(draft)
      .map((c) => categoryRow(c, draft, ctx))
      .join("")}
    <button class="add" data-action="newcategory"><ha-icon icon="mdi:plus"></ha-icon>${esc(t("new_category"))}</button></div>`;
};

/** The overview while editing: key figures (read-only, kpis = their HTML), then the editable boxes. */
export const renderEditOverview = (draft, kpis, ctx) => {
  const left = monthlyNetBox(draft, ctx) + annualGrossBox(draft, ctx);
  return `${live(kpis, "div")}<div class="columns"><div class="column">${left}</div><div class="column costs">${fixedCostsBox(draft, ctx)}</div></div>${footer(ctx)}`;
};

/* ---------- A category: its name and its fixed costs ---------- */

export const renderEditCategory = (draft, category, ctx) => {
  const { t, model } = ctx;
  const single = activePersons(draft.persons).length === 1;
  const rows = costsOfCategory(draft, category);
  const cls = `costs ${single ? "single" : ""}`;
  const group = model.groups.find((g) => g.category === category);
  const name = `<input class="title-input" type="text" data-bind="category-name" data-key="${esc(category)}" value="${esc(category)}" placeholder="${esc(t("no_category"))}" aria-label="${esc(t("rename_category"))}"${maxLength(ctx.limits.category)}>`;
  const question = confirming(ctx, "category", category)
    ? confirmBox(t("delete_category_confirm", { c: categoryLabel(category, t), n: rows.length }), ctx)
    : "";
  return `<div class="detail-head">
      ${iconButton({ action: "back", icon: "mdi:arrow-left", label: t("back"), cls: "round" })}
      <span class="dot square" style="background:${group?.color || JOINT_COLOR}"></span>
      <span class="field grow">${name}</span>
      ${iconButton({ action: "deletecategory", icon: "mdi:delete-outline", label: t("delete_category"), data: { key: category } })}
    </div>${question}
    <div class="box editing">${sectionHead("mdi:receipt-text-outline", t("fixed_costs"), live(money(ctx, group?.sum || 0)))}
      ${headRow(cls, rows, [
        ["name", t("name")],
        ["amount", t("amount")],
        ["freq", t("frequency")],
        ["due", t("due")],
        ...(single ? [] : [["person", t("paid_by")]]),
      ])}
      ${rows
        .map((r) =>
          row(cls, r, [
            nameInput(LIST_COSTS, r, ctx),
            amountInput(LIST_COSTS, r, "amount", t("amount"), ctx),
            intervalField(r, ctx),
            dueField(r, ctx),
            single ? "" : personSelect(LIST_COSTS, r, "person", t("paid_by"), draft, ctx),
            removeButton(LIST_COSTS, r, ctx),
          ]),
        )
        .join("")}
      ${addButton(LIST_COSTS, t("add_cost"))}</div>${footer(ctx)}`;
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
