import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2
} from "aws-lambda";

export interface RequestContext {
  requestId: string;
  routeKey: string;
  method: string;
  path: string;
  startedAt: number;
  auth: {
    userId?: string;
    email?: string;
    tokenUse?: "access" | "id";
    claims?: Record<string, unknown>;
  };
}

export interface HandlerInput {
  event: APIGatewayProxyEventV2;
  context: RequestContext;
}

export type LambdaHandler = (
  input: HandlerInput
) => Promise<APIGatewayProxyStructuredResultV2>;

export type Middleware = (
  next: LambdaHandler
) => (input: HandlerInput) => Promise<APIGatewayProxyStructuredResultV2>;
