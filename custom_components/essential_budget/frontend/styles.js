/* Styles of the Essential Budget card and edit page (colors come from the Home Assistant theme). */

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

export const STYLE = `
  :host { display: block; }
  ha-card { background: none; border: none; box-shadow: none; overflow: visible; }
  .root { container-type: inline-size; display: flex; flex-direction: column; gap: 12px; color: var(--primary-text-color); }
  .box {
    background: var(--ha-card-background, var(--card-background-color, #fff));
    border: var(--ha-card-border-width, 1px) solid var(--ha-card-border-color, var(--divider-color, #e0e0e0));
    border-radius: var(--ha-card-border-radius, 12px);
    box-shadow: var(--ha-card-box-shadow, none);
    padding: 16px; display: flex; flex-direction: column; min-width: 0; box-sizing: border-box;
  }
  button { font: inherit; color: inherit; }
  ha-icon { --mdc-icon-size: 22px; flex-shrink: 0; }
  .muted { color: var(--secondary-text-color); }
  .small { font-size: 12px; }
  .strong { font-weight: 600; }
  .grow { flex: 1; min-width: 0; }
  .ellipsis { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .negative, .kpi.negative .value { color: var(--error-color, #db4437) !important; }
  .kpi.positive .value { color: var(--success-color, #43a047); }
  .msg { color: var(--secondary-text-color); }
  .msg.err { color: var(--error-color, #db4437); }
  .update { border: 0; border-radius: 12px; padding: 12px 16px; text-align: left; cursor: pointer;
    background: color-mix(in srgb, var(--primary-color) 15%, transparent); color: var(--primary-text-color); }

  .header { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-height: 44px; }
  .title { margin: 0; font-size: 20px; font-weight: 600; }
  .icon-btn { width: 44px; height: 44px; border: 0; background: transparent; border-radius: 50%; cursor: pointer;
    display: inline-flex; align-items: center; justify-content: center; color: var(--secondary-text-color); flex-shrink: 0; }
  .icon-btn:hover { background: color-mix(in srgb, var(--primary-text-color) 8%, transparent); }
  .icon-btn.round { background: var(--ha-card-background, var(--card-background-color)); border: 1px solid var(--divider-color); }

  /* Key figures: narrow = budget on top over the full width */
  .kpis { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
  .kpi { gap: 4px; }
  .kpi .label, .kpi .sub { font-size: 13px; color: var(--secondary-text-color); }
  .kpi .label { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
  .kpi[data-action="reveal"] { cursor: pointer; user-select: none; }
  .kpi[data-action="reveal"]:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
  /* privacy mode: numbers unreadable until revealed */
  .num { transition: filter 0.2s; }
  .private .num { filter: blur(8px); user-select: none; }
  .kpi .value { font-size: 24px; font-weight: 700; }
  /* budget: green frame when positive, red when negative */
  .kpi.main { grid-column: 1 / -1; box-shadow: inset 0 0 0 2px var(--success-color, #43a047); }
  .kpi.main.negative { box-shadow: inset 0 0 0 2px var(--error-color, #db4437); }
  .kpis.detail { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .kpi.small .value { font-size: 18px; }

  /* narrow: one column (income, annual gross, budget per person, fixed costs); wide: income left, costs right */
  .columns { display: grid; grid-template-columns: minmax(0, 1fr); gap: 12px; align-items: start; }
  .column { display: flex; flex-direction: column; gap: 12px; min-width: 0; }
  /* narrow: fixed costs right below the key figures, then income, annual gross, budget per person */
  .column.costs { order: -1; }

  .section-head { display: flex; align-items: center; gap: 10px; padding-bottom: 10px; }
  .section-head ha-icon { color: var(--primary-color); }
  .section-head h2 { margin: 0; flex: 1; font-size: 17px; font-weight: 600; }
  .head-value { font-size: 16px; font-weight: 600; }
  .hint { font-size: 12px; color: var(--secondary-text-color); margin: -6px 0 6px 32px; }
  .footer .hint { margin: 0; flex-basis: 100%; }
  .hint.flat { margin: 6px 0 0; }
  .table.single .d-person { display: none; }
  .table.single .drow { grid-template-areas: "name month" "paid year"; }
  .table.single .dsum { grid-template-areas: "name month" ". year"; }

  .blocks { display: flex; flex-direction: column; gap: 10px; }
  .block { display: flex; flex-direction: column; gap: 6px; padding: 12px; border-radius: 10px;
    background: color-mix(in srgb, var(--primary-text-color) 4%, transparent); }
  .block-head { display: flex; align-items: center; gap: 8px; font-size: 16px; font-weight: 600; }
  .dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
  .dot.square { width: 14px; height: 14px; border-radius: 4px; }
  .line { display: flex; justify-content: space-between; gap: 12px; padding-left: 18px; font-size: 13px; color: var(--secondary-text-color); }
  .row { display: flex; justify-content: space-between; gap: 12px; font-size: 14px; padding: 8px 0; border-top: 1px solid var(--divider-color); }

  /* Fixed costs */
  .cat { border-top: 1px solid var(--divider-color); }
  .cat-row { display: flex; align-items: center; min-height: 52px; }
  .cat-btn { flex: 1; min-width: 0; min-height: 44px; border: 0; background: transparent; border-radius: 10px; cursor: pointer;
    display: flex; align-items: center; gap: 10px; padding: 0 2px; text-align: left; }
  .cat-btn:hover { background: color-mix(in srgb, var(--primary-text-color) 4%, transparent); }
  .cat-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; padding: 8px 0 14px; font-size: 14px; }
  .cat-share { width: 34px; text-align: right; font-size: 11px; color: var(--secondary-text-color); font-variant-numeric: tabular-nums; }
  .cat-value { width: 66px; text-align: right; font-size: 14px; font-weight: 700; font-variant-numeric: tabular-nums; }
  .bar { display: block; height: 4px; border-radius: 2px; overflow: hidden; background: color-mix(in srgb, var(--primary-text-color) 8%, transparent); }
  .bar i { display: block; height: 100%; border-radius: 2px; }
  .bar.thin { height: 3px; }
  .bar.thin i { opacity: 0.7; }
  .items { display: flex; flex-direction: column; gap: 6px; padding: 2px 0 14px 44px; }
  .item { display: flex; align-items: center; gap: 12px; min-height: 48px; font-size: 14px; padding-right: 32px; }
  .item-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; padding: 4px 0; }
  .item-value { width: 76px; text-align: right; font-variant-numeric: tabular-nums; }

  /* Detail page: list on narrow cards, table on wide ones */
  .detail-head { display: flex; align-items: center; gap: 12px; }
  .table { padding-top: 4px; padding-bottom: 4px; }
  .drow { display: grid; grid-template-columns: minmax(0, 1fr) auto; grid-template-areas: "name month" "paid year" "person person";
    gap: 4px 12px; padding: 12px 0; border-bottom: 1px solid var(--divider-color); font-size: 14px; align-items: center; }
  .drow > span { min-width: 0; }
  .d-name { grid-area: name; } .d-person { grid-area: person; } .d-month { grid-area: month; text-align: right; }
  .d-year { grid-area: year; text-align: right; font-size: 12px; color: var(--secondary-text-color); }
  .d-paid { grid-area: paid; font-size: 13px; color: var(--secondary-text-color); }
  .d-freq { display: none; }
  .dsum { border-bottom: 0; grid-template-areas: "name month" ". year"; font-weight: 700; }
  .dsum .d-year { font-weight: 400; }
  .dhead { display: none; }
  .wide-only { display: none; }
  .chip { font-size: 12px; font-weight: 600; padding: 2px 8px; border-radius: 10px;
    background: color-mix(in srgb, var(--c) 16%, transparent); box-shadow: inset 0 0 0 1px var(--c); }

  /* Edit mode */
  .erow { display: grid; gap: 8px 10px; align-items: end; padding: 8px 0; border-top: 1px solid var(--divider-color); }
  .erow.simple { grid-template-columns: minmax(0, 1fr) 110px 40px; }
  .erow.income .f-name { grid-area: name; } .erow.income .f-amount { grid-area: amount; }
  .erow.income .f-gross { grid-area: gross; } .erow.income .remove { grid-area: remove; }
  /* income on narrow cards: name, net, gross and delete in one line if it fits (short labels above the amounts) */
  .erow.income.flow { gap: 8px 6px; }
  .erow.income.flow .field.f-name { flex: 1 1 60px; order: 0; }
  .erow.income.flow .field.f-gross { flex: 0 1 100px; order: 1; }
  .erow.income.flow .field.f-amount { flex: 0 1 100px; order: 2; }
  .erow.income.flow .remove { order: 3; width: 32px; }
  .erow.income .sr { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .field.f-gross input { text-align: right; font-variant-numeric: tabular-nums; }
  /* narrow: both amounts of an income need visible labels (wide cards have column headers) */
  .erow.income .f-amount .sr, .erow.income .f-gross .sr { position: static; width: auto; height: auto; clip: auto; overflow: visible; }
  .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
  .ehead { display: none; }
  /* special payments: name, gross, delete */
  .erow.special.flow { gap: 8px 6px; }
  .erow.special.flow .field.f-name { flex: 1 1 60px; order: 0; }
  .erow.special.flow .field.f-gross { flex: 0 1 120px; order: 1; }
  .erow.special.flow .remove { order: 2; width: 32px; }
  .erow.special .f-name { grid-area: name; } .erow.special .f-gross { grid-area: gross; } .erow.special .remove { grid-area: remove; }
  .name-row { display: flex; align-items: center; gap: 8px; }
  .field.f-color input { width: 48px; padding: 4px; cursor: pointer; }
  .erow.shared { grid-template-columns: minmax(0, 1fr) 110px 40px; grid-template-areas: "name name remove" "to amount amount"; }
  .erow.shared .f-name { grid-area: name; } .erow.shared .f-to { grid-area: to; }
  .erow.shared .f-amount { grid-area: amount; } .erow.shared .remove { grid-area: remove; }
  .field { display: flex; flex-direction: column; gap: 4px; min-width: 0; font-size: 12px; color: var(--secondary-text-color); }
  .field input, .field select { font: inherit; font-size: 14px; color: var(--primary-text-color); height: 40px; box-sizing: border-box; min-width: 0;
    padding: 0 10px; border-radius: 8px; border: 1px solid var(--divider-color); background: var(--ha-card-background, var(--card-background-color)); }
  .field input:focus, .field select:focus { outline: 2px solid var(--primary-color); outline-offset: -1px; }
  .field.f-amount input { text-align: right; font-variant-numeric: tabular-nums; }
  /* "N Monate" looks like the text of the frequency select: same color, left aligned, menu at the right */
  .field.f-freq .money input { flex: 0 0 auto; padding: 0 0 0 10px; box-sizing: content-box; text-align: left; }
  .f-freq .months { flex: 1; min-width: 0; padding-left: 4px; font-size: 14px; color: var(--primary-text-color); white-space: nowrap; overflow: hidden; }
  .field input.invalid { background: color-mix(in srgb, var(--error-color, #db4437) 18%, transparent); border-color: var(--error-color, #db4437); }
  .remove { width: 40px; height: 40px; }
  .toggle-space { width: 44px; flex-shrink: 0; }
  .edit-tabs { display: flex; gap: 4px; overflow-x: auto; border-bottom: 1px solid var(--divider-color); scrollbar-width: thin; }
  .edit-tab { flex-shrink: 0; height: 44px; padding: 0 16px; border: 0; border-bottom: 3px solid transparent; background: transparent;
    cursor: pointer; font-size: 14px; font-weight: 600; color: var(--secondary-text-color); white-space: nowrap; }
  .edit-tab.active { color: var(--primary-color); border-bottom-color: var(--primary-color); }
  .edit-tab { display: inline-flex; align-items: center; gap: 8px; }
  .edit-tab.add-person { color: var(--primary-color); font-weight: 500; }
  .edit-tab.add-person ha-icon { --mdc-icon-size: 18px; }
  /* category tabs wrap into more lines; rename and "+ Kategorie" stay at the top right */
  .tabs { display: flex; gap: 8px; align-items: flex-start; padding: 2px 2px 12px; }
  .tab-list { flex: 1; min-width: 0; display: flex; flex-wrap: wrap; gap: 8px; }
  .tab-actions { flex-shrink: 0; display: flex; align-items: center; gap: 8px; }
  .tab-list .tab, .tab-list .tab-rename { max-width: 100%; overflow: hidden; text-overflow: ellipsis; }
  .tab { flex-shrink: 0; height: 36px; padding: 0 14px; border-radius: 18px; cursor: pointer; white-space: nowrap;
    border: 1px solid var(--divider-color); background: transparent; font-size: 14px; font-weight: 500; }
  .tab.active { background: var(--primary-color); border-color: var(--primary-color); color: var(--text-primary-color, #fff); }
  .tab.new { display: inline-flex; align-items: center; gap: 4px; border-style: dashed; color: var(--primary-color); padding-left: 8px; }
  .tab.new ha-icon { --mdc-icon-size: 18px; }
  .tab-rename { flex-shrink: 0; width: 180px; height: 36px; box-sizing: border-box; padding: 0 12px; border-radius: 18px; font: inherit; font-size: 14px;
    border: 2px solid var(--primary-color); background: var(--ha-card-background, var(--card-background-color)); color: var(--primary-text-color); }
  .small-btn { width: 36px; height: 36px; }
  .small-btn ha-icon { --mdc-icon-size: 18px; }
  .erow.tabrow { padding: 14px 0; }
  /* fixed costs on narrow cards: name, amount, frequency and delete in one line if it fits; the person below */
  .erow.tabrow.flow { gap: 8px 6px; }
  .erow.tabrow.flow .field.f-name { flex: 1 1 60px; order: 0; }
  .erow.tabrow.flow .field.f-amount { flex: 0 1 88px; order: 1; }
  .erow.tabrow.flow .field.f-freq { flex: 0 1 104px; order: 2; }
  .erow.tabrow.flow .remove { order: 3; width: 32px; }
  .erow.tabrow.flow .field.f-person { flex: 1 1 100%; order: 5; }
  .money { display: flex; align-items: center; height: 40px; box-sizing: border-box; border-radius: 8px;
    border: 1px solid var(--divider-color); background: var(--ha-card-background, var(--card-background-color)); }
  .money:focus-within { outline: 2px solid var(--primary-color); outline-offset: -1px; }
  .field .money input { flex: 1; width: 100%; height: 38px; border: 0; background: transparent; padding-right: 4px; }
  .field .money input:focus { outline: none; }
  .money .cur { padding: 0 10px 0 2px; font-size: 14px; color: var(--secondary-text-color); user-select: none; }
  /* menu next to "N Monate": an invisible select over the chevron opens the native list */
  .freq-menu { position: relative; display: flex; align-items: center; justify-content: center; width: 28px; height: 38px; margin-left: -6px;
    color: var(--secondary-text-color); flex-shrink: 0; }
  .freq-menu ha-icon { --mdc-icon-size: 20px; }
  .field .freq-menu select { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; padding: 0; border: 0; }
  .money:has(input.invalid) { background: color-mix(in srgb, var(--error-color, #db4437) 18%, transparent); border-color: var(--error-color, #db4437); }
  .field .money input.invalid { background: transparent; }
  /* narrow cards: name and delete on top, the other fields side by side as far as they fit */
  .erow.flow { display: flex; flex-wrap: wrap; }
  .erow.flow .f-name { flex: 1 1 calc(100% - 50px); order: 0; }
  .erow.flow .remove { order: 1; }
  .erow.flow .field:not(.f-name) { order: 5; flex: 1 1 92px; min-width: 0; }
  .erow.flow .field.f-amount { order: 3; }
  .erow.flow .field.f-freq { order: 4; flex: 1 1 104px; }
  .saved { display: inline-flex; align-items: center; gap: 6px; color: var(--success-color, #43a047); font-weight: 500; }
  .saved ha-icon { --mdc-icon-size: 18px; }
  .add { align-self: flex-start; display: inline-flex; align-items: center; gap: 6px; min-height: 40px; margin-top: 6px; padding: 0 12px 0 8px;
    border: 1px dashed var(--divider-color); border-radius: 20px; background: transparent; cursor: pointer; color: var(--primary-color); font-weight: 500; }
  .add ha-icon { --mdc-icon-size: 18px; }
  .footer { flex-direction: row; flex-wrap: wrap; align-items: center; gap: 10px; position: sticky; bottom: 8px; z-index: 1; }
  .save-error { flex-basis: 100%; color: var(--error-color, #db4437); font-size: 14px; }
  .btn { min-height: 44px; padding: 0 18px; border-radius: 22px; cursor: pointer; border: 1px solid var(--divider-color); background: transparent; font-weight: 500; }
  .btn.primary { background: var(--primary-color); border-color: var(--primary-color); color: var(--text-primary-color, #fff); }
  .btn[disabled] { opacity: 0.6; cursor: default; }

  /* Desktop layout */
  @container (min-width: 700px) {
    .kpis { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .kpi.main { grid-column: auto; }
    .kpi .value { font-size: 28px; }
    .kpi.small .value { font-size: 24px; }
    .columns { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .column.costs { order: 0; }
    .drow { grid-template-columns: minmax(0, 1fr) 140px 130px 120px 100px 100px; grid-template-areas: "name person freq paid month year"; padding: 10px 0; min-height: 28px; }
    .d-paid { text-align: right; font-size: 14px; }
    .d-freq { display: block; grid-area: freq; font-size: 14px; color: var(--secondary-text-color); }
    .d-year { font-size: 14px; }
    .dhead { display: grid; font-size: 11px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: var(--secondary-text-color); }
    .dhead > span { font-size: 11px; color: var(--secondary-text-color); }
    .dsum { grid-template-areas: "name person freq paid month year"; }
    .table.single .drow, .table.single .dsum { grid-template-columns: minmax(0, 1fr) 130px 120px 100px 100px; grid-template-areas: "name freq paid month year"; }
    .narrow-only { display: none; }
    .wide-only { display: inline; }
    .erow.shared { grid-template-columns: minmax(0, 1fr) 160px 120px 40px; grid-template-areas: "name to amount remove"; }
    .erow.simple { grid-template-columns: minmax(0, 1fr) 140px 40px; }
    .erow.flow { display: grid; }
    .erow.tabrow { grid-template-columns: minmax(0, 1fr) 130px 160px 140px 40px; grid-template-areas: "name amount freq person remove"; }
    .erow.tabrow.single { grid-template-columns: minmax(0, 1fr) 130px 160px 40px; grid-template-areas: "name amount freq remove"; }
    .erow.tabrow .f-name { grid-area: name; } .erow.tabrow .f-amount { grid-area: amount; } .erow.tabrow .f-freq { grid-area: freq; }
    .erow.tabrow .f-person { grid-area: person; } .erow.tabrow .remove { grid-area: remove; width: 40px; }
    .ehead.tabrow { padding-bottom: 0; }
    .erow.income { grid-template-columns: minmax(0, 1fr) 150px 150px 40px; grid-template-areas: "name gross amount remove"; }
    .erow.special { grid-template-columns: minmax(0, 1fr) 150px 40px; grid-template-areas: "name gross remove"; }
    .erow.special .remove { width: 40px; }
    .erow.income .f-amount .sr, .erow.income .f-gross .sr { position: absolute; width: 1px; height: 1px; clip: rect(0 0 0 0); overflow: hidden; }
    .ehead { display: grid; padding: 0 0 2px; border-top: 0; font-size: 12px; color: var(--secondary-text-color); }
    .ehead + .erow { border-top: 0; }
    .footer .hint { flex-basis: auto; }
    .cat-share { width: 44px; font-size: 12px; }
    .cat-value { width: 76px; }
  }
`;
