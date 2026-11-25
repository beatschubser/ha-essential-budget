/*
 * Unsaved changes are kept in the browser while editing, so that they survive leaving the dashboard view
 * or reloading. They are only offered again while the saved budget is still the one they started from.
 */

const KEY = "essential-budget-draft";

const read = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "null");
  } catch (e) {
    return null; // storage blocked or broken: nothing kept
  }
};

/** Keeps the draft together with the saved budget it started from. */
export const keepDraft = (saved, draft) => {
  try {
    localStorage.setItem(KEY, JSON.stringify({ saved: JSON.stringify(saved), draft }));
  } catch (e) {
    /* storage blocked or full: the draft is only lost on leaving */
  }
};

/** The kept draft for this saved budget, or null (a draft of an older budget is dropped). */
export const keptDraft = (saved) => {
  const kept = read();
  if (!kept) return null;
  if (kept.saved === JSON.stringify(saved)) return kept.draft;
  dropDraft();
  return null;
};

export const dropDraft = () => {
  try {
    localStorage.removeItem(KEY);
  } catch (e) {
    /* nothing kept */
  }
};
