/*
 * Styles of the card and the edit page. Colors come from the Home Assistant theme.
 * Layout: one column on narrow cards, the wide layout from 700 px (container query on .root).
 */

const WIDE = "(min-width: 700px)";
const NARROW = "(max-width: 699.98px)";

/* Shared by the card and the editor */
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
  .root { container-type: inline-size; display: flex; flex-direction: column; gap: var(--eb-gap); color: var(--primary-text-color); }
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
  .add { align-self: flex-start; display: inline-flex; align-items: center; gap: 6px; min-height: 40px; margin-top: 6px; padding: 0 12px 0 8px;
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
  .drow { display: grid; grid-template-columns: minmax(0, 1fr) auto; grid-template-areas: "name month" "paid year" "person person";
    gap: 4px 12px; padding: 12px 0; border-bottom: 1px solid var(--eb-line); font-size: 14px; align-items: center; }
  .drow > span { min-width: 0; }
  .d-name { grid-area: name; }
  .d-person { grid-area: person; }
  .d-freq { grid-area: freq; display: none; }
  .d-paid { grid-area: paid; font-size: 13px; color: var(--eb-muted); }
  .d-month { grid-area: month; text-align: right; }
  .d-year { grid-area: year; text-align: right; font-size: 12px; color: var(--eb-muted); }
  .dhead { display: none; }
  .dsum { border-bottom: 0; grid-template-areas: "name month" ". year"; font-weight: 700; }
  .dsum .d-year { font-weight: 400; }
  /* one person: no person column */
  .table.single .d-person { display: none; }
  .table.single .drow { grid-template-areas: "name month" "paid year"; }
  .table.single .dsum { grid-template-areas: "name month" ". year"; }
  .wide-only { display: none; }
  .chip { font-size: 12px; font-weight: 600; padding: 2px 8px; border-radius: 10px;
    background: color-mix(in srgb, var(--c) 16%, transparent); box-shadow: inset 0 0 0 1px var(--c); }

  @container ${WIDE} {
    .kpis { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .kpi.main { grid-column: auto; }
    .kpi .value { font-size: 28px; }
    .kpi.small .value { font-size: 24px; }
    .columns { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .column.costs { order: 0; }
    .cat-share { width: 44px; font-size: 12px; }
    .cat-value { width: 76px; }
    .drow, .dsum { grid-template-columns: minmax(0, 1fr) 140px 130px 120px 100px 100px; grid-template-areas: "name person freq paid month year"; }
    .drow { padding: 10px 0; min-height: 28px; }
    .d-freq { display: block; font-size: 14px; color: var(--eb-muted); }
    .d-paid { text-align: right; font-size: 14px; }
    .d-year { font-size: 14px; }
    .dhead { display: grid; }
    .dhead > span { font-size: 11px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: var(--eb-muted); }
    .table.single .drow, .table.single .dsum { grid-template-columns: minmax(0, 1fr) 130px 120px 100px 100px; grid-template-areas: "name freq paid month year"; }
    .narrow-only { display: none; }
    .wide-only { display: inline; }
  }
`;

/* The editor: page tabs, rows of fields, category tabs and the footer */
export const EDIT_STYLE = `
  :host {
    /* column widths of the rows on wide pages */
    --eb-col-amount: 140px;
    --eb-col-select: 160px;
    --eb-col-remove: 40px;
  }

  /* Page tabs: persons, joint income, fixed costs */
  .edit-tabs { display: flex; gap: 4px; overflow-x: auto; border-bottom: 1px solid var(--eb-line); scrollbar-width: thin; }
  .edit-tab { flex-shrink: 0; display: inline-flex; align-items: center; gap: 8px; height: 44px; padding: 0 16px; border: 0;
    border-bottom: 3px solid transparent; background: transparent; cursor: pointer; font-size: 14px; font-weight: 600;
    color: var(--eb-muted); white-space: nowrap; }
  .edit-tab.active { color: var(--primary-color); border-bottom-color: var(--primary-color); }
  .edit-tab.add-person { color: var(--primary-color); font-weight: 500; }
  .edit-tab.add-person ha-icon { --mdc-icon-size: 18px; }

  /* Fields */
  .field { display: flex; flex-direction: column; gap: 4px; min-width: 0; font-size: 12px; color: var(--eb-muted); }
  .field input, .field select { font: inherit; font-size: 14px; color: var(--primary-text-color); height: 40px; box-sizing: border-box; min-width: 0;
    padding: 0 10px; border-radius: 8px; border: 1px solid var(--eb-line); background: var(--eb-surface); }
  .field input:focus, .field select:focus { outline: 2px solid var(--primary-color); outline-offset: -1px; }
  .field input.invalid { background: color-mix(in srgb, var(--eb-error) 18%, transparent); border-color: var(--eb-error); }
  .field.f-color input { width: 48px; padding: 4px; cursor: pointer; }
  .name-row { display: flex; align-items: center; gap: 8px; }
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
  .field.f-freq .money input { flex: 0 0 auto; padding: 0 0 0 10px; box-sizing: content-box; text-align: left; }
  .f-freq .months { flex: 1; min-width: 0; padding-left: 4px; font-size: 14px; color: var(--primary-text-color); white-space: nowrap; overflow: hidden; }
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
  .erow > .remove { grid-area: remove; width: 100%; height: 40px; }
  .ehead { display: none; }

  /* narrow pages: everything in one line where it fits */
  .erow.income { --cols: minmax(0, 1fr) minmax(0, 100px) minmax(0, 100px) 32px; --areas: "name gross amount remove"; }
  .erow.special { --cols: minmax(0, 1fr) minmax(0, 120px) 32px; --areas: "name gross remove"; }
  .erow.shared { --cols: calc(50% - 3px) minmax(0, 1fr) 40px; --areas: "name name remove" "amount to to"; }
  .erow.shared.single { --cols: minmax(0, 1fr) 110px 40px; --areas: "name amount remove"; }
  .erow.costs { --cols: minmax(0, 1fr) minmax(0, 88px) minmax(0, 104px) 32px; --areas: "name amount freq remove" "person person person person"; padding: 14px 0; }
  .erow.costs.single { --areas: "name amount freq remove"; }
  @container ${NARROW} {
    /* both amounts of an income need visible labels (wide pages have column headers) */
    .erow.income .f-gross .sr, .erow.income .f-amount .sr { position: static; width: auto; height: auto; clip: auto; overflow: visible; }
  }

  /* Category tabs of the fixed costs: they wrap into more lines; rename and "+ Category" stay at the top right */
  .tabs { display: flex; gap: 8px; align-items: flex-start; padding: 2px 2px 12px; }
  .tab-list { flex: 1; min-width: 0; display: flex; flex-wrap: wrap; gap: 8px; }
  .tab-actions { flex-shrink: 0; display: flex; align-items: center; gap: 8px; }
  .tab { flex-shrink: 0; height: 36px; padding: 0 14px; border-radius: 18px; cursor: pointer; white-space: nowrap;
    border: 1px solid var(--eb-line); background: transparent; font-size: 14px; font-weight: 500; }
  .tab.active { background: var(--primary-color); border-color: var(--primary-color); color: var(--text-primary-color, #fff); }
  .tab.new { display: inline-flex; align-items: center; gap: 4px; border-style: dashed; color: var(--primary-color); padding-left: 8px; }
  .tab.new ha-icon { --mdc-icon-size: 18px; }
  .tab-rename { flex-shrink: 0; width: 180px; height: 36px; box-sizing: border-box; padding: 0 12px; border-radius: 18px; font: inherit; font-size: 14px;
    border: 2px solid var(--primary-color); background: var(--eb-surface); color: var(--primary-text-color); }
  .tab-list .tab, .tab-list .tab-rename { max-width: 100%; overflow: hidden; text-overflow: ellipsis; }

  /* Footer: stays at the bottom of the window */
  .footer { flex-direction: row; flex-wrap: wrap; align-items: center; gap: 10px; position: sticky; bottom: 8px; z-index: 1; }
  .save-error { flex-basis: 100%; color: var(--eb-error); font-size: 14px; }
  .saved { display: inline-flex; align-items: center; gap: 6px; color: var(--eb-success); font-weight: 500; }
  .saved ha-icon { --mdc-icon-size: 18px; }
  .btn { min-height: 44px; padding: 0 18px; border-radius: 22px; cursor: pointer; border: 1px solid var(--eb-line); background: transparent; font-weight: 500; }
  .btn.primary { background: var(--primary-color); border-color: var(--primary-color); color: var(--text-primary-color, #fff); }
  .btn[disabled] { opacity: 0.6; cursor: default; }

  @container ${WIDE} {
    /* wide pages: one line per row with column headers */
    .erow.income { --cols: minmax(0, 1fr) var(--eb-col-amount) var(--eb-col-amount) var(--eb-col-remove); }
    .erow.special { --cols: minmax(0, 1fr) var(--eb-col-amount) var(--eb-col-remove); }
    .erow.shared { --cols: minmax(0, 1fr) var(--eb-col-select) var(--eb-col-amount) var(--eb-col-remove); --areas: "name to amount remove"; }
    .erow.shared.single { --cols: minmax(0, 1fr) var(--eb-col-amount) var(--eb-col-remove); --areas: "name amount remove"; }
    .erow.costs { --cols: minmax(0, 1fr) var(--eb-col-amount) var(--eb-col-select) var(--eb-col-select) var(--eb-col-remove); --areas: "name amount freq person remove"; }
    .erow.costs.single { --cols: minmax(0, 1fr) var(--eb-col-amount) var(--eb-col-select) var(--eb-col-remove); --areas: "name amount freq remove"; }
    .erow.ehead { display: grid; padding: 0 0 2px; border-top: 0; font-size: 12px; color: var(--eb-muted); }
    .erow.costs.ehead { padding: 14px 0 0; }
    .ehead + .erow { border-top: 0; }
  }
`;

/* The edit page around the editor: toolbar like the pages of Home Assistant */
export const PANEL_STYLE = `
  :host { display: block; height: 100%; background: var(--primary-background-color); color: var(--primary-text-color); }
  .toolbar { display: flex; align-items: center; gap: 4px; box-sizing: border-box; padding: var(--safe-area-inset-top, 0px) 12px 0 4px;
    height: calc(var(--header-height, 56px) + var(--safe-area-inset-top, 0px));
    background: var(--app-header-background-color, var(--primary-color)); color: var(--app-header-text-color, #fff);
    border-bottom: var(--app-header-border-bottom, none); }
  .back { width: 48px; height: 48px; border: 0; border-radius: 50%; background: transparent; color: inherit; cursor: pointer;
    display: inline-flex; align-items: center; justify-content: center; }
  .back:hover { background: rgba(127, 127, 127, 0.15); }
  .page-title { margin: 0 0 0 4px; font-size: 20px; font-weight: 400; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .content { height: calc(100% - var(--header-height, 56px) - var(--safe-area-inset-top, 0px)); overflow-y: auto; box-sizing: border-box;
    padding: 16px 16px calc(16px + var(--safe-area-inset-bottom, 0px)); }
  .page { max-width: 1000px; margin: 0 auto; }
`;

/* The link to the edit page below the card options (the card editor has no shadow root, so every rule starts with its class) */
export const CARD_EDITOR_STYLE = `
  .eb-edit-link { display: flex; flex-direction: column; align-items: flex-start; gap: 16px; margin-top: 24px;
    color: var(--secondary-text-color); font-size: 14px; }
  .eb-edit-link button { display: inline-flex; align-items: center; gap: 6px; min-height: 40px; padding: 0 16px 0 12px; border-radius: 20px;
    cursor: pointer; font: inherit; font-weight: 500; border: 1px solid var(--primary-color); background: transparent; color: var(--primary-color); }
  .eb-edit-link ha-icon { --mdc-icon-size: 18px; }
`;
