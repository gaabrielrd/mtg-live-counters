import type { CreateMatchRequest } from "@mtg/shared";
import { created } from "../shared/http";
import { parseOptionalJsonBody } from "../shared/request-body";
import type { LambdaHandler } from "../shared/types";
import { matchDomainDefaults } from "../matches/config";
import { MatchRepository } from "../matches/repository";
import {
  createMatchAggregate,
  normalizeCreateMatchRequest,
  toMatchSnapshotResponse
} from "../matches/service";

export const createMatchHandler: LambdaHandler = async ({ event, context }) => {
  const repository = new MatchRepository();
  const parsedBody = parseOptionalJsonBody<CreateMatchRequest>(event.body);
  const settings = normalizeCreateMatchRequest(parsedBody);

  for (let attempt = 0; attempt < matchDomainDefaults.maxCodeGenerationAttempts; attempt += 1) {
    const aggregate = createMatchAggregate({
      ownerUserId: context.auth.userId!,
      ownerDisplayName: context.auth.email ?? context.auth.userId!,
      requestId: context.requestId,
      settings
    });

    const existingMatch = await repository.getMatchByCode(aggregate.match.code);

    if (existingMatch) {
      continue;
    }

    await repository.createMatchAggregate(aggregate);

    return created(toMatchSnapshotResponse(aggregate, context.auth.userId!));
  }

  throw new Error("Failed to generate a unique match code");
};
