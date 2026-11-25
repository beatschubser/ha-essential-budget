/* Language, texts and number formats, all from the Home Assistant settings of the user. */

import { MONTH_END, dueMonths } from "./model.js";
import { TEXTS } from "./texts.js";

const FALLBACK_LANGUAGE = "en";
const FALLBACK_CURRENCY = "EUR"; // if Home Assistant has no currency set

const languageTag = (hass) => String(hass?.locale?.language || hass?.language || FALLBACK_LANGUAGE).replace("_", "-");

/** Locale for number formats, e.g. "de" or "en-GB". */
export const localeOf = (hass) => {
  const tag = languageTag(hass);
  try {
    return Intl.NumberFormat.supportedLocalesOf([tag]).length ? tag : FALLBACK_LANGUAGE;
  } catch (e) {
    return FALLBACK_LANGUAGE;
  }
};

const translators = new Map();

/**
 * The texts in the language of the user: t("person_n", { n: 2 }) = "Person 2".
 * Texts that are missing in a language come from English. t.freq(3) = "quarterly", t.lang = "de".
 */
export const translator = (hass) => {
  const tag = languageTag(hass).toLowerCase().split("-")[0];
  const lang = TEXTS[tag] ? tag : FALLBACK_LANGUAGE;
  if (!translators.has(lang)) {
    const english = TEXTS[FALLBACK_LANGUAGE];
    const texts = { ...english, ...TEXTS[lang], freq: { ...english.freq, ...TEXTS[lang].freq } };
    const fill = (text, vars) => String(text).replace(/\{(\w+)\}/g, (_, name) => vars[name] ?? "");
    const t = (key, vars = {}) => fill(texts[key] ?? key, vars);
    t.freq = (months) => texts.freq[months] ?? fill(texts.freq.n, { n: months });
    t.lang = lang;
    translators.set(lang, t);
  }
  return translators.get(lang);
};

const formatters = new Map();

/**
 * Number formats for the locale and currency of Home Assistant (Settings > System > General):
 * money(1480.5) = "1.481 €" (whole units), symbol = "€", amountText(1480.5) = "1480,50" (for text fields).
 */
export const formatter = (hass) => {
  const locale = localeOf(hass);
  const currency = String(hass?.config?.currency || FALLBACK_CURRENCY)
    .trim()
    .toUpperCase();
  const key = `${locale}|${currency}`;
  if (!formatters.has(key)) {
    let money = (value) => `${Math.round(value)} ${currency}`;
    let symbol = currency;
    try {
      const whole = new Intl.NumberFormat(locale, { style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: 0 });
      money = (value) => whole.format(value);
      symbol = whole.formatToParts(0).find((part) => part.type === "currency")?.value || currency;
    } catch (e) {
      /* currency unknown to the browser: the code is shown instead */
    }
    const plain = new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: false });
    const monthShort = new Intl.DateTimeFormat(locale, { month: "short" });
    const monthLong = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" });
    const day = new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric", month: "short" });
    formatters.set(key, {
      locale,
      currency,
      money,
      symbol,
      amountText: (value) => plain.format(value),
      // dates: month(2) = "Feb", monthYear(2027, 1) = "January 2027", date(d) = "Mon, Feb 1"
      month: (month) => monthShort.format(new Date(2000, month - 1, 1)),
      monthYear: (year, month) => monthLong.format(new Date(year, month - 1, 1)),
      date: (date) => day.format(date),
    });
  }
  return formatters.get(key);
};

/** The debit date of a fixed cost as text: "15." (monthly), "15. Feb, May" or "" without (complete) date. */
export const dueText = (cost, t, fmt) => {
  const months = dueMonths(cost);
  if (!months) return "";
  const day = cost.due_day === MONTH_END ? t("month_end") : t("due_day_n", { d: cost.due_day });
  if (months.length === 12) return day;
  return t("due_in", { day, months: months.map((month) => fmt.month(month)).join(", ") });
};
