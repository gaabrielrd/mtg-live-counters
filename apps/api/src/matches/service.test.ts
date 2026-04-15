import assert from "node:assert/strict";
import test from "node:test";
import { DOMAIN_ERROR_CODES } from "@mtg/shared";
import { AppError, ForbiddenError, ValidationError } from "../shared/errors";
import { toMatchItem, toMatchPlayerItem } from "./dynamo-items";
import {
  createJoinMatchAggregate,
  createMatchAggregate,
  normalizeJoinMatchRequest,
  normalizeCreateMatchRequest,
  toMatchSnapshotResponse
} from "./service";

test("normalizeCreateMatchRequest applies defaults when the body is omitted", () => {
  assert.deepEqual(normalizeCreateMatchRequest(undefined), {
    initialLifeTotal: 40,
    maxPlayers: 4,
    isPublic: false
  });
});

test("normalizeCreateMatchRequest rejects maxPlayers above the supported limit", () => {
  assert.throws(
    () => normalizeCreateMatchRequest({ maxPlayers: 9 }),
    ValidationError
  );
});

test("normalizeCreateMatchRequest rejects maxPlayers below the supported minimum", () => {
  assert.throws(
    () => normalizeCreateMatchRequest({ maxPlayers: 1 }),
    ValidationError
  );
});

test("normalizeCreateMatchRequest rejects invalid initialLifeTotal", () => {
  assert.throws(
    () => normalizeCreateMatchRequest({ initialLifeTotal: 0 }),
    ValidationError
  );
});

test("normalizeJoinMatchRequest trims and uppercases a valid match code", () => {
  assert.equal(normalizeJoinMatchRequest({ code: " ab12 " }), "AB12");
});

test("normalizeJoinMatchRequest rejects invalid match codes", () => {
  assert.throws(() => normalizeJoinMatchRequest({ code: "abc" }), (error) => {
    assert.ok(error instanceof AppError);
    assert.equal(error.code, DOMAIN_ERROR_CODES.MATCH_CODE_INVALID);
    return true;
  });
});

test("createMatchAggregate makes the creator the first player with the initial life total", () => {
  const aggregate = createMatchAggregate({
    ownerUserId: "user-123",
    ownerDisplayName: "player@example.com",
    requestId: "req-1",
    now: "2026-04-07T12:00:00.000Z",
    settings: {
      initialLifeTotal: 35,
      maxPlayers: 6,
      isPublic: true
    }
  });

  assert.equal(aggregate.match.status, "waiting");
  assert.equal(aggregate.match.currentPlayers, 1);
  assert.equal(aggregate.match.initialLifeTotal, 35);
  assert.equal(aggregate.players.length, 1);
  assert.equal(aggregate.players[0]?.userId, "user-123");
  assert.equal(aggregate.players[0]?.displayNameSnapshot, "player@example.com");
  assert.equal(aggregate.players[0]?.currentLifeTotal, 35);
  assert.equal(aggregate.players[0]?.seat, 1);
  assert.equal(aggregate.players[0]?.isOwner, true);
  assert.equal(aggregate.events[0]?.type, "match_created");
});

test("createJoinMatchAggregate adds a player with the match default life total and next seat", () => {
  const aggregate = createMatchAggregate({
    ownerUserId: "user-123",
    ownerDisplayName: "player@example.com",
    requestId: "req-1",
    now: "2026-04-07T12:00:00.000Z",
    settings: {
      initialLifeTotal: 35,
      maxPlayers: 4,
      isPublic: true
    }
  });

  const joinedAggregate = createJoinMatchAggregate({
    aggregate,
    userId: "user-456",
    displayName: "friend@example.com",
    requestId: "req-2",
    now: "2026-04-07T12:05:00.000Z"
  });

  assert.equal(joinedAggregate.match.currentPlayers, 2);
  assert.equal(joinedAggregate.match.updatedAt, "2026-04-07T12:05:00.000Z");
  assert.equal(joinedAggregate.players.length, 2);
  assert.equal(joinedAggregate.players[1]?.currentLifeTotal, 35);
  assert.equal(joinedAggregate.players[1]?.seat, 2);
  assert.equal(joinedAggregate.players[1]?.isOwner, false);
  assert.equal(joinedAggregate.events[1]?.type, "player_joined");
});

test("createJoinMatchAggregate rejects duplicate participants", () => {
  const aggregate = createMatchAggregate({
    ownerUserId: "user-123",
    ownerDisplayName: "player@example.com",
    requestId: "req-1",
    now: "2026-04-07T12:00:00.000Z",
    settings: {
      initialLifeTotal: 40,
      maxPlayers: 4,
      isPublic: false
    }
  });

  assert.throws(
    () =>
      createJoinMatchAggregate({
        aggregate,
        userId: "user-123",
        displayName: "player@example.com",
        requestId: "req-2"
      }),
    (error) => {
      assert.ok(error instanceof AppError);
      assert.equal(error.code, DOMAIN_ERROR_CODES.ALREADY_IN_MATCH);
      return true;
    }
  );
});

test("createJoinMatchAggregate rejects full matches", () => {
  const aggregate = createJoinMatchAggregate({
    aggregate: createMatchAggregate({
      ownerUserId: "user-123",
      ownerDisplayName: "player@example.com",
      requestId: "req-1",
      now: "2026-04-07T12:00:00.000Z",
      settings: {
        initialLifeTotal: 40,
        maxPlayers: 2,
        isPublic: true
      }
    }),
    userId: "user-456",
    displayName: "friend@example.com",
    requestId: "req-2",
    now: "2026-04-07T12:05:00.000Z"
  });

  assert.throws(
    () =>
      createJoinMatchAggregate({
        aggregate,
        userId: "user-789",
        displayName: "third@example.com",
        requestId: "req-3"
      }),
    (error) => {
      assert.ok(error instanceof AppError);
      assert.equal(error.code, DOMAIN_ERROR_CODES.MATCH_FULL);
      return true;
    }
  );
});

test("toMatchSnapshotResponse rejects viewers who do not belong to the match", () => {
  const aggregate = createMatchAggregate({
    ownerUserId: "user-123",
    ownerDisplayName: "player@example.com",
    requestId: "req-1",
    now: "2026-04-07T12:00:00.000Z",
    settings: {
      initialLifeTotal: 40,
      maxPlayers: 4,
      isPublic: false
    }
  });

  assert.throws(
    () => toMatchSnapshotResponse(aggregate, "user-999"),
    ForbiddenError
  );
});

test("match dynamo items keep public open matches on the listing index and link players to the user index", () => {
  const aggregate = createMatchAggregate({
    ownerUserId: "user-123",
    ownerDisplayName: "player@example.com",
    requestId: "req-1",
    now: "2026-04-07T12:00:00.000Z",
    settings: {
      initialLifeTotal: 40,
      maxPlayers: 4,
      isPublic: true
    }
  });

  const matchItem = toMatchItem(aggregate.match);
  const playerItem = toMatchPlayerItem(aggregate.players[0]!);

  assert.equal(matchItem.GSI3PK, "PUBLIC#OPEN");
  assert.ok(matchItem.GSI3SK?.includes(aggregate.match.matchId));
  assert.equal(playerItem.GSI4PK, "USER#user-123");
  assert.ok(playerItem.GSI4SK?.includes(aggregate.match.matchId));
});
