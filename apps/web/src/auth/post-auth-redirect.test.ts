import assert from "node:assert/strict";
import test from "node:test";
import { normalizePostAuthRedirectPath } from "./post-auth-redirect";

test("normalizePostAuthRedirectPath accepts local app paths", () => {
  assert.equal(
    normalizePostAuthRedirectPath(" /join/share-token?from=invite "),
    "/join/share-token?from=invite"
  );
});

test("normalizePostAuthRedirectPath rejects empty paths", () => {
  assert.equal(normalizePostAuthRedirectPath("   "), null);
});

test("normalizePostAuthRedirectPath rejects non-local paths", () => {
  assert.equal(normalizePostAuthRedirectPath("https://example.com"), null);
  assert.equal(normalizePostAuthRedirectPath("//example.com"), null);
});
