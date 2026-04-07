import {
  DynamoDBClient
} from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  QueryCommand,
  TransactWriteCommand
} from "@aws-sdk/lib-dynamodb";
import type {
  MatchEventItem,
  MatchItem,
  MatchPlayerItem
} from "@mtg/shared";
import {
  getMatchByCodeGsiPk,
  getMatchByCodeGsiSk,
  getMatchPartitionKey,
  getMatchPlayerSortKeyPrefix,
  getMatchSortKey,
  GSI_MATCH_BY_CODE
} from "@mtg/shared";
import { getMatchesTableName } from "./config";
import { toMatchEventItem, toMatchItem, toMatchPlayerItem } from "./dynamo-items";
import type { MatchAggregate } from "./service";

let cachedDocumentClient: DynamoDBDocumentClient | undefined;

function getDocumentClient(): DynamoDBDocumentClient {
  if (!cachedDocumentClient) {
    cachedDocumentClient = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
      marshallOptions: {
        removeUndefinedValues: true
      }
    });
  }

  return cachedDocumentClient;
}

export interface MatchRepositoryOptions {
  client?: DynamoDBDocumentClient;
  tableName?: string;
}

export interface PersistedMatchAggregate {
  match: MatchItem;
  players: MatchPlayerItem[];
  events: MatchEventItem[];
}

export class MatchRepository {
  private readonly client: DynamoDBDocumentClient;
  private readonly tableName: string;

  constructor(options: MatchRepositoryOptions = {}) {
    this.client = options.client ?? getDocumentClient();
    this.tableName = options.tableName ?? getMatchesTableName();
  }

  async getMatchById(matchId: string): Promise<MatchItem | null> {
    const result = await this.client.send(
      new GetCommand({
        TableName: this.tableName,
        Key: {
          PK: getMatchPartitionKey(matchId),
          SK: getMatchSortKey()
        },
        ConsistentRead: true
      })
    );

    const item = result.Item;

    if (!item || item.entityType !== "MATCH") {
      return null;
    }

    return item as MatchItem;
  }

  async getMatchByCode(code: string): Promise<MatchItem | null> {
    const result = await this.client.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: GSI_MATCH_BY_CODE,
        KeyConditionExpression: "GSI1PK = :codePk AND GSI1SK = :codeSk",
        ExpressionAttributeValues: {
          ":codePk": getMatchByCodeGsiPk(code),
          ":codeSk": getMatchByCodeGsiSk()
        },
        Limit: 1
      })
    );

    const item = result.Items?.[0];
    return item ? (item as MatchItem) : null;
  }

  async listMatchPlayers(matchId: string): Promise<MatchPlayerItem[]> {
    const result = await this.client.send(
      new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: "PK = :partitionKey AND begins_with(SK, :playerPrefix)",
        ExpressionAttributeValues: {
          ":partitionKey": getMatchPartitionKey(matchId),
          ":playerPrefix": getMatchPlayerSortKeyPrefix()
        },
        ConsistentRead: true
      })
    );

    return (result.Items ?? []).filter(
      (item): item is MatchPlayerItem => item.entityType === "MATCH_PLAYER"
    );
  }

  async createMatchAggregate(aggregate: MatchAggregate): Promise<void> {
    const matchItem = toMatchItem(aggregate.match);
    const playerItems = aggregate.players.map(toMatchPlayerItem);
    const eventItems = aggregate.events.map(toMatchEventItem);

    await this.client.send(
      new TransactWriteCommand({
        TransactItems: [matchItem, ...playerItems, ...eventItems].map((item) => ({
          Put: {
            TableName: this.tableName,
            Item: item,
            ConditionExpression: "attribute_not_exists(PK) AND attribute_not_exists(SK)"
          }
        }))
      })
    );
  }

  async getMatchAggregate(matchId: string): Promise<PersistedMatchAggregate | null> {
    const result = await this.client.send(
      new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: "PK = :partitionKey",
        ExpressionAttributeValues: {
          ":partitionKey": getMatchPartitionKey(matchId)
        },
        ConsistentRead: true
      })
    );

    if (!result.Items || result.Items.length === 0) {
      return null;
    }

    const match = result.Items.find((item) => item.entityType === "MATCH");

    if (!match) {
      return null;
    }

    return {
      match: match as MatchItem,
      players: result.Items.filter(
        (item): item is MatchPlayerItem => item.entityType === "MATCH_PLAYER"
      ),
      events: result.Items.filter(
        (item): item is MatchEventItem => item.entityType === "MATCH_EVENT"
      )
    };
  }
}
