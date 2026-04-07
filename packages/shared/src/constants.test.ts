import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_INITIAL_LIFE_TOTAL,
  DEFAULT_MAX_PLAYERS,
  MAX_MATCH_PLAYERS,
  MIN_MATCH_PLAYERS
} from "./constants";

test("match constants expose the documented defaults and limits", () => {
  assert.equal(DEFAULT_INITIAL_LIFE_TOTAL, 40);
  assert.equal(DEFAULT_MAX_PLAYERS, 4);
  assert.equal(MIN_MATCH_PLAYERS, 2);
  assert.equal(MAX_MATCH_PLAYERS, 8);
});
