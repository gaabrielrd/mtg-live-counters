import type { Middleware } from "../shared/types";
import { AppError } from "../shared/errors";
import { internalError, json } from "../shared/http";

export const errorHandlingMiddleware: Middleware = (next) => async (input) => {
  try {
    return await next(input);
  } catch (error) {
    if (error instanceof AppError) {
      return json(error.statusCode, {
        error: {
          code: error.code,
          message: error.message,
          details: error.details
        }
      });
    }

    console.error("request.failed", {
      requestId: input.context.requestId,
      method: input.context.method,
      path: input.context.path,
      error
    });

    return internalError();
  }
};
