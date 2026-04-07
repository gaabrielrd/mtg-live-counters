import type { Middleware } from "../shared/types";
import { verifyBearerToken } from "./jwt";

export const authenticatedMiddleware: Middleware = (next) => async (input) => {
  const identity = await verifyBearerToken(
    input.event.headers.authorization ?? input.event.headers.Authorization
  );

  input.context.auth = {
    userId: identity.userId,
    email: identity.email,
    tokenUse: identity.tokenUse,
    claims: identity.claims
  };

  return next(input);
};
