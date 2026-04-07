import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";
import {
  CreateTableCommand,
  DynamoDBClient,
  waitUntilTableExists
} from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import {
  GSI_MATCHES_BY_USER,
  GSI_MATCH_BY_CODE,
  GSI_MATCH_BY_SHARE_TOKEN,
  GSI_PUBLIC_OPEN_MATCHES
} from "@mtg/shared";
import { MatchRepository } from "./repository";
import { createMatchAggregate } from "./service";

let dynamoDbClient: DynamoDBClient;
let documentClient: DynamoDBDocumentClient;

before(async () => {
  dynamoDbClient = new DynamoDBClient({
    region: "us-east-1",
    endpoint:
      process.env.MATCH_REPOSITORY_TEST_ENDPOINT ?? "http://127.0.0.1:8000",
    credentials: {
      accessKeyId: "local",
      secretAccessKey: "local"
    }
  });

  documentClient = DynamoDBDocumentClient.from(dynamoDbClient, {
    marshallOptions: {
      removeUndefinedValues: true
    }
  });
});

after(async () => {
  dynamoDbClient.destroy();
});

function createRepository(tableName: string) {
  return new MatchRepository({
    client: documentClient,
    tableName
  });
}

async function createTestTable(tableName: string) {
  await dynamoDbClient.send(
    new CreateTableCommand({
      TableName: tableName,
      AttributeDefinitions: [
        { AttributeName: "PK", AttributeType: "S" },
        { AttributeName: "SK", AttributeType: "S" },
        { AttributeName: "GSI1PK", AttributeType: "S" },
        { AttributeName: "GSI1SK", AttributeType: "S" },
        { AttributeName: "GSI2PK", AttributeType: "S" },
        { AttributeName: "GSI2SK", AttributeType: "S" },
        { AttributeName: "GSI3PK", AttributeType: "S" },
        { AttributeName: "GSI3SK", AttributeType: "S" },
        { AttributeName: "GSI4PK", AttributeType: "S" },
        { AttributeName: "GSI4SK", AttributeType: "S" }
      ],
      KeySchema: [
        { AttributeName: "PK", KeyType: "HASH" },
        { AttributeName: "SK", KeyType: "RANGE" }
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 1,
        WriteCapacityUnits: 1
      },
      GlobalSecondaryIndexes: [
        {
          IndexName: GSI_MATCH_BY_CODE,
          KeySchema: [
            { AttributeName: "GSI1PK", KeyType: "HASH" },
            { AttributeName: "GSI1SK", KeyType: "RANGE" }
          ],
          Projection: { ProjectionType: "ALL" },
          ProvisionedThroughput: {
            ReadCapacityUnits: 1,
            WriteCapacityUnits: 1
          }
        },
        {
          IndexName: GSI_MATCH_BY_SHARE_TOKEN,
          KeySchema: [
            { AttributeName: "GSI2PK", KeyType: "HASH" },
            { AttributeName: "GSI2SK", KeyType: "RANGE" }
          ],
          Projection: { ProjectionType: "ALL" },
          ProvisionedThroughput: {
            ReadCapacityUnits: 1,
            WriteCapacityUnits: 1
          }
        },
        {
          IndexName: GSI_PUBLIC_OPEN_MATCHES,
          KeySchema: [
            { AttributeName: "GSI3PK", KeyType: "HASH" },
            { AttributeName: "GSI3SK", KeyType: "RANGE" }
          ],
          Projection: { ProjectionType: "ALL" },
          ProvisionedThroughput: {
            ReadCapacityUnits: 1,
            WriteCapacityUnits: 1
          }
        },
        {
          IndexName: GSI_MATCHES_BY_USER,
          KeySchema: [
            { AttributeName: "GSI4PK", KeyType: "HASH" },
            { AttributeName: "GSI4SK", KeyType: "RANGE" }
          ],
          Projection: { ProjectionType: "ALL" },
          ProvisionedThroughput: {
            ReadCapacityUnits: 1,
            WriteCapacityUnits: 1
          }
        }
      ]
    })
  );

  await waitUntilTableExists(
    { client: dynamoDbClient, minDelay: 1, maxDelay: 1, maxWaitTime: 5 },
    { TableName: tableName }
  );
}

function createTableName() {
  return `mtg-live-counters-test-${randomUUID()}`;
}

test("MatchRepository persists and retrieves the match aggregate across supported access patterns", async () => {
  const tableName = createTableName();
  await createTestTable(tableName);
  const repository = createRepository(tableName);
  const aggregate = createMatchAggregate({
    ownerUserId: "user-123",
    ownerDisplayName: "player@example.com",
    requestId: "req-1",
    now: "2026-04-07T12:00:00.000Z",
    settings: {
      initialLifeTotal: 40,
      maxPlayers: 4,
      isPublic: true
    }
  });

  await repository.createMatchAggregate(aggregate);

  const matchById = await repository.getMatchById(aggregate.match.matchId);
  const matchByCode = await repository.getMatchByCode(aggregate.match.code);
  const players = await repository.listMatchPlayers(aggregate.match.matchId);
  const persistedAggregate = await repository.getMatchAggregate(
    aggregate.match.matchId
  );

  assert.ok(matchById);
  assert.equal(matchById.matchId, aggregate.match.matchId);
  assert.equal(matchById.currentPlayers, 1);
  assert.equal(matchById.GSI1PK, `CODE#${aggregate.match.code}`);
  assert.ok(matchById.GSI2PK);
  assert.equal(matchById.GSI3PK, "PUBLIC#OPEN");

  assert.ok(matchByCode);
  assert.equal(matchByCode.matchId, aggregate.match.matchId);

  assert.equal(players.length, 1);
  assert.equal(players[0]?.userId, aggregate.players[0]?.userId);
  assert.equal(players[0]?.playerId, aggregate.players[0]?.playerId);
  assert.equal(players[0]?.GSI4PK, "USER#user-123");
  assert.ok(players.every((player) => player.entityType === "MATCH_PLAYER"));

  assert.ok(persistedAggregate);
  assert.equal(persistedAggregate.match.matchId, aggregate.match.matchId);
  assert.equal(persistedAggregate.players.length, 1);
  assert.equal(persistedAggregate.events.length, 1);
  assert.equal(persistedAggregate.events[0]?.type, "match_created");
});

test("MatchRepository returns null or empty collections when the match does not exist", async () => {
  const tableName = createTableName();
  await createTestTable(tableName);
  const repository = createRepository(tableName);

  assert.equal(await repository.getMatchById("missing-match"), null);
  assert.equal(await repository.getMatchByCode("MISSING"), null);
  assert.deepEqual(await repository.listMatchPlayers("missing-match"), []);
  assert.equal(await repository.getMatchAggregate("missing-match"), null);
});
