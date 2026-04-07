import {
  DEFAULT_INITIAL_LIFE_TOTAL,
  DEFAULT_MAX_PLAYERS,
  MAX_MATCH_PLAYERS,
  MIN_MATCH_PLAYERS
} from "@mtg/shared";

export const matchDomainDefaults = {
  initialLifeTotal: DEFAULT_INITIAL_LIFE_TOTAL,
  defaultMaxPlayers: DEFAULT_MAX_PLAYERS,
  maxAllowedPlayers: MAX_MATCH_PLAYERS,
  minAllowedPlayers: MIN_MATCH_PLAYERS,
  defaultVisibility: false,
  maxCodeGenerationAttempts: 5,
  codeLength: 6
} as const;

export function getMatchesTableName(): string {
  const tableName = process.env.GAME_TABLE_NAME;

  if (!tableName) {
    throw new Error("Missing match configuration: GAME_TABLE_NAME");
  }

  return tableName;
}
