import { ok } from "../shared/http";
import type { LambdaHandler } from "../shared/types";

export const healthcheckHandler: LambdaHandler = async ({ context }) => {
  return ok({
    status: "ok",
    service: "api",
    timestamp: new Date().toISOString(),
    requestId: context.requestId
  });
};
