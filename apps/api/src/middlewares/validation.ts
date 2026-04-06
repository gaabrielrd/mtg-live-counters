import type { Middleware } from "../shared/types";

export const validationMiddleware: Middleware = (next) => async (input) => {
  // Reserved for future schema validation at the API boundary.
  return next(input);
};
