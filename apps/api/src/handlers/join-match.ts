import type { JoinMatchByCodeRequest } from "@mtg/shared";
import { ok } from "../shared/http";
import { parseOptionalJsonBody } from "../shared/request-body";
import type { LambdaHandler } from "../shared/types";
import {
  isConditionalWriteConflict,
  MatchRepository
} from "../matches/repository";
import {
  assertMatchAggregateExists,
  createJoinMatchAggregate,
  normalizeJoinMatchRequest,
  throwMatchCodeInvalid,
  toMatchSnapshotResponse
} from "../matches/service";

export const joinMatchHandler: LambdaHandler = async ({ event, context }) => {
  const repository = new MatchRepository();
  const parsedBody = parseOptionalJsonBody<JoinMatchByCodeRequest>(event.body);
  const code = normalizeJoinMatchRequest(parsedBody);
  const persistedMatch = await repository.getMatchByCode(code);

  if (!persistedMatch) {
    throwMatchCodeInvalid(code);
  }

  let aggregate = assertMatchAggregateExists(
    await repository.getMatchAggregate(persistedMatch.matchId),
    persistedMatch.matchId
  );

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const nextAggregate = createJoinMatchAggregate({
      aggregate,
      userId: context.auth.userId!,
      displayName: context.auth.email ?? context.auth.userId!,
      requestId: context.requestId
    });
    const player = nextAggregate.players.at(-1);
    const joinEvent = nextAggregate.events.at(-1);

    if (!player || !joinEvent) {
      throw new Error("Join aggregate is missing player or event");
    }

    try {
      await repository.joinMatchAggregate({
        previousMatch: aggregate.match,
        match: nextAggregate.match,
        player,
        event: joinEvent
      });

      return ok(toMatchSnapshotResponse(nextAggregate, context.auth.userId!));
    } catch (error) {
      if (!isConditionalWriteConflict(error) || attempt === 1) {
        throw error;
      }

      aggregate = assertMatchAggregateExists(
        await repository.getMatchAggregate(persistedMatch.matchId),
        persistedMatch.matchId
      );
    }
  }

  throw new Error("Join match flow exhausted retries");
};
