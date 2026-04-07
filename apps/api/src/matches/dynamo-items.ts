import type { Match, MatchEvent, MatchPlayer, MatchItem, MatchEventItem, MatchPlayerItem } from "@mtg/shared";
import {
  getMatchByCodeGsiPk,
  getMatchByCodeGsiSk,
  getMatchByShareTokenGsiPk,
  getMatchByShareTokenGsiSk,
  getMatchEventSortKey,
  getMatchPartitionKey,
  getMatchPlayerSortKey,
  getMatchSortKey,
  getMatchesByUserGsiPk,
  getMatchesByUserGsiSk,
  getPublicOpenMatchesGsiPk,
  getPublicOpenMatchesGsiSk,
  isListablePublicMatch
} from "@mtg/shared";

export function toMatchItem(match: Match): MatchItem {
  const isPublicOpenMatch = isListablePublicMatch(match);

  return {
    ...match,
    PK: getMatchPartitionKey(match.matchId),
    SK: getMatchSortKey(),
    entityType: "MATCH",
    GSI1PK: getMatchByCodeGsiPk(match.code),
    GSI1SK: getMatchByCodeGsiSk(),
    GSI2PK: getMatchByShareTokenGsiPk(match.shareToken),
    GSI2SK: getMatchByShareTokenGsiSk(),
    GSI3PK: isPublicOpenMatch ? getPublicOpenMatchesGsiPk() : undefined,
    GSI3SK: isPublicOpenMatch
      ? getPublicOpenMatchesGsiSk(match.createdAt, match.matchId)
      : undefined
  };
}

export function toMatchPlayerItem(player: MatchPlayer): MatchPlayerItem {
  return {
    ...player,
    PK: getMatchPartitionKey(player.matchId),
    SK: getMatchPlayerSortKey(player.userId),
    entityType: "MATCH_PLAYER",
    GSI4PK: getMatchesByUserGsiPk(player.userId),
    GSI4SK: getMatchesByUserGsiSk(player.joinedAt, player.matchId)
  };
}

export function toMatchEventItem(event: MatchEvent): MatchEventItem {
  return {
    ...event,
    PK: getMatchPartitionKey(event.matchId),
    SK: getMatchEventSortKey(event.occurredAt, event.eventId),
    entityType: "MATCH_EVENT"
  };
}
