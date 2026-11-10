/* The edit page as HTML: tabs per person, joint income and fixed costs (in category tabs), and the footer with the save button. */

import { TAB_COSTS, TAB_SHARED, costsOfCategory, INTERVALS } from "./draft.js";
import { esc, iconButton, sectionHead } from "./html.js";
import { PERSONS, activePersons, categoryLabel, personColor, personLabel } from "./model.js";

/*
 * ctx: { t, fmt, limits } with t = translator, fmt = formatter, limits = limits of the integration.
 * Every field has data-bind (how the editor handles its input, see editor.js) and where needed
 * data-list, data-id and data-field (the place of its value in the draft).
 */

const AMOUNT_ATTRS = 'inputmode="decimal" autocomplete="off"';
const maxLength = (limit) => (limit ? ` maxlength="${limit}"` : "");

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
  return field(name, label, `<select ${rowAttrs(list, row, name)}>${options}</select>`);
};

/** Monthly, quarterly, yearly or "Other interval": then the select becomes a field "N months" with a small menu to go back. */
const intervalField = (row, ctx) => {
  const { t } = ctx;
  const place = `data-list="${TAB_COSTS}" data-id="${row._id}"`;
  const options =
    INTERVALS.map(
      (n) => `<option value="${n}" ${!row._custom && String(n) === String(row.interval_months) ? "selected" : ""}>${esc(t.freq(n))}</option>`,
    ).join("") + `<option value="custom" ${row._custom ? "selected" : ""}>${esc(t("freq_custom"))}</option>`;
  const select = (label) => `<select aria-label="${esc(label)}" data-bind="interval-select" ${place}>${options}</select>`;
  if (!row._custom) return `<div class="field f-freq">${select(t("frequency"))}</div>`;
  const width = Math.max(1, String(row.interval_months).length) + 0.4;
  return `<div class="field f-freq"><span class="money"><input type="text" inputmode="numeric" autocomplete="off" maxlength="3" aria-label="${esc(t("interval_label"))}" data-bind="interval" ${place} data-field="interval_months" value="${esc(row.interval_months)}" style="width:${width}ch"><span class="months" aria-hidden="true">${esc(t("months"))}</span><span class="freq-menu"><ha-icon icon="mdi:chevron-down"></ha-icon>${select(t("frequency"))}</span></span></div>`;
};

const removeButton = (list, row, ctx) =>
  iconButton({ action: "remove", icon: "mdi:delete-outline", label: ctx.t("remove"), cls: "remove", data: { list, id: row._id } });

const addButton = (list, label, person = "") =>
  `<button class="add" data-action="add" data-list="${list}" ${person ? `data-person="${person}"` : ""}><ha-icon icon="mdi:plus"></ha-icon>${esc(label)}</button>`;

/** Column headers above the rows of a list, only shown on wide pages (cols: [field, label]). */
const headRow = (cls, rows, cols) =>
  rows.length ? `<div class="erow ${cls} ehead">${cols.map(([name, label]) => `<span class="f-${name}">${esc(label)}</span>`).join("")}</div>` : "";

const row = (cls, r, fields) => `<div class="erow ${cls}" data-id="${r._id}">${fields.join("")}</div>`;

/* ---------- A person: name, color, income and special payments ---------- */

const personNameBox = (p, draft, ctx) => {
  const { t } = ctx;
  // the reset button is only there while an own color is set
  const reset = draft.colors[p]
    ? iconButton({ action: "resetcolor", icon: "mdi:restore", label: t("reset_color"), cls: "small-btn", data: { key: p } })
    : "";
  const name = `<input type="text" data-bind="person-name" data-person="${p}" value="${esc(draft.persons[p])}" placeholder="${esc(t(p === "a" ? "person_name" : "name_optional"))}"${maxLength(ctx.limits.person_name)}>`;
  const color = `<input type="color" data-bind="person-color" data-person="${p}" value="${esc(personColor(draft.colors, p))}" title="${esc(t("color"))}">`;
  return `<div class="box">${sectionHead("mdi:account", t("person_name"))}
    <div class="name-row"><label class="field grow"><span class="sr">${esc(t("person_name"))}</span>${name}</label>${field("color", t("color"), color)}${reset}</div>
    ${p === "b" ? `<div class="hint flat">${esc(t("one_person_hint"))}</div>` : ""}</div>`;
};

