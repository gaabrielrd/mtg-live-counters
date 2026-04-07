import { CognitoJwtVerifier } from "aws-jwt-verify";
import { UnauthorizedError } from "../shared/errors";
import { getCognitoAuthConfig } from "./config";

export interface AuthenticatedIdentity {
  userId: string;
  email?: string;
  tokenUse: "id";
  claims: Record<string, unknown>;
}

type CognitoIdTokenClaims = {
  sub?: string;
  email?: string;
  token_use?: string;
  iss?: string;
  aud?: string;
} & Record<string, unknown>;

let cachedVerifier: ReturnType<typeof CognitoJwtVerifier.create> | undefined;

function getVerifier() {
  if (!cachedVerifier) {
    const config = getCognitoAuthConfig();
    cachedVerifier = CognitoJwtVerifier.create({
      userPoolId: config.userPoolId,
      tokenUse: "id",
      clientId: config.userPoolClientId
    });
  }

  return cachedVerifier;
}

function extractBearerToken(authorizationHeader?: string) {
  if (!authorizationHeader) {
    throw new UnauthorizedError("Missing Authorization header");
  }

  const [scheme, token] = authorizationHeader.trim().split(/\s+/, 2);

  if (scheme?.toLowerCase() !== "bearer" || !token) {
    throw new UnauthorizedError("Authorization header must use Bearer token");
  }

  return token;
}

export async function verifyBearerToken(
  authorizationHeader?: string
): Promise<AuthenticatedIdentity> {
  const token = extractBearerToken(authorizationHeader);
  const config = getCognitoAuthConfig();

  try {
    const verifier = getVerifier();
    const claims = (await verifier.verify(token)) as CognitoIdTokenClaims;

    if (!claims.sub) {
      throw new UnauthorizedError("Token is missing subject claim");
    }

    if (claims.iss !== config.issuer) {
      throw new UnauthorizedError("Token issuer does not match this environment");
    }

    return {
      userId: claims.sub,
      email: typeof claims.email === "string" ? claims.email : undefined,
      tokenUse: "id",
      claims
    };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw error;
    }

    throw new UnauthorizedError("Invalid Cognito token", {
      reason: error instanceof Error ? error.message : "unknown"
    });
  }
}
