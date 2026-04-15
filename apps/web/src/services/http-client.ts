import { useAuthSession } from "@/auth/auth-session";
import { getApiBaseUrl } from "@/auth/config";

export interface HttpClientRequest {
  path: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
}

export interface HttpClientErrorBody {
  error?: {
    code?: string;
    message?: string;
    details?: Record<string, unknown>;
  };
}

export class HttpClientError extends Error {
  readonly status: number;
  readonly statusText: string;
  readonly code?: string;
  readonly details?: Record<string, unknown>;

  constructor(params: {
    status: number;
    statusText: string;
    message: string;
    code?: string;
    details?: Record<string, unknown>;
  }) {
    super(params.message);
    this.name = "HttpClientError";
    this.status = params.status;
    this.statusText = params.statusText;
    this.code = params.code;
    this.details = params.details;
  }
}

async function parseErrorResponse(response: Response): Promise<HttpClientError> {
  const responseText = await response.text();
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    try {
      const payload = JSON.parse(responseText) as HttpClientErrorBody;

      return new HttpClientError({
        status: response.status,
        statusText: response.statusText,
        message: payload.error?.message ?? `HTTP ${response.status} ${response.statusText}`,
        code: payload.error?.code,
        details: payload.error?.details
      });
    } catch {
      // Fall through to the plain-text error.
    }
  }

  return new HttpClientError({
    status: response.status,
    statusText: response.statusText,
    message: responseText || `HTTP ${response.status} ${response.statusText}`
  });
}

export function createHttpClient(options?: {
  getToken?: () => Promise<string | undefined>;
}) {
  return {
    request: async <TResponse>({
      path,
      method = "GET",
      body
    }: HttpClientRequest) => {
      const token = await options?.getToken?.();
      const response = await fetch(`${getApiBaseUrl()}${path}`, {
        method,
        headers: {
          "content-type": "application/json",
          ...(token ? { authorization: `Bearer ${token}` } : {})
        },
        body: body ? JSON.stringify(body) : undefined
      });

      if (!response.ok) {
        throw await parseErrorResponse(response);
      }

      if (response.status === 204) {
        return undefined as TResponse;
      }

      return (await response.json()) as TResponse;
    }
  };
}

export function useAuthenticatedHttpClient() {
  const { getIdToken } = useAuthSession();

  return createHttpClient({
    getToken: getIdToken
  });
}
