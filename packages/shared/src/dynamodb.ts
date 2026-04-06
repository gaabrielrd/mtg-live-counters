import type {
  Match,
  MatchEvent,
  MatchPlayer,
  MatchStatus,
  MatchPlayerConnectionState,
  User,
} from "./domain";
import {
  PUBLIC_OPEN_MATCHES_PARTITION,
} from "./constants";

export type EntityType = "USER" | "MATCH" | "MATCH_PLAYER" | "MATCH_EVENT" | "CONNECTION";

export interface DynamoDbKeyedItem {
  PK: string;
  SK: string;
  entityType: EntityType;
  GSI1PK?: string;
  GSI1SK?: string;
  GSI2PK?: string;
  GSI2SK?: string;
  GSI3PK?: string;
  GSI3SK?: string;
  GSI4PK?: string;
  GSI4SK?: string;
}

export interface UserItem extends DynamoDbKeyedItem, User {
  entityType: "USER";
}

export interface MatchItem extends DynamoDbKeyedItem, Match {
  entityType: "MATCH";
}

export interface MatchPlayerItem extends DynamoDbKeyedItem, MatchPlayer {
  entityType: "MATCH_PLAYER";
}

export interface MatchEventItem extends DynamoDbKeyedItem, MatchEvent {
  entityType: "MATCH_EVENT";
}

export interface ConnectionItem extends DynamoDbKeyedItem {
  entityType: "CONNECTION";
  matchId: string;
  userId: string;
  playerId: string;
  connectionId: string;
  connectedAt: string;
  lastSeenAt?: string;
  connectionState: MatchPlayerConnectionState;
}

export type GameTableItem =
  | UserItem
  | MatchItem
  | MatchPlayerItem
  | MatchEventItem
  | ConnectionItem;

export function getMatchPartitionKey(matchId: string): string {
  return `MATCH#${matchId}`;
}

export function getMatchSortKey(): string {
  return "MATCH";
}

export function getMatchPlayerSortKey(userId: string): string {
  return `PLAYER#${userId}`;
}

export function getMatchEventSortKey(occurredAt: string, eventId: string): string {
  return `EVENT#${occurredAt}#${eventId}`;
}

export function getConnectionSortKey(connectionId: string): string {
  return `CONNECTION#${connectionId}`;
}

export function getUserPartitionKey(userId: string): string {
  return `USER#${userId}`;
}

export function getUserSortKey(): string {
  return "PROFILE";
}

export function getMatchByCodeGsiPk(code: string): string {
  return `CODE#${code}`;
}

export function getMatchByCodeGsiSk(): string {
  return "MATCH";
}

export function getMatchByShareTokenGsiPk(shareToken: string): string {
  return `SHARE#${shareToken}`;
}

export function getMatchByShareTokenGsiSk(): string {
  return "MATCH";
}

export function getPublicOpenMatchesGsiPk(): string {
  return PUBLIC_OPEN_MATCHES_PARTITION;
}

export function getPublicOpenMatchesGsiSk(createdAt: string, matchId: string): string {
  return `${createdAt}#${matchId}`;
}

export function getMatchesByUserGsiPk(userId: string): string {
  return `USER#${userId}`;
}

export function getMatchesByUserGsiSk(joinedAt: string, matchId: string): string {
  return `MATCH#${joinedAt}#${matchId}`;
}

export function isListablePublicMatch(match: Pick<Match, "isPublic" | "status" | "currentPlayers" | "maxPlayers">): boolean {
  return (
    match.isPublic &&
    isOpenMatchStatus(match.status) &&
    match.currentPlayers < match.maxPlayers
  );
}

export function isOpenMatchStatus(status: MatchStatus): boolean {
  return status === "waiting";
}
