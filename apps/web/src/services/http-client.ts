export interface HttpClientRequest {
  path: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
}

export function createHttpClient() {
  return {
    request: async <TResponse>({ path, method = "GET" }: HttpClientRequest) => {
      throw new Error(
        `HTTP client not implemented yet. Attempted ${method} ${path} before API foundations are in place.`
      ) as never as Promise<TResponse>;
    }
  };
}
