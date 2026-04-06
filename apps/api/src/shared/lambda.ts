import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2
} from "aws-lambda";
import { badRequest } from "./http";
import type { LambdaHandler, Middleware, RequestContext } from "./types";

export function createRequestContext(
  event: APIGatewayProxyEventV2
): RequestContext {
  return {
    requestId: event.requestContext.requestId,
    routeKey: event.requestContext.routeKey,
    method: event.requestContext.http.method,
    path: event.requestContext.http.path,
    startedAt: Date.now(),
    auth: {
      // Reserved for future Cognito claims extraction.
      userId: undefined
    }
  };
}

export function composeMiddlewares(
  handler: LambdaHandler,
  middlewares: Middleware[]
): LambdaHandler {
  return middlewares.reduceRight((next, middleware) => middleware(next), handler);
}

export function createLambdaEntry(
  handler: LambdaHandler,
  middlewares: Middleware[]
) {
  const pipeline = composeMiddlewares(handler, middlewares);

  return async function lambdaEntry(
    event: APIGatewayProxyEventV2
  ): Promise<APIGatewayProxyStructuredResultV2> {
    if (!event.requestContext?.http?.method || !event.requestContext?.http?.path) {
      return badRequest("Invalid API Gateway event");
    }

    return pipeline({
      event,
      context: createRequestContext(event)
    });
  };
}
