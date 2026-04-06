import type { APIGatewayProxyStructuredResultV2 } from "aws-lambda";

export function json<TBody>(
  statusCode: number,
  body: TBody
): APIGatewayProxyStructuredResultV2 {
  return {
    statusCode,
    headers: {
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
