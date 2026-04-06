export type AuthProvider = "cognito" | "google";
export type UserStatus = "active" | "disabled";

export type MatchStatus = "waiting" | "active" | "finished" | "cancelled";
export type MatchPlayerConnectionState = "connected" | "disconnected";

export type MatchEventType =
  | "match_created"
  | "player_joined"
  | "life_total_set"
  | "life_total_delta_applied"
  | "player_connected"
  | "player_disconnected";

export interface User {
  userId: string;
  displayName: string;
  email: string;
  provider: AuthProvider;
  providerSubject: string;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface Match {
  matchId: string;
  code: string;
  shareToken: string;
  ownerUserId: string;
  initialLifeTotal: number;
  maxPlayers: number;
  currentPlayers: number;
  isPublic: boolean;
  status: MatchStatus;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  endedAt?: string;
}

export interface MatchPlayer {
  matchId: string;
  playerId: string;
  userId: string;
  displayNameSnapshot: string;
  currentLifeTotal: number;
  joinedAt: string;
  lastSeenAt?: string;
  connectionState: MatchPlayerConnectionState;
  connectionCount: number;
  seat?: number;
  isOwner: boolean;
}

export interface MatchEvent {
  matchId: string;
  eventId: string;
  type: MatchEventType;
  actorUserId: string;
  targetUserId?: string;
  targetPlayerId?: string;
  payload: Record<string, unknown>;
  requestId?: string;
  occurredAt: string;
}
