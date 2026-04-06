import type { Middleware } from "../shared/types";

export const loggingMiddleware: Middleware = (next) => async (input) => {
  const startedAt = Date.now();

  console.info("request.started", {
    requestId: input.context.requestId,
    method: input.context.method,
    path: input.context.path
  });

  const response = await next(input);

  console.info("request.completed", {
    requestId: input.context.requestId,
    method: input.context.method,
    path: input.context.path,
    statusCode: response.statusCode,
    durationMs: Date.now() - startedAt
  });

  return response;
};
