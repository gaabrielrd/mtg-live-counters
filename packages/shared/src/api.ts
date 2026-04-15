import type { Match, MatchPlayer } from "./domain";

export const MATCH_CODE_MIN_LENGTH = 4;
export const MATCH_CODE_MAX_LENGTH = 12;

export const DOMAIN_ERROR_CODES = {
  MATCH_CODE_INVALID: "MATCH_CODE_INVALID",
  MATCH_FULL: "MATCH_FULL",
  ALREADY_IN_MATCH: "ALREADY_IN_MATCH",
  UNAUTHORIZED: "UNAUTHORIZED"
} as const;

export type DomainErrorCode = (typeof DOMAIN_ERROR_CODES)[keyof typeof DOMAIN_ERROR_CODES];

export interface CreateMatchRequest {
  initialLifeTotal?: number;
  maxPlayers?: number;
  isPublic?: boolean;
}

export interface JoinMatchByCodeRequest {
  code: string;
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

export type JoinMatchByCodeResponse = MatchSnapshotResponse;

export interface MatchCodeValidationResult {
  normalizedCode: string;
  isValid: boolean;
  reason?: DomainErrorCode;
}

export function normalizeMatchCode(code: string): string {
  return code.trim().toUpperCase();
}

export function validateAndNormalizeMatchCode(code: string): MatchCodeValidationResult {
  const normalizedCode = normalizeMatchCode(code);

  if (
    normalizedCode.length < MATCH_CODE_MIN_LENGTH ||
    normalizedCode.length > MATCH_CODE_MAX_LENGTH
  ) {
    return {
      normalizedCode,
      isValid: false,
      reason: DOMAIN_ERROR_CODES.MATCH_CODE_INVALID
    };
  }

  return {
    normalizedCode,
    isValid: true
  };
}
