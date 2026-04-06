import {
  DEFAULT_INITIAL_LIFE_TOTAL,
  DEFAULT_MAX_PLAYERS,
  MAX_MATCH_PLAYERS
} from "@mtg/shared";

export const matchDomainDefaults = {
  initialLifeTotal: DEFAULT_INITIAL_LIFE_TOTAL,
  defaultMaxPlayers: DEFAULT_MAX_PLAYERS,
  maxAllowedPlayers: MAX_MATCH_PLAYERS
} as const;
