import type { CreateMatchRequest, MatchSnapshotResponse } from "@mtg/shared";
import type { HttpClientRequest } from "@/services/http-client";

export interface MatchApiClient {
  request: <TResponse>(request: HttpClientRequest) => Promise<TResponse>;
}

export function createMatch(
  client: MatchApiClient,
  body: CreateMatchRequest
): Promise<MatchSnapshotResponse> {
  return client.request<MatchSnapshotResponse>({
    path: "/matches",
    method: "POST",
    body
  });
}

export function getMatchSnapshot(
  client: MatchApiClient,
  matchId: string
): Promise<MatchSnapshotResponse> {
  return client.request<MatchSnapshotResponse>({
    path: `/matches/${matchId}`
  });
}
