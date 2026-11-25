/*
 * Styles of the card. Colors come from the Home Assistant theme.
 * Layout: one column on narrow cards, the wide layout from 700 px (container query on .root).
 */

const WIDE = "(min-width: 700px)";

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
  .kpi-people { display: flex; flex-wrap: wrap; gap: 4px 28px; margin-top: 2px; font-size: 13px; color: var(--eb-muted); }
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

/* Editing in the card: looks like the view, the values are fields with a light background */
export const EDIT_STYLE = `
  .live { display: contents; }

  /* Fields: the text of the view with a dotted line below; a light background on hover, the theme color on focus */
  /* the text of a field starts where the text of the view starts (padding and negative margin) */
  .in { font: inherit; color: inherit; height: 30px; box-sizing: border-box; min-width: 0; margin: 0 -5px; padding: 0 4px;
    border: 1px solid transparent; border-radius: 6px; background: transparent;
    background-image: linear-gradient(to right, var(--eb-muted) 1px, transparent 1px); background-size: 4px 1px;
    background-repeat: repeat-x; background-position: 5px calc(100% - 3px); background-origin: border-box; }
  .in:hover { background-color: var(--eb-tint-strong); }
  .in:focus, .in:focus-within { outline: 2px solid var(--primary-color); outline-offset: -1px; background: var(--eb-surface); }
  select.in:not(.chip) { appearance: none; padding-right: 6px; }
  .in input { font: inherit; color: inherit; border: 0; background: transparent; padding: 0; margin: 0; min-width: 0; height: 100%; }
  .in input:focus { outline: none; }
  .in.invalid, .in:has(.invalid), .in .invalid { background: color-mix(in srgb, var(--eb-error) 18%, transparent); }
  .in.invalid, .in:has(.invalid) { border-color: var(--eb-error); }
  .in::placeholder, .in input::placeholder { color: var(--eb-muted); opacity: 0.7; }
  select.in { cursor: pointer; }

  /* Amounts: right-aligned with the currency sign like in the view */
  .money { display: inline-flex; align-items: center; justify-content: flex-end; }
  .money input { flex: 1; width: 100%; text-align: right; font-variant-numeric: tabular-nums; }
  .money .cur { padding-left: 3px; user-select: none; }
  .money.day, .drow .in.money.day { width: auto; flex: 0 0 auto; justify-content: flex-start; }
  .money.day input { flex: 0 0 auto; text-align: left; }
  .money.day .cur { padding-left: 1px; }

  /* Interval "N months": looks like the text of the select, with an invisible select over the chevron as menu */
  .money.interval { justify-content: flex-start; }
  .money.interval input { flex: 0 0 auto; text-align: left; }
  .unit-months { flex: 1; min-width: 0; padding-left: 4px; white-space: nowrap; overflow: hidden; }
  .freq-menu { position: relative; display: flex; align-items: center; justify-content: center; width: 22px; height: 100%; flex-shrink: 0; color: var(--eb-muted); }
  .freq-menu ha-icon { --mdc-icon-size: 18px; }
  .freq-menu select { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }

  /* Person: like the chip of the view */
  /* own chevron with room at the right (the native arrow of Safari sits right at the edge) */
  select.in.chip { appearance: none; margin: 0; height: 24px; padding: 0 22px 0 10px; border-radius: 12px; font-size: 12px; font-weight: 600;
    color: var(--primary-text-color); background-color: color-mix(in srgb, var(--c) 16%, transparent); box-shadow: inset 0 0 0 1px var(--c); border: 0;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23888' d='M7.4 8.6 12 13.2l4.6-4.6L18 10l-6 6-6-6z'/%3E%3C/svg%3E");
    background-repeat: no-repeat; background-size: 14px; background-position: right 6px center; }

  .tiny { width: 28px; height: 28px; }
  .tiny ha-icon { --mdc-icon-size: 18px; }

  /* Blocks: the name of a person in the head, lines with name, amount and remove */
  .block-head .in { width: calc(100% + 10px); }
  .color-dot { position: relative; width: 12px; height: 12px; cursor: pointer; }
  .color-dot input { position: absolute; inset: -6px; width: 24px; height: 24px; opacity: 0; cursor: pointer; padding: 0; border: 0; }
  .line.eline { align-items: center; gap: 6px; min-height: 32px; }
  .eline > input.in { flex: 1; }
  .eline > .money { flex: 0 0 96px; width: 96px; }
  .eline > .tiny { margin-right: -6px; }
  .eline .calc { flex: 0 0 auto; text-align: right; }
  .eline > .money.gross { flex: 0 0 84px; width: 84px; margin: 0 -2px; }
  .eline select.in.chip { flex-shrink: 0; max-width: 110px; }

  /* "+ Add …": small, below the lines */
  .editing .add, .table.edit .add { min-height: 32px; margin-top: 2px; padding: 0 10px 0 6px; border: 0; font-size: 13px; }
  .editing .add ha-icon, .table.edit .add ha-icon { --mdc-icon-size: 16px; }
  .cat-row .icon-btn:last-child { margin-left: 4px; }

  /* Detail view of a category: the table of the view with fields and a column for remove */
  .in.title { width: calc(100% + 10px); height: 40px; font-size: 20px; font-weight: 600; }
  .table.edit .drow { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 28px; align-items: center;
    grid-template-areas: "name name remove" "paid freq ." "due person ."; }
  .table.edit.single .drow { grid-template-areas: "name name remove" "paid freq ." "due due ."; }
  .table.edit .d-freq { display: block; }
  .table.edit .drow { gap: 4px 8px; }
  .table.edit .drow:not(.dsum) .d-month, .table.edit .drow:not(.dsum) .d-year { display: none; }
  .table.edit .dsum { grid-template-columns: minmax(0, 1fr) auto; grid-template-areas: "name month" ". year"; }
  .table.edit .dsum .d-month, .table.edit .dsum .d-year { display: block; }
  .d-remove { grid-area: remove; display: flex; justify-content: flex-end; }
  .drow .in:not(.chip) { width: calc(100% + 10px); }
  .d-due { text-align: left; }
  .due { display: flex; gap: 6px; }
  .due select.in { flex: 1; width: auto; margin-left: 0; }

  /* A question before deleting */
  .confirm { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin: 6px 0; padding: 10px 12px; border-radius: 10px;
    background: color-mix(in srgb, var(--eb-error) 12%, transparent); font-size: 14px; }
  .confirm .grow { flex-basis: 200px; }
  .btn.danger { background: var(--eb-error); border-color: var(--eb-error); color: #fff; }

  /* Unsaved changes from before */
  .kept { flex-direction: row; flex-wrap: wrap; align-items: center; gap: 10px;
    background: color-mix(in srgb, var(--primary-color) 10%, var(--eb-surface)); }
  .kept ha-icon { color: var(--primary-color); }
  .kept .grow { flex-basis: 200px; }

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
    .table.edit .drow, .table.edit .dhead { grid-template-columns: minmax(0, 1fr) 100px 140px 160px 100px 80px 80px 28px;
      grid-template-areas: "name person freq due paid month year remove"; }
    .table.edit.single .drow, .table.edit.single .dhead { grid-template-columns: minmax(0, 1fr) 140px 160px 100px 80px 80px 28px;
      grid-template-areas: "name freq due paid month year remove"; }
    .table.edit .drow:not(.dsum) .d-month, .table.edit .drow:not(.dsum) .d-year { display: block; }
    .table.edit .dsum { grid-template-columns: minmax(0, 1fr) 80px 80px 28px; grid-template-areas: "name month year ."; }
  }
`;
