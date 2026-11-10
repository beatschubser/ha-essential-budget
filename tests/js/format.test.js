import assert from "node:assert/strict";
import { test } from "node:test";

import { formatter, translator } from "../../custom_components/essential_budget/frontend/format.js";
import { TEXTS } from "../../custom_components/essential_budget/frontend/texts.js";
import { english, german } from "./sample.js";

test("texts in the language of the user, English as fallback", () => {
  assert.equal(translator(german)("fixed_costs"), "Fixkosten");
  assert.equal(translator({ language: "de-CH" }).lang, "de");
  assert.equal(translator({ locale: { language: "xx" } })("fixed_costs"), "Fixed costs");
  assert.equal(translator(english)("person_n", { n: 2 }), "Person 2");
  assert.equal(translator(english)("no_such_key"), "no_such_key");
});

test("frequencies", () => {
  const t = translator(english);
  assert.equal(t.freq(3), "quarterly");
  assert.equal(t.freq(4), "every 4 months");
});

test("all languages have the same texts", () => {
  const keys = (texts) => [...Object.keys(texts), ...Object.keys(texts.freq).map((k) => `freq.${k}`)].sort();
  for (const lang of Object.keys(TEXTS)) assert.deepEqual(keys(TEXTS[lang]), keys(TEXTS.en), lang);
});

test("money and amounts for text fields", () => {
  const de = formatter(german);
  assert.equal(de.money(1480.5).replace(/\s/g, " "), "1.481 €");
  assert.equal(de.symbol, "€");
  assert.equal(de.amountText(1480.5), "1480,50");
  assert.equal(formatter(english).amountText(1480.5), "1480.50");
  assert.equal(formatter({ locale: { language: "en" }, config: {} }).currency, "EUR"); // no currency set
  assert.equal(formatter({ locale: { language: "en" }, config: { currency: "usd" } }).symbol, "$");
});

test("every text that is used exists, and every text is used", async () => {
  const { readdirSync, readFileSync } = await import("node:fs");
  const folder = new URL("../../custom_components/essential_budget/frontend/", import.meta.url);
  const source = readdirSync(folder)
    .filter((name) => name.endsWith(".js") && name !== "texts.js")
    .map((name) => readFileSync(new URL(name, folder), "utf8"))
    .join("\n");
  const keys = Object.keys(TEXTS.en).filter((key) => key !== "freq");
  const asked = [...source.matchAll(/\bt\("(\w+)"/g)].map((m) => m[1]);
  assert.deepEqual([...new Set(asked.filter((key) => !keys.includes(key)))], [], "asked for but missing");
  // keys also appear as plain strings, e.g. t(open ? "collapse" : "expand") or "name:item"
  assert.deepEqual(
    keys.filter((key) => !new RegExp(`["':]${key}["']`).test(source)),
    [],
    "never used",
  );
});
