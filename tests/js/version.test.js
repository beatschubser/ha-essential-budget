import assert from "node:assert/strict";
import { test } from "node:test";

import { compareVersions, updateState } from "../../custom_components/essential_budget/frontend/version.js";

test("version order", () => {
  const ordered = ["0.1.0", "0.2.0-beta.1", "0.2.0-beta.2", "0.2.0-beta.10", "0.2.0", "0.2.9", "0.10.0", "1.0.0"];
  for (let i = 1; i < ordered.length; i++) {
    assert.ok(compareVersions(ordered[i - 1], ordered[i]) < 0, `${ordered[i - 1]} < ${ordered[i]}`);
    assert.ok(compareVersions(ordered[i], ordered[i - 1]) > 0);
  }
  assert.equal(compareVersions("0.2.0", "0.2.0"), 0);
});

test("hint after updates", () => {
  assert.equal(updateState("0.3.0", "0.3.0"), null);
  assert.equal(updateState("0.2.9", "0.3.0"), "restart"); // the card is newer: Home Assistant still runs the old integration
  assert.equal(updateState("0.3.0", "0.2.9"), "reload"); // the page still runs old card code
  assert.equal(updateState("0.3.0", null), null); // card added by hand without ?v=
  assert.equal(updateState(undefined, "0.3.0"), null); // integration not asked yet
});
