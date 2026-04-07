import { ValidationError } from "./errors";

export function parseOptionalJsonBody<TBody>(body?: string): TBody | undefined {
  if (!body) {
    return undefined;
  }

  try {
    return JSON.parse(body) as TBody;
  } catch {
    throw new ValidationError("Request body must be valid JSON");
  }
}
