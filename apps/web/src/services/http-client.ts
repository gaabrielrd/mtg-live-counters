import { useAuthSession } from "@/auth/auth-session";
import { getApiBaseUrl } from "@/auth/config";

export interface HttpClientRequest {
  path: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
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
        const errorText = await response.text();
        throw new Error(
          `HTTP ${response.status} ${response.statusText}: ${errorText || "request failed"}`
        );
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
