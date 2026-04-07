import { ok } from "../shared/http";
import type { LambdaHandler } from "../shared/types";
import { MatchRepository } from "../matches/repository";
import {
  assertMatchAggregateExists,
  toMatchSnapshotResponse
} from "../matches/service";
import { ValidationError } from "../shared/errors";

export const getMatchHandler: LambdaHandler = async ({ event, context }) => {
  const matchId = event.pathParameters?.matchId;

  if (!matchId) {
    throw new ValidationError("matchId path parameter is required");
  }

  const repository = new MatchRepository();
  const aggregate = assertMatchAggregateExists(
    await repository.getMatchAggregate(matchId),
    matchId
  );

  return ok(toMatchSnapshotResponse(aggregate, context.auth.userId!));
};
