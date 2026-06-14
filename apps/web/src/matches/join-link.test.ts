import assert from "node:assert/strict";
import test from "node:test";
import { DOMAIN_ERROR_CODES } from "@mtg/shared";
import { getJoinLinkErrorMessage, getJoinLinkRedirectMatchId } from "./join-link";

test("getJoinLinkErrorMessage maps invalid link errors", () => {
  const error = {
    message: "Match link is invalid",
    code: DOMAIN_ERROR_CODES.MATCH_LINK_INVALID
  };

  assert.equal(
    getJoinLinkErrorMessage(error),
    "Esse link de partida nao e valido ou ja expirou."
  );
});

test("getJoinLinkErrorMessage maps full match errors", () => {
  const error = {
    message: "Match has no open seats",
    code: DOMAIN_ERROR_CODES.MATCH_FULL
  };

  assert.equal(getJoinLinkErrorMessage(error), "Essa partida ja esta cheia.");
});

test("getJoinLinkRedirectMatchId extracts the destination for already-joined users", () => {
  const error = {
    message: "Authenticated user already belongs to this match",
    code: DOMAIN_ERROR_CODES.ALREADY_IN_MATCH,
    details: {
      matchId: "match-123"
    }
  };

  assert.equal(getJoinLinkRedirectMatchId(error), "match-123");
});