const incomeBox = (p, draft, ctx) => {
  const { t } = ctx;
  const rows = draft.income.filter((r) => r.person === p);
  return `<div class="box">${sectionHead("mdi:cash-plus", t("income"))}
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

const specialPaymentsBox = (p, draft, ctx) => {
  const { t } = ctx;
  const rows = draft.special_payments.filter((r) => r.person === p);
  return `<div class="box">${sectionHead("mdi:gift-outline", t("special_payments"), "", t("special_hint"))}
    ${headRow("special", rows, [
      ["name", t("name")],
      ["gross", t("gross")],
    ])}
    ${rows.map((r) => row("special", r, [nameInput("special_payments", r, ctx), amountInput("special_payments", r, "gross", t("gross"), ctx), removeButton("special_payments", r, ctx)])).join("")}
    ${addButton("special_payments", t("add_special"), p)}</div>`;
};

const personSection = (p, draft, ctx) => personNameBox(p, draft, ctx) + incomeBox(p, draft, ctx) + specialPaymentsBox(p, draft, ctx);

/* ---------- Joint income: received on the account of one person ---------- */

const sharedSection = (draft, ctx) => {
  const { t } = ctx;
  const single = activePersons(draft.persons).length === 1;
  const list = TAB_SHARED;
  const rows = draft.shared_income;
  const cls = `shared ${single ? "single" : ""}`;
  return `<div class="box">${sectionHead("mdi:account-group-outline", t("shared_income"), "", t("shared_hint"))}
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
          nameInput(list, r, ctx),
          single ? "" : personSelect(list, r, "to", t("received_by"), draft, ctx),
          amountInput(list, r, "amount", t("amount"), ctx),
          removeButton(list, r, ctx),
        ]),
      )
      .join("")}
    ${addButton(list, t("add_shared"))}</div>`;
};

/* ---------- Fixed costs: one tab per category, a row belongs to the tab of its category ---------- */

const categoryTabs = (categories, state, ctx) => {
  const { t } = ctx;
  const tabs = categories
    .map((c) => {
      const active = c === state.category;
      return active && state.renaming
        ? `<input class="tab-rename" type="text" data-bind="category-name" value="${esc(c)}" placeholder="${esc(t("category"))}" aria-label="${esc(t("rename_category"))}"${maxLength(ctx.limits.category)}>`
        : `<button class="tab ${active ? "active" : ""}" role="tab" aria-selected="${active}" data-action="category" data-key="${esc(c)}">${esc(categoryLabel(c, t))}</button>`;
    })
    .join("");
  const rename = categories.length ? iconButton({ action: "rename", icon: "mdi:pencil", label: t("rename_category"), cls: "small-btn" }) : "";
  // the tabs wrap into more lines; rename and "+ Category" stay at the top right
  return `<div class="tabs"><div class="tab-list" role="tablist" aria-label="${esc(t("categories"))}">${tabs}</div>
    <div class="tab-actions">${rename}<button class="tab new" data-action="newcategory"><ha-icon icon="mdi:plus"></ha-icon>${esc(t("new_category"))}</button></div></div>`;
};

const costsSection = (draft, categories, state, ctx) => {
  const { t } = ctx;
  const single = activePersons(draft.persons).length === 1;
  const list = TAB_COSTS;
  const rows = costsOfCategory(draft, state.category);
  const cls = `costs ${single ? "single" : ""}`;
  return `<div class="box">${sectionHead("mdi:receipt-text-outline", t("fixed_costs"))}
    ${categoryTabs(categories, state, ctx)}
    ${headRow(cls, rows, [["name", t("name")], ["amount", t("amount")], ["freq", t("frequency")], ...(single ? [] : [["person", t("paid_by")]])])}
    ${rows
      .map((r) =>
        row(cls, r, [
          nameInput(list, r, ctx),
          amountInput(list, r, "amount", t("amount"), ctx),
          intervalField(r, ctx),
          single ? "" : personSelect(list, r, "person", t("paid_by"), draft, ctx),
          removeButton(list, r, ctx),
        ]),
      )
      .join("")}
    ${addButton(list, t("add_cost"))}</div>`;
};

/* ---------- The page ---------- */

const pageTabs = (tabs, draft, state, ctx) => {
  const { t } = ctx;
  const label = (key) => {
    if (key === TAB_COSTS) return esc(t("fixed_costs"));
    if (key === TAB_SHARED) return esc(t("shared_income"));
    return `<span class="dot" style="background:${personColor(draft.colors, key)}"></span>${esc(personLabel(draft.persons, key, t))}`;
  };
  const button = (key) =>
    `<button class="edit-tab ${key === state.tab ? "active" : ""}" role="tab" aria-selected="${key === state.tab}" data-action="tab" data-key="${key}">${label(key)}</button>`;
  // "+ Person" sits after the person tabs, before joint income and fixed costs
  const addPerson = tabs.persons.includes("b")
    ? ""
    : `<button class="edit-tab add-person" data-action="addperson"><ha-icon icon="mdi:plus"></ha-icon>${esc(t("person"))}</button>`;
  return `<div class="edit-tabs" role="tablist">${tabs.persons.map(button).join("")}${addPerson}${tabs.shared ? button(TAB_SHARED) : ""}${button(TAB_COSTS)}</div>`;
};

const footer = (state, ctx) => {
  const { t } = ctx;
  const disabled = state.saving ? "disabled" : "";
  return `<div class="box footer">
    <div class="save-error" ${state.saveError ? "" : "hidden"}>${esc(state.saveError || "")}</div>
    ${state.saved && !state.saveError ? `<div class="saved"><ha-icon icon="mdi:check-circle"></ha-icon>${esc(t("saved"))}</div>` : ""}
    <span class="grow"></span>
    <button class="btn" data-action="cancel" ${disabled}>${esc(t("cancel"))}</button>
    <button class="btn primary" data-action="save" ${disabled}>${esc(t(state.saving ? "saving" : "save"))}</button>
  </div>`;
};

/**
 * tabs = draft.editTabs(...), categories = draft.costCategories(...),
 * state = { tab, category, renaming, saving, saveError, saved } (tab and category must exist).
 */
export const renderEditor = (draft, tabs, categories, state, ctx) => {
  let section;
  if (state.tab === TAB_COSTS) section = costsSection(draft, categories, state, ctx);
  else if (state.tab === TAB_SHARED) section = sharedSection(draft, ctx);
  else section = personSection(state.tab, draft, ctx);
  return pageTabs(tabs, draft, state, ctx) + section + footer(state, ctx);
};
