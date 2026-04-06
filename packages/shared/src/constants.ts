export const DEFAULT_INITIAL_LIFE_TOTAL = 40;
export const DEFAULT_MAX_PLAYERS = 4;
export const MIN_MATCH_PLAYERS = 2;
export const MAX_MATCH_PLAYERS = 8;

export const DYNAMODB_TABLE_LOGICAL_NAME = "GameTable";

export const DYNAMODB_PK = "PK";
export const DYNAMODB_SK = "SK";

export const DYNAMODB_GSI1PK = "GSI1PK";
export const DYNAMODB_GSI1SK = "GSI1SK";
export const DYNAMODB_GSI2PK = "GSI2PK";
export const DYNAMODB_GSI2SK = "GSI2SK";
export const DYNAMODB_GSI3PK = "GSI3PK";
export const DYNAMODB_GSI3SK = "GSI3SK";
export const DYNAMODB_GSI4PK = "GSI4PK";
export const DYNAMODB_GSI4SK = "GSI4SK";

export const GSI_MATCH_BY_CODE = "GSI1";
export const GSI_MATCH_BY_SHARE_TOKEN = "GSI2";
export const GSI_PUBLIC_OPEN_MATCHES = "GSI3";
export const GSI_MATCHES_BY_USER = "GSI4";

export const PUBLIC_OPEN_MATCHES_PARTITION = "PUBLIC#OPEN";
