import {
  DOMAIN_ERROR_CODES,
  MAX_MATCH_PLAYERS,
  MIN_MATCH_PLAYERS
} from "@mtg/shared";

export interface CreateMatchFormValues {
  initialLifeTotal: string;
  maxPlayers: string;
  isPublic: boolean;
}

export interface CreateMatchFieldErrors {
  initialLifeTotal?: string;
  maxPlayers?: string;
}

export interface CreateMatchValidationResult {
  errors: CreateMatchFieldErrors;
  normalizedValues?: {
    initialLifeTotal: number;
    maxPlayers: number;
    isPublic: boolean;
  };
}

interface ErrorWithCodeAndMessage {
  message?: string;
  code?: string;
}

function isErrorWithCodeAndMessage(error: unknown): error is ErrorWithCodeAndMessage {
  return typeof error === "object" && error !== null;
}

function parseRequiredInteger(rawValue: string) {
  const trimmed = rawValue.trim();

  if (!trimmed) {
    return {
      isPresent: false,
      value: undefined
    };
  }

  const parsed = Number(trimmed);

  return {
    isPresent: true,
    value: Number.isInteger(parsed) ? parsed : undefined
  };
}

export function validateCreateMatchForm(
  values: CreateMatchFormValues
): CreateMatchValidationResult {
  const errors: CreateMatchFieldErrors = {};
  const initialLifeTotal = parseRequiredInteger(values.initialLifeTotal);
  const maxPlayers = parseRequiredInteger(values.maxPlayers);

  if (!initialLifeTotal.isPresent) {
    errors.initialLifeTotal = "Informe o total de vida inicial.";
  } else if (typeof initialLifeTotal.value === "undefined") {
    errors.initialLifeTotal = "Use um numero inteiro para a vida inicial.";
  } else if (initialLifeTotal.value <= 0) {
    errors.initialLifeTotal = "A vida inicial precisa ser um inteiro positivo.";
  }

  if (!maxPlayers.isPresent) {
    errors.maxPlayers = "Informe quantos jogadores a mesa aceita.";
  } else if (typeof maxPlayers.value === "undefined") {
    errors.maxPlayers = "Use um numero inteiro para o limite de jogadores.";
  } else if (maxPlayers.value < MIN_MATCH_PLAYERS) {
    errors.maxPlayers =
      `A partida precisa aceitar pelo menos ${MIN_MATCH_PLAYERS} jogadores.`;
  } else if (maxPlayers.value > MAX_MATCH_PLAYERS) {
    errors.maxPlayers =
      `O limite maximo permitido e ${MAX_MATCH_PLAYERS} jogadores.`;
  }

  if (hasCreateMatchErrors(errors)) {
    return {
      errors
    };
  }

  return {
    errors,
    normalizedValues: {
      initialLifeTotal: initialLifeTotal.value!,
      maxPlayers: maxPlayers.value!,
      isPublic: values.isPublic
    }
  };
}

export function hasCreateMatchErrors(errors: CreateMatchFieldErrors) {
  return Object.values(errors).some(Boolean);
}

export function getCreateMatchErrorMessage(error: unknown) {
  if (isErrorWithCodeAndMessage(error)) {
    if (error.code === DOMAIN_ERROR_CODES.UNAUTHORIZED) {
      return "Voce precisa entrar na sua conta antes de criar uma partida.";
    }

    if (error.code === "VALIDATION_ERROR" || error.code === DOMAIN_ERROR_CODES.UNAUTHORIZED) {
      return error.message ?? "Revise os dados da partida e tente novamente.";
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Nao foi possivel criar a partida.";
}
