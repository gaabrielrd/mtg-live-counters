import { ok } from "../shared/http";
import type { LambdaHandler } from "../shared/types";

export const authSessionHandler: LambdaHandler = async ({ context }) => {
  return ok({
    status: "authenticated",
    requestId: context.requestId,
    user: {
      id: context.auth.userId,
      email: context.auth.email
    },
    token: {
      use: context.auth.tokenUse
    }
  });
};
