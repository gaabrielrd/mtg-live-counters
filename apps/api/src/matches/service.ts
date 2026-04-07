import { randomBytes, randomUUID } from "node:crypto";
import type {
  CreateMatchRequest,
  Match,
  MatchEvent,
  MatchPlayer,
  MatchSnapshotResponse
} from "@mtg/shared";
import { ValidationError, ForbiddenError, NotFoundError } from "../shared/errors";
import { matchDomainDefaults } from "./config";

const MATCH_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export interface NormalizedCreateMatchRequest {
  initialLifeTotal: number;
  maxPlayers: number;
  isPublic: boolean;
}

export interface MatchAggregate {
  match: Match;
  players: MatchPlayer[];
  events: MatchEvent[];
}

export interface CreateMatchAggregateParams {
  ownerUserId: string;
  ownerDisplayName: string;
  requestId: string;
  now?: string;
  settings: NormalizedCreateMatchRequest;
}

export function normalizeCreateMatchRequest(
  input: CreateMatchRequest | undefined
): NormalizedCreateMatchRequest {
  if (typeof input !== "undefined") {
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      throw new ValidationError("Request body must be a JSON object");
    }
  }

  const initialLifeTotal = input?.initialLifeTotal ?? matchDomainDefaults.initialLifeTotal;
  const maxPlayers = input?.maxPlayers ?? matchDomainDefaults.defaultMaxPlayers;
  const isPublic = input?.isPublic ?? matchDomainDefaults.defaultVisibility;

  if (!Number.isInteger(initialLifeTotal) || initialLifeTotal <= 0) {
    throw new ValidationError("initialLifeTotal must be a positive integer", {
      initialLifeTotal
    });
  }

  if (!Number.isInteger(maxPlayers)) {
    throw new ValidationError("maxPlayers must be an integer", {
      maxPlayers
    });
  }

  if (
    maxPlayers < matchDomainDefaults.minAllowedPlayers ||
    maxPlayers > matchDomainDefaults.maxAllowedPlayers
  ) {
    throw new ValidationError(
      `maxPlayers must be between ${matchDomainDefaults.minAllowedPlayers} and ${matchDomainDefaults.maxAllowedPlayers}`,
      { maxPlayers }
    );
  }

  if (typeof isPublic !== "boolean") {
    throw new ValidationError("isPublic must be a boolean", {
      isPublic
    });
  }

  return {
    initialLifeTotal,
    maxPlayers,
    isPublic
  };
}

export function generateMatchCode(length = matchDomainDefaults.codeLength): string {
  const bytes = randomBytes(length);
  let code = "";

  for (const byte of bytes) {
    code += MATCH_CODE_ALPHABET[byte % MATCH_CODE_ALPHABET.length];
  }

  return code;
}

export function createMatchAggregate({
  ownerUserId,
  ownerDisplayName,
  requestId,
  now = new Date().toISOString(),
  settings
}: CreateMatchAggregateParams): MatchAggregate {
  const matchId = randomUUID();
  const playerId = randomUUID();
  const eventId = randomUUID();
  const code = generateMatchCode();
  const shareToken = randomBytes(18).toString("hex");

  const match: Match = {
    matchId,
    code,
    shareToken,
    ownerUserId,
    initialLifeTotal: settings.initialLifeTotal,
    maxPlayers: settings.maxPlayers,
    currentPlayers: 1,
    isPublic: settings.isPublic,
    status: "waiting",
    createdAt: now,
    updatedAt: now
  };

  const ownerPlayer: MatchPlayer = {
    matchId,
    playerId,
    userId: ownerUserId,
    displayNameSnapshot: ownerDisplayName,
    currentLifeTotal: settings.initialLifeTotal,
    joinedAt: now,
    connectionState: "disconnected",
    connectionCount: 0,
    seat: 1,
    isOwner: true
  };

  const createdEvent: MatchEvent = {
    matchId,
    eventId,
    type: "match_created",
    actorUserId: ownerUserId,
    targetUserId: ownerUserId,
    targetPlayerId: playerId,
    requestId,
    occurredAt: now,
    payload: {
      code,
      shareToken,
      initialLifeTotal: settings.initialLifeTotal,
      maxPlayers: settings.maxPlayers,
      isPublic: settings.isPublic
    }
  };

  return {
    match,
    players: [ownerPlayer],
    events: [createdEvent]
  };
}

export function sortMatchPlayers<TPlayer extends Pick<MatchPlayer, "seat" | "joinedAt">>(
  players: TPlayer[]
): TPlayer[] {
  return [...players].sort((left, right) => {
    const leftSeat = left.seat ?? Number.MAX_SAFE_INTEGER;
    const rightSeat = right.seat ?? Number.MAX_SAFE_INTEGER;

    if (leftSeat !== rightSeat) {
      return leftSeat - rightSeat;
    }

    return left.joinedAt.localeCompare(right.joinedAt);
  });
}

export function toMatchSnapshotResponse(
  aggregate: Pick<MatchAggregate, "match" | "players">,
  viewerUserId: string
): MatchSnapshotResponse {
  const sortedPlayers = sortMatchPlayers(aggregate.players);
  const viewer = sortedPlayers.find((player) => player.userId === viewerUserId);

  if (!viewer) {
    throw new ForbiddenError("Authenticated user does not belong to this match", {
      viewerUserId,
      matchId: aggregate.match.matchId
    });
  }

  return {
    match: {
      matchId: aggregate.match.matchId,
      code: aggregate.match.code,
      shareToken: aggregate.match.shareToken,
      ownerUserId: aggregate.match.ownerUserId,
      initialLifeTotal: aggregate.match.initialLifeTotal,
      maxPlayers: aggregate.match.maxPlayers,
      currentPlayers: aggregate.match.currentPlayers,
      isPublic: aggregate.match.isPublic,
      status: aggregate.match.status,
      createdAt: aggregate.match.createdAt,
      updatedAt: aggregate.match.updatedAt
    },
    players: sortedPlayers.map((player) => ({
      playerId: player.playerId,
      userId: player.userId,
      displayNameSnapshot: player.displayNameSnapshot,
      currentLifeTotal: player.currentLifeTotal,
      joinedAt: player.joinedAt,
      connectionState: player.connectionState,
      connectionCount: player.connectionCount,
      seat: player.seat,
      isOwner: player.isOwner
    })),
    viewerPlayerId: viewer.playerId
  };
}

export function assertMatchAggregateExists(
  aggregate: Pick<MatchAggregate, "match" | "players"> | null,
  matchId: string
): Pick<MatchAggregate, "match" | "players"> {
  if (!aggregate) {
    throw new NotFoundError(`Match ${matchId} not found`);
  }

  return aggregate;
}
