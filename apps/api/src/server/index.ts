import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { healthcheck } from "../index";
import { NotFoundError } from "../shared/errors";
import { json } from "../shared/http";

const port = Number(process.env.PORT ?? 3001);

function normalizeHeaderValue(
  value: string | number | boolean
): string | number {
  return typeof value === "string" || typeof value === "number"
    ? value
    : String(value);
}

async function readRequestBody(request: import("node:http").IncomingMessage) {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return chunks.length > 0 ? Buffer.concat(chunks).toString("utf8") : undefined;
}

function createApiGatewayEvent(
  request: import("node:http").IncomingMessage,
  body?: string
): APIGatewayProxyEventV2 {
  const host = request.headers.host ?? `127.0.0.1:${port}`;
  const requestUrl = new URL(request.url ?? "/", `http://${host}`);

  return {
    version: "2.0",
    routeKey: `${request.method ?? "GET"} ${requestUrl.pathname}`,
    rawPath: requestUrl.pathname,
    rawQueryString: requestUrl.searchParams.toString(),
    cookies: [],
    headers: Object.fromEntries(
      Object.entries(request.headers).flatMap(([key, value]) => {
        if (typeof value === "undefined") {
          return [];
        }

        return [[key, Array.isArray(value) ? value.join(",") : value]];
      })
    ),
    queryStringParameters:
      requestUrl.searchParams.size > 0
        ? Object.fromEntries(requestUrl.searchParams.entries())
        : undefined,
    requestContext: {
      accountId: "local",
      apiId: "local-api",
      domainName: host,
      domainPrefix: "local",
      requestId: randomUUID(),
      routeKey: `${request.method ?? "GET"} ${requestUrl.pathname}`,
      stage: "$default",
      time: new Date().toUTCString(),
      timeEpoch: Date.now(),
      http: {
        method: request.method ?? "GET",
        path: requestUrl.pathname,
        protocol: "HTTP/1.1",
        sourceIp: request.socket.remoteAddress ?? "127.0.0.1",
        userAgent: request.headers["user-agent"] ?? "local-adapter"
      }
    },
    body,
    pathParameters: undefined,
    isBase64Encoded: false
  };
}

async function resolveRoute(event: APIGatewayProxyEventV2) {
  if (event.requestContext.http.method === "GET" && event.rawPath === "/health") {
    return healthcheck(event);
  }

  throw new NotFoundError(`Route ${event.requestContext.http.method} ${event.rawPath} not found`);
}

const server = createServer(async (request, response) => {
  const body = await readRequestBody(request);
  const event = createApiGatewayEvent(request, body);

  try {
    const result = await resolveRoute(event);

    response.statusCode = result.statusCode ?? 200;

    Object.entries(result.headers ?? {}).forEach(([headerName, headerValue]) => {
      if (typeof headerValue !== "undefined") {
        response.setHeader(headerName, normalizeHeaderValue(headerValue));
      }
    });

    response.end(result.body ?? "");
  } catch (error) {
    const notFoundPayload =
      error instanceof NotFoundError
        ? json(error.statusCode, {
            error: {
              code: error.code,
              message: error.message
            }
          })
        : json(500, {
            error: {
              code: "INTERNAL_ERROR",
              message: "Internal server error"
            }
          });

    response.statusCode = notFoundPayload.statusCode ?? 500;
    Object.entries(notFoundPayload.headers ?? {}).forEach(
      ([headerName, headerValue]) => {
        if (typeof headerValue !== "undefined") {
          response.setHeader(headerName, normalizeHeaderValue(headerValue));
        }
      }
    );
    response.end(notFoundPayload.body ?? "");
  }
});

server.listen(port, "127.0.0.1", () => {
  console.info("api.local.ready", {
    port,
    healthcheckUrl: `http://127.0.0.1:${port}/health`
  });
});
