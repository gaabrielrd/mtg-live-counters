import type { DomainErrorCode } from "@mtg/shared";
import { DOMAIN_ERROR_CODES } from "@mtg/shared";

interface ErrorWithCodeAndDetails {
  message?: string;
  code?: string;
  details?: Record<string, unknown>;
}

function isErrorWithCodeAndDetails(error: unknown): error is ErrorWithCodeAndDetails {
  return typeof error === "object" && error !== null;
}

export function getJoinLinkErrorMessage(error: unknown) {
  if (isErrorWithCodeAndDetails(error)) {
    if (error.code === DOMAIN_ERROR_CODES.MATCH_LINK_INVALID) {
      return "Esse link de partida nao e valido ou ja expirou.";
    }

    if (error.code === DOMAIN_ERROR_CODES.MATCH_FULL) {
      return "Essa partida ja esta cheia.";
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Nao foi possivel entrar na partida agora.";
}

export function getJoinLinkRedirectMatchId(error: unknown) {
  if (!isErrorWithCodeAndDetails(error)) {
    return null;
  }

  if (error.code !== DOMAIN_ERROR_CODES.ALREADY_IN_MATCH) {
    return null;
  }

  const matchId = error.details?.matchId;
  return typeof matchId === "string" && matchId ? matchId : null;
}

export function isJoinLinkErrorCode(error: unknown, code: DomainErrorCode) {
  return isErrorWithCodeAndDetails(error) && error.code === code;
}
