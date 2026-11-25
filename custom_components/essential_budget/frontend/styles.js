/*
 * Styles of the card. Colors come from the Home Assistant theme.
 * Layout: one column on narrow cards, the wide layout from 700 px (container query on .root);
 * the rows of fields while editing follow the width of their box (container query on .box.editing).
 */

const WIDE = "(min-width: 700px)";
const EDIT_WIDE = "ebox (min-width: 440px)"; // a box while editing: wide enough for a row of fields in one line
const EDIT_NARROW = "ebox (max-width: 439.98px)";

/* Base of the card */
export const BASE_STYLE = `
  :host {
    display: block;
    --eb-surface: var(--ha-card-background, var(--card-background-color, #fff));
    --eb-line: var(--divider-color, #e0e0e0);
    --eb-muted: var(--secondary-text-color);
    --eb-error: var(--error-color, #db4437);
    --eb-success: var(--success-color, #43a047);
    --eb-tint: color-mix(in srgb, var(--primary-text-color) 4%, transparent);
    --eb-tint-strong: color-mix(in srgb, var(--primary-text-color) 8%, transparent);
    --eb-gap: 12px;
  }
  .root { container: card / inline-size; display: flex; flex-direction: column; gap: var(--eb-gap); color: var(--primary-text-color); }
  .box {
    background: var(--eb-surface);
    border: var(--ha-card-border-width, 1px) solid var(--ha-card-border-color, var(--eb-line));
    border-radius: var(--ha-card-border-radius, 12px);
    box-shadow: var(--ha-card-box-shadow, none);
    padding: 16px; display: flex; flex-direction: column; min-width: 0; box-sizing: border-box;
  }
  button { font: inherit; color: inherit; }
  ha-icon { --mdc-icon-size: 22px; flex-shrink: 0; }
  .muted { color: var(--eb-muted); }
  .small { font-size: 12px; }
  .strong { font-weight: 600; }
  .grow { flex: 1; min-width: 0; }
  .ellipsis { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
  .dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
  .dot.square { width: 14px; height: 14px; border-radius: 4px; }
  .title { margin: 0; font-size: 20px; font-weight: 600; }

  .msg { color: var(--eb-muted); }
  .msg.err { color: var(--eb-error); }
  .update { border: 0; border-radius: 12px; padding: 12px 16px; text-align: left; cursor: pointer;
    background: color-mix(in srgb, var(--primary-color) 15%, transparent); color: var(--primary-text-color); }

  .icon-btn { width: 44px; height: 44px; border: 0; background: transparent; border-radius: 50%; cursor: pointer;
    display: inline-flex; align-items: center; justify-content: center; color: var(--eb-muted); flex-shrink: 0; }
  .icon-btn:hover { background: var(--eb-tint-strong); }
  .icon-btn.round { background: var(--eb-surface); border: 1px solid var(--eb-line); }
  .add { align-self: flex-start; text-align: left; display: inline-flex; align-items: center; gap: 6px; min-height: 40px; margin-top: 6px; padding: 0 12px 0 8px;
    border: 1px dashed var(--eb-line); border-radius: 20px; background: transparent; cursor: pointer; color: var(--primary-color); font-weight: 500; }
  .add ha-icon { --mdc-icon-size: 18px; }

  .section-head { display: flex; align-items: center; gap: 10px; padding-bottom: 10px; }
  .section-head ha-icon { color: var(--primary-color); }
  .section-head h2 { margin: 0; flex: 1; font-size: 17px; font-weight: 600; }
  .head-value { font-size: 16px; font-weight: 600; }
  .hint { font-size: 12px; color: var(--eb-muted); margin: -6px 0 6px 32px; }
  .hint.flat { margin: 6px 0 0; }
`;

