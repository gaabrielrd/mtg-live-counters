import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_INITIAL_LIFE_TOTAL, DEFAULT_MAX_PLAYERS } from "@mtg/shared";
import {
  getCreateMatchErrorMessage,
  hasCreateMatchErrors,
  validateCreateMatchForm
} from "./create-match";

test("validateCreateMatchForm accepts explicit domain defaults", () => {
  const result = validateCreateMatchForm({
    initialLifeTotal: String(DEFAULT_INITIAL_LIFE_TOTAL),
    maxPlayers: String(DEFAULT_MAX_PLAYERS),
    isPublic: false
  });

  assert.equal(hasCreateMatchErrors(result.errors), false);
  assert.deepEqual(result.normalizedValues, {
    initialLifeTotal: DEFAULT_INITIAL_LIFE_TOTAL,
    maxPlayers: DEFAULT_MAX_PLAYERS,
    isPublic: false
  });
});

test("validateCreateMatchForm rejects maxPlayers above the supported limit", () => {
  const result = validateCreateMatchForm({
    initialLifeTotal: "40",
    maxPlayers: "9",
    isPublic: false
  });

  assert.equal(
    result.errors.maxPlayers,
    "O limite maximo permitido e 8 jogadores."
  );
  assert.equal(result.normalizedValues, undefined);
});

test("validateCreateMatchForm rejects maxPlayers below the supported minimum", () => {
  const result = validateCreateMatchForm({
    initialLifeTotal: "40",
    maxPlayers: "1",
    isPublic: false
  });

  assert.equal(
    result.errors.maxPlayers,
    "A partida precisa aceitar pelo menos 2 jogadores."
  );
});

test("validateCreateMatchForm rejects non-integer values", () => {
  const result = validateCreateMatchForm({
    initialLifeTotal: "40.5",
    maxPlayers: "4.2",
    isPublic: true
  });

  assert.equal(
    result.errors.initialLifeTotal,
    "Use um numero inteiro para a vida inicial."
  );
  assert.equal(
    result.errors.maxPlayers,
    "Use um numero inteiro para o limite de jogadores."
  );
});

test("validateCreateMatchForm rejects non-positive initialLifeTotal", () => {
  const result = validateCreateMatchForm({
    initialLifeTotal: "0",
    maxPlayers: "4",
    isPublic: false
  });

  assert.equal(
    result.errors.initialLifeTotal,
    "A vida inicial precisa ser um inteiro positivo."
  );
});

test("getCreateMatchErrorMessage reuses backend validation messages", () => {
  assert.equal(
    getCreateMatchErrorMessage({
      code: "VALIDATION_ERROR",
      message: "maxPlayers must be between 2 and 8"
    }),
    "maxPlayers must be between 2 and 8"
  );
});
