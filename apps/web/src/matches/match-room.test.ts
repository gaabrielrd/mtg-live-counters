import assert from "node:assert/strict";
import test from "node:test";
import {
  getMatchRoomGridLayout,
  getMatchRoomViewState
} from "./match-room";

test("getMatchRoomViewState returns loading while fetching", () => {
  assert.equal(
    getMatchRoomViewState({
      isLoading: true,
      errorMessage: null,
      hasSnapshot: false,
      playerCount: 0
    }),
    "loading"
  );
});

test("getMatchRoomViewState returns error when snapshot is unavailable", () => {
  assert.equal(
    getMatchRoomViewState({
      isLoading: false,
      errorMessage: "Falha",
      hasSnapshot: false,
      playerCount: 0
    }),
    "error"
  );
});

test("getMatchRoomViewState returns empty when snapshot has no players", () => {
  assert.equal(
    getMatchRoomViewState({
      isLoading: false,
      errorMessage: null,
      hasSnapshot: true,
      playerCount: 0
    }),
    "empty"
  );
});

test("getMatchRoomViewState returns ready when snapshot has players", () => {
  assert.equal(
    getMatchRoomViewState({
      isLoading: false,
      errorMessage: null,
      hasSnapshot: true,
      playerCount: 4
    }),
    "ready"
  );
});

test("getMatchRoomGridLayout returns a two-column layout for 2 players", () => {
  assert.deepEqual(getMatchRoomGridLayout(2), {
    gridClassName: "grid-cols-1 md:grid-cols-2",
    cardClassName: "min-h-[18rem]",
    maxCardWidthClassName: "max-w-none"
  });
});

test("getMatchRoomGridLayout returns a balanced layout for 3 and 4 players", () => {
  assert.equal(
    getMatchRoomGridLayout(3).gridClassName,
    "grid-cols-1 sm:grid-cols-2"
  );
  assert.equal(
    getMatchRoomGridLayout(4).gridClassName,
    "grid-cols-1 sm:grid-cols-2"
  );
});

test("getMatchRoomGridLayout returns a denser layout for 5 and 6 players", () => {
  assert.equal(
    getMatchRoomGridLayout(5).gridClassName,
    "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
  );
  assert.equal(
    getMatchRoomGridLayout(6).gridClassName,
    "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
  );
});

test("getMatchRoomGridLayout returns the densest safe layout for 7 and 8 players", () => {
  assert.equal(
    getMatchRoomGridLayout(7).gridClassName,
    "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
  );
  assert.equal(
    getMatchRoomGridLayout(8).gridClassName,
    "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
  );
});

test("getMatchRoomGridLayout falls back safely for unexpected values", () => {
  assert.equal(
    getMatchRoomGridLayout(0).gridClassName,
    "grid-cols-1 md:grid-cols-2"
  );
  assert.equal(
    getMatchRoomGridLayout(99).gridClassName,
    "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
  );
});