/* The card: header, key figures, boxes, fixed costs and the detail view */
export const VIEW_STYLE = `
  :host { scroll-margin-top: calc(var(--header-height, 56px) + 8px); }
  ha-card { background: none; border: none; box-shadow: none; overflow: visible; }

  /* Header: show/hide numbers at the left, the other buttons at the right */
  .header { display: flex; align-items: center; gap: 8px; min-height: 44px; }
  .header .title { margin-right: auto; }
  .header .actions { display: flex; gap: 4px; margin-left: auto; }

  /* Numbers are unreadable while they are hidden */
  .num { transition: filter 0.2s; }
  .private .num { filter: blur(8px); user-select: none; }
  .negative { color: var(--eb-error); }

  /* Key figures: on narrow cards the budget takes the full width */
  .kpis { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--eb-gap); }
  .kpi { gap: 4px; }
  .kpi .label, .kpi .sub { font-size: 13px; color: var(--eb-muted); }
  .kpi .value { font-size: 24px; font-weight: 700; }
  .kpi.small .value { font-size: 18px; }
  .kpi.positive .value { color: var(--eb-success); }
  .kpi.negative .value { color: var(--eb-error); }
  /* budget: green frame when positive, red when negative */
  .kpi.main { grid-column: 1 / -1; box-shadow: inset 0 0 0 2px var(--eb-success); }
  .kpi.main.negative { box-shadow: inset 0 0 0 2px var(--eb-error); }
  .kpis.detail { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  /* free budget per person inside the key figure */
  .kpi-people { display: flex; flex-wrap: wrap; gap: 4px 16px; margin-top: 2px; font-size: 13px; color: var(--eb-muted); }
  .kpi-person { display: inline-flex; align-items: center; gap: 6px; min-width: 0; }
  .kpi-person .strong { color: var(--primary-text-color); }
  .kpi-person .negative { color: var(--eb-error); }

  /* Narrow: one column with the fixed costs first; wide: income at the left, fixed costs at the right */
  .columns { display: grid; grid-template-columns: minmax(0, 1fr); gap: var(--eb-gap); align-items: start; }
  .column { display: flex; flex-direction: column; gap: var(--eb-gap); min-width: 0; }
  .column.costs { order: -1; }

  /* Blocks per person (monthly net, annual gross) and rows (budget per person) */
  .blocks { display: flex; flex-direction: column; gap: 10px; }
  .block { display: flex; flex-direction: column; gap: 6px; padding: 12px; border-radius: 10px; background: var(--eb-tint); }
  .block-head { display: flex; align-items: center; gap: 8px; font-size: 16px; font-weight: 600; }
  .line { display: flex; justify-content: space-between; gap: 12px; padding-left: 18px; font-size: 13px; color: var(--eb-muted); }
  .row { display: flex; justify-content: space-between; gap: 12px; font-size: 14px; padding: 8px 0; border-top: 1px solid var(--eb-line); }

  /* Fixed costs: a row per category with a bar, expandable to its items */
  .cat { border-top: 1px solid var(--eb-line); }
  .cat-row { display: flex; align-items: center; min-height: 52px; }
  .toggle-space { width: 44px; flex-shrink: 0; }
  .cat-btn { flex: 1; min-width: 0; min-height: 44px; border: 0; background: transparent; border-radius: 10px; cursor: pointer;
    display: flex; align-items: center; gap: 10px; padding: 0 2px; text-align: left; }
  .cat-btn:hover { background: var(--eb-tint); }
  .cat-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; padding: 8px 0 14px; font-size: 14px; }
  .cat-share { width: 34px; text-align: right; font-size: 11px; color: var(--eb-muted); font-variant-numeric: tabular-nums; }
  .cat-value { width: 66px; text-align: right; font-size: 14px; font-weight: 700; font-variant-numeric: tabular-nums; }
  .bar { display: block; height: 4px; border-radius: 2px; overflow: hidden; background: var(--eb-tint-strong); }
  .bar i { display: block; height: 100%; border-radius: 2px; }
  .bar.thin { height: 3px; }
  .bar.thin i { opacity: 0.7; }
  .items { display: flex; flex-direction: column; gap: 6px; padding: 2px 0 14px 44px; }
  .item { display: flex; align-items: center; gap: 12px; min-height: 48px; font-size: 14px; padding-right: 32px; }
  .item-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; padding: 4px 0; }
  .item-value { width: 76px; text-align: right; font-variant-numeric: tabular-nums; }

  /* Detail view of a category: a list on narrow cards, a table on wide ones */
  .detail-head { display: flex; align-items: center; gap: 12px; }
  .table { padding-top: 4px; padding-bottom: 4px; }
  .drow { display: grid; grid-template-columns: minmax(0, 1fr) auto; grid-template-areas: "name month" "paid year" "person due";
    gap: 4px 12px; padding: 12px 0; border-bottom: 1px solid var(--eb-line); font-size: 14px; align-items: center; }
  .drow > span { min-width: 0; }
  .d-name { grid-area: name; }
  .d-person { grid-area: person; }
  .d-freq { grid-area: freq; display: none; }
  .d-due { grid-area: due; text-align: right; font-size: 12px; color: var(--eb-muted); }
  .d-paid { grid-area: paid; font-size: 13px; color: var(--eb-muted); }
  .d-month { grid-area: month; text-align: right; }
  .d-year { grid-area: year; text-align: right; font-size: 12px; color: var(--eb-muted); }
  .dhead { display: none; }
  .dsum { border-bottom: 0; grid-template-areas: "name month" ". year"; font-weight: 700; }
  .dsum .d-year { font-weight: 400; }
  /* one person: no person column */
  .table.single .d-person { display: none; }
  .table.single .drow { grid-template-areas: "name month" "paid year" "due due"; }
  .table.single .d-due { text-align: left; }
  .table.single .drow.no-due { grid-template-areas: "name month" "paid year"; }
  .drow.no-due .d-due { display: none; }
  .table.single .dsum { grid-template-areas: "name month" ". year"; }
  .wide-only { display: none; }
  .chip { font-size: 12px; font-weight: 600; padding: 2px 8px; border-radius: 10px;
    background: color-mix(in srgb, var(--c) 16%, transparent); box-shadow: inset 0 0 0 1px var(--c); }

  /* Debits by month: a bar per month (tap = its debits) */
  .months { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: 4px; height: 180px; }
  .mbar { min-width: 0; border: 0; background: transparent; padding: 4px 0; border-radius: 8px; cursor: pointer;
    display: flex; flex-direction: column; align-items: center; gap: 4px; }
  .mbar:hover { background: var(--eb-tint); }
  .mbar.selected { background: var(--eb-tint-strong); }
  .mbar-value { display: none; font-size: 11px; color: var(--eb-muted); white-space: nowrap; }
  .mbar-track { flex: 1; width: 70%; max-width: 40px; display: flex; align-items: flex-end; }
  .mbar-track i { display: block; width: 100%; min-height: 2px; border-radius: 4px 4px 0 0;
    background: color-mix(in srgb, var(--primary-color) 45%, transparent); }
  .mbar.now .mbar-track i, .mbar.selected .mbar-track i { background: var(--primary-color); }
  .mbar-label { font-size: 11px; color: var(--eb-muted); white-space: nowrap; }
  .mbar.now .mbar-label { color: var(--primary-text-color); font-weight: 600; }
  .debit { display: grid; grid-template-columns: 88px minmax(0, 1fr) auto; gap: 12px; align-items: center; padding: 10px 0;
    border-top: 1px solid var(--eb-line); font-size: 14px; }
  .debit-date { font-size: 13px; color: var(--eb-muted); }
  .debit-main { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
  .debit-sub { display: flex; align-items: center; gap: 6px; min-width: 0; font-size: 12px; color: var(--eb-muted); }
  .debit-sub .dot { width: 8px; height: 8px; }
  .debit-value { text-align: right; font-variant-numeric: tabular-nums; }

  @container card ${WIDE} {
    .kpis { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .months { height: 220px; }
    .mbar-value { display: block; }
    .kpi.main { grid-column: auto; }
    .kpi .value { font-size: 28px; }
    .kpi.small .value { font-size: 24px; }
    .columns { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .column.costs { order: 0; }
    .cat-share { width: 44px; font-size: 12px; }
    .cat-value { width: 76px; }
    .drow, .dsum { grid-template-columns: minmax(0, 1fr) 120px 120px 150px 110px 95px 95px; grid-template-areas: "name person freq due paid month year"; }
    .drow { padding: 10px 0; min-height: 28px; }
    .d-freq { display: block; font-size: 14px; color: var(--eb-muted); }
    .d-due, .table.single .d-due { text-align: left; font-size: 14px; }
    .d-paid { text-align: right; font-size: 14px; }
    .d-year { font-size: 14px; }
    .dhead { display: grid; }
    .dhead > span { font-size: 11px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: var(--eb-muted); }
    .table.single .drow, .table.single .drow.no-due, .table.single .dsum { grid-template-columns: minmax(0, 1fr) 120px 150px 110px 95px 95px; grid-template-areas: "name freq due paid month year"; }
    .narrow-only { display: none; }
    .wide-only { display: inline; }
  }
`;

