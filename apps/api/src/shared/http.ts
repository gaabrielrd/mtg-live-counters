import type { APIGatewayProxyStructuredResultV2 } from "aws-lambda";

function createCorsHeaders() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "authorization, content-type",
    "access-control-allow-methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  };
}

export function json<TBody>(
  statusCode: number,
  body: TBody
): APIGatewayProxyStructuredResultV2 {
  return {
    statusCode,
    headers: {
      ...createCorsHeaders(),
      "content-type": "application/json; charset=utf-8"
    },
    body: JSON.stringify(body)
  };
}

export function ok<TBody>(body: TBody): APIGatewayProxyStructuredResultV2 {
  return json(200, body);
}

export function badRequest(message: string): APIGatewayProxyStructuredResultV2 {
  return json(400, {
    error: {
      code: "BAD_REQUEST",
      message
    }
  });
}

export function internalError(
  message = "Internal server error"
): APIGatewayProxyStructuredResultV2 {
  return json(500, {
    error: {
      code: "INTERNAL_ERROR",
      message
    }
  });
}

export function noContent(): APIGatewayProxyStructuredResultV2 {
  return {
    statusCode: 204,
    headers: createCorsHeaders()
  };
}
