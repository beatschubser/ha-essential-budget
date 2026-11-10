/*
 * After an update the page may still run old card code, or Home Assistant the old integration.
 * The card compares its own version with the one of the integration and shows a hint.
 */

import { esc } from "./html.js";

// The card's version is the ?v= of its own address (set by the integration from manifest.json);
// null if it was added by hand without it, then nothing is compared.
let ownVersion = null;
export const setOwnVersion = (version) => {
  ownVersion = version || null;
};

/** Negative if version a is older than b. "0.2.0-beta.1" is older than "0.2.0". */
export const compareVersions = (a, b) => {
  const parse = (v) => {
    const [main, pre = ""] = String(v).split("-");
    return { numbers: main.split(".").map(Number), pre };
  };
  const x = parse(a);
  const y = parse(b);
  for (let i = 0; i < 3; i++) if ((x.numbers[i] || 0) !== (y.numbers[i] || 0)) return (x.numbers[i] || 0) - (y.numbers[i] || 0);
  if (x.pre === y.pre) return 0;
  if (!x.pre || !y.pre) return x.pre ? -1 : 1;
  return x.pre.localeCompare(y.pre, "en", { numeric: true });
};

// A reload that did not help (cached code) is not offered again for the same version
const reloadKey = (version) => `eb-reloaded-${version}`;
const sessionGet = (key) => {
  try {
    return sessionStorage.getItem(key);
  } catch (e) {
    return null;
  }
};
const sessionSet = (key, value) => {
  try {
    sessionStorage.setItem(key, value);
  } catch (e) {
    /* storage blocked: nothing to remember */
  }
};

/**
 * What to tell the user for the version of the running integration:
 * "restart" = update downloaded but Home Assistant still runs the old integration,
 * "reload" = the page runs old card code, null = nothing.
 */
export const updateState = (integrationVersion, cardVersion = ownVersion) => {
  if (!cardVersion || !integrationVersion || integrationVersion === cardVersion) return null;
  if (compareVersions(integrationVersion, cardVersion) < 0) return "restart";
  return sessionGet(reloadKey(integrationVersion)) ? null : "reload";
};

export const reloadPage = (integrationVersion) => {
  sessionSet(reloadKey(integrationVersion), "1");
  location.reload();
};

/** The hint for an update state (a button for "reload"). */
export const renderUpdate = (state, t) => {
  if (state === "reload") return `<button class="update" data-action="reload">${esc(t("update_available"))}</button>`;
  if (state === "restart") return `<div class="update">${esc(t("restart_needed"))}</div>`;
  return "";
};