/* Editing in the card: rows of fields, categories, questions and the footer */
export const EDIT_STYLE = `
  :host {
    /* column widths of the rows in wide boxes */
    --eb-col-amount: 120px;
    --eb-col-select: 160px;
    --eb-col-due: 150px;
    --eb-col-remove: 40px;
  }

  /* Boxes while editing: their own width decides the layout of their rows */
  .box.editing { container: ebox / inline-size; }
  .live { display: contents; }
  .editing .block { gap: 4px; }
  .person-head { display: flex; align-items: center; gap: 6px; }
  .person-head .field input[type="text"] { font-weight: 600; font-size: 15px; }

  /* A question before deleting */
  .confirm { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin: 6px 0; padding: 10px 12px; border-radius: 10px;
    background: color-mix(in srgb, var(--eb-error) 12%, transparent); font-size: 14px; }
  .confirm .grow { flex-basis: 200px; }
  .btn.danger { background: var(--eb-error); border-color: var(--eb-error); color: #fff; }

  /* Categories while editing: name, sum, edit entries, delete */
  .ecat { display: flex; align-items: center; gap: 4px; min-height: 52px; border-top: 1px solid var(--eb-line); }
  .ecat .cat-btn { padding: 0 4px 0 8px; font-size: 14px; }
  .ecat .cat-value { width: auto; min-width: 48px; }
  .ecat .icon-btn { width: 40px; height: 40px; }
  .title-input { font-size: 18px !important; font-weight: 600; }

  /* Unsaved changes from before */
  .kept { flex-direction: row; flex-wrap: wrap; align-items: center; gap: 10px;
    background: color-mix(in srgb, var(--primary-color) 10%, var(--eb-surface)); }
  .kept ha-icon { color: var(--primary-color); }
  .kept .grow { flex-basis: 200px; }

  /* Fields */
  .field { display: flex; flex-direction: column; gap: 4px; min-width: 0; font-size: 12px; color: var(--eb-muted); }
  .field input, .field select { font: inherit; font-size: 14px; color: var(--primary-text-color); height: 40px; box-sizing: border-box; min-width: 0;
    padding: 0 10px; border-radius: 8px; border: 1px solid var(--eb-line); background: var(--eb-surface); }
  .field input:focus, .field select:focus { outline: 2px solid var(--primary-color); outline-offset: -1px; }
  .field input.invalid, .field select.invalid { background: color-mix(in srgb, var(--eb-error) 18%, transparent); border-color: var(--eb-error); }
  .field.f-color input { width: 48px; padding: 4px; cursor: pointer; }
  .small-btn { width: 36px; height: 36px; }
  .small-btn ha-icon { --mdc-icon-size: 18px; }

  /* Amounts: the field and the currency sign share one frame */
  .money { display: flex; align-items: center; height: 40px; box-sizing: border-box; border-radius: 8px;
    border: 1px solid var(--eb-line); background: var(--eb-surface); }
  .money:focus-within { outline: 2px solid var(--primary-color); outline-offset: -1px; }
  .money:has(input.invalid) { background: color-mix(in srgb, var(--eb-error) 18%, transparent); border-color: var(--eb-error); }
  .field .money input { flex: 1; width: 100%; height: 38px; border: 0; background: transparent; padding-right: 4px;
    text-align: right; font-variant-numeric: tabular-nums; }
  .field .money input:focus { outline: none; }
  .money .cur { padding: 0 10px 0 2px; font-size: 14px; color: var(--eb-muted); user-select: none; }

  /* Interval "N months": looks like the text of the frequency select, with an invisible select over the chevron as menu */
  /* Debit date: day and (not monthly) month side by side; the label is only shown on narrow boxes */
  .due { display: flex; gap: 6px; }
  .due-day-frame { flex: 0 0 56px; width: 56px; }
  .field .due .money .due-day { padding: 0 0 0 6px; text-align: right; }
  .due-day-frame .cur { padding: 0 12px 0 1px; color: var(--primary-text-color); }
  .field .due select { flex: 1; }

  .field.f-freq .money input { flex: 0 0 auto; padding: 0 0 0 10px; box-sizing: content-box; text-align: left; }
  .f-freq .unit-months { flex: 1; min-width: 0; padding-left: 4px; font-size: 14px; color: var(--primary-text-color); white-space: nowrap; overflow: hidden; }
  .freq-menu { position: relative; display: flex; align-items: center; justify-content: center; width: 28px; height: 38px; margin-left: -6px;
    color: var(--eb-muted); flex-shrink: 0; }
  .freq-menu ha-icon { --mdc-icon-size: 20px; }
  .field .freq-menu select { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; padding: 0; border: 0; }

  /*
   * Rows: a grid per list. Each list only sets its columns (--cols) and the places of its fields (--areas);
   * the fields find their place by their name.
   */
  .erow { display: grid; grid-template-columns: var(--cols); grid-template-areas: var(--areas); gap: 8px 6px; align-items: end;
    padding: 8px 0; border-top: 1px solid var(--eb-line); }
  .erow > .f-name { grid-area: name; }
  .erow > .f-gross { grid-area: gross; }
  .erow > .f-amount { grid-area: amount; }
  .erow > .f-to { grid-area: to; }
  .erow > .f-freq { grid-area: freq; }
  .erow > .f-person { grid-area: person; }
  .erow > .f-due { grid-area: due; }
  .erow > .remove { grid-area: remove; width: 100%; height: 40px; }
  .ehead { display: none; }

  /* narrow boxes: everything in one line where it fits */
  .erow.income { --cols: minmax(0, 1fr) minmax(0, 1fr) 32px; --areas: "name name remove" "gross amount ."; }
  .erow.special { --cols: minmax(0, 1fr) minmax(0, 120px) 32px; --areas: "name gross remove"; }
  .erow.shared { --cols: calc(50% - 3px) minmax(0, 1fr) 40px; --areas: "name name remove" "amount to to"; }
  .erow.shared.single { --cols: minmax(0, 1fr) 110px 40px; --areas: "name amount remove"; }
  .erow.costs { --cols: minmax(0, 1fr) minmax(0, 88px) minmax(0, 104px) 32px; --areas: "name amount freq remove" "due due person person"; padding: 14px 0; }
  .erow.costs.single { --areas: "name amount freq remove" "due due . ."; }
  @container ${EDIT_NARROW} {
    /* both amounts of an income need visible labels (wide boxes have column headers) */
    .erow.income .f-gross .sr, .erow.income .f-amount .sr { position: static; width: auto; height: auto; clip: auto; overflow: visible; }
  }

  /* Footer: stays at the bottom of the window */
  .footer { flex-direction: row; flex-wrap: wrap; align-items: center; gap: 10px; position: sticky; bottom: 8px; z-index: 1; }
  .save-error { flex-basis: 100%; color: var(--eb-error); font-size: 14px; }
  .btn { min-height: 44px; padding: 0 18px; white-space: nowrap; border-radius: 22px; cursor: pointer; border: 1px solid var(--eb-line); background: transparent; font-weight: 500; }
  .btn.primary { background: var(--primary-color); border-color: var(--primary-color); color: var(--text-primary-color, #fff); }
  .btn[disabled] { opacity: 0.6; cursor: default; }
  /* both buttons in one line where they fit, else one below the other in full width */
  .footer .btn { flex: 1 1 140px; }
  @container card ${WIDE} {
    .footer .btn { flex: 0 0 auto; }
    .footer .btn:first-of-type { margin-left: auto; }
  }

  @container ${EDIT_WIDE} {
    /* wide boxes: one line per row with column headers */
    .erow.income { --cols: minmax(0, 1fr) var(--eb-col-amount) var(--eb-col-amount) var(--eb-col-remove); --areas: "name gross amount remove"; }
    .erow.special { --cols: minmax(0, 1fr) var(--eb-col-amount) var(--eb-col-remove); }
    .erow.shared { --cols: minmax(0, 1fr) minmax(0, 120px) var(--eb-col-amount) var(--eb-col-remove); --areas: "name to amount remove"; }
    .erow.shared.single { --cols: minmax(0, 1fr) var(--eb-col-amount) var(--eb-col-remove); --areas: "name amount remove"; }
    .erow.costs { --cols: minmax(0, 1fr) var(--eb-col-amount) var(--eb-col-select) var(--eb-col-due) var(--eb-col-select) var(--eb-col-remove); --areas: "name amount freq due person remove"; }
    .erow.costs.single { --cols: minmax(0, 1fr) var(--eb-col-amount) var(--eb-col-select) var(--eb-col-due) var(--eb-col-remove); --areas: "name amount freq due remove"; }
    .f-due .label { display: none; }
    .erow.ehead { display: grid; padding: 0 0 2px; border-top: 0; font-size: 12px; color: var(--eb-muted); }
    .erow.costs.ehead { padding: 14px 0 0; }
    .ehead + .erow { border-top: 0; }
  }
`;
