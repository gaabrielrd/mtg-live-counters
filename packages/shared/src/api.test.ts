import assert from "node:assert/strict";
import test from "node:test";
import {
  DOMAIN_ERROR_CODES,
  MATCH_CODE_MAX_LENGTH,
  MATCH_CODE_MIN_LENGTH,
  normalizeMatchCode,
  validateAndNormalizeMatchCode
} from "./api";

test("normalizeMatchCode trims and uppercases input", () => {
  assert.equal(normalizeMatchCode("  aB12  "), "AB12");
});

test("validateAndNormalizeMatchCode rejects short codes", () => {
  const input = "a".repeat(MATCH_CODE_MIN_LENGTH - 1);
  const result = validateAndNormalizeMatchCode(input);

  assert.equal(result.isValid, false);
  assert.equal(result.reason, DOMAIN_ERROR_CODES.MATCH_CODE_INVALID);
});

test("validateAndNormalizeMatchCode rejects long codes", () => {
  const input = "a".repeat(MATCH_CODE_MAX_LENGTH + 1);
  const result = validateAndNormalizeMatchCode(input);

  assert.equal(result.isValid, false);
  assert.equal(result.reason, DOMAIN_ERROR_CODES.MATCH_CODE_INVALID);
});

test("validateAndNormalizeMatchCode accepts codes in configured range", () => {
  const input = ` ${"a".repeat(MATCH_CODE_MIN_LENGTH)} `;
  const result = validateAndNormalizeMatchCode(input);

  assert.equal(result.isValid, true);
  assert.equal(result.normalizedCode, "A".repeat(MATCH_CODE_MIN_LENGTH));
});

test("DOMAIN_ERROR_CODES exposes join-match domain errors", () => {
  assert.equal(DOMAIN_ERROR_CODES.MATCH_CODE_INVALID, "MATCH_CODE_INVALID");
  assert.equal(DOMAIN_ERROR_CODES.MATCH_FULL, "MATCH_FULL");
  assert.equal(DOMAIN_ERROR_CODES.ALREADY_IN_MATCH, "ALREADY_IN_MATCH");
  assert.equal(DOMAIN_ERROR_CODES.UNAUTHORIZED, "UNAUTHORIZED");
});
