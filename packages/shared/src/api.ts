import type { Match, MatchPlayer } from "./domain";

export interface CreateMatchRequest {
  initialLifeTotal?: number;
  maxPlayers?: number;
  isPublic?: boolean;
}

export type MatchSnapshot = Pick<
  Match,
  | "matchId"
  | "code"
  | "shareToken"
  | "ownerUserId"
  | "initialLifeTotal"
  | "maxPlayers"
  | "currentPlayers"
  | "isPublic"
  | "status"
  | "createdAt"
  | "updatedAt"
>;

export type MatchSnapshotPlayer = Pick<
  MatchPlayer,
  | "playerId"
  | "userId"
  | "displayNameSnapshot"
  | "currentLifeTotal"
  | "joinedAt"
  | "connectionState"
  | "connectionCount"
  | "seat"
  | "isOwner"
>;

export interface MatchSnapshotResponse {
  match: MatchSnapshot;
  players: MatchSnapshotPlayer[];
  viewerPlayerId: string;
}
