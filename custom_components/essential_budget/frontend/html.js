/* Small helpers for building HTML strings. */

export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export const errorText = (e) => e?.message || String(e);

/** A round button with only an icon; the label is its tooltip and its name for screen readers. */
export const iconButton = ({ action, icon, label, cls = "", data = {}, attrs = "" }) => {
  const dataAttrs = Object.entries(data)
    .map(([key, value]) => ` data-${key}="${esc(value)}"`)
    .join("");
  return `<button class="icon-btn ${cls}" data-action="${action}"${dataAttrs} ${attrs} title="${esc(label)}" aria-label="${esc(label)}"><ha-icon icon="${icon}"></ha-icon></button>`;
};

/** Heading of a box: icon, title, optionally a value at the right and a hint below. */
export const sectionHead = (icon, title, value = "", hint = "") =>
  `<div class="section-head"><ha-icon icon="${icon}"></ha-icon><h2>${esc(title)}</h2>${value ? `<span class="head-value">${value}</span>` : ""}</div>${
    hint ? `<div class="hint">${esc(hint)}</div>` : ""
  }`;

/** A number of the view: wrapped so that it can be blurred while the numbers are hidden. */
export const numSpan = (text) => `<span class="num">${esc(text)}</span>`;
