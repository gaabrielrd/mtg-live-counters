const requiredAuthEnvVars = [
  "COGNITO_REGION",
  "COGNITO_USER_POOL_ID",
  "COGNITO_USER_POOL_CLIENT_ID",
  "COGNITO_ISSUER"
] as const;

export interface CognitoAuthConfig {
  region: string;
  userPoolId: string;
  userPoolClientId: string;
  issuer: string;
}

export function getCognitoAuthConfig(): CognitoAuthConfig {
  const missing = requiredAuthEnvVars.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing Cognito auth configuration: ${missing.join(", ")}`);
  }

  return {
    region: process.env.COGNITO_REGION!,
    userPoolId: process.env.COGNITO_USER_POOL_ID!,
    userPoolClientId: process.env.COGNITO_USER_POOL_CLIENT_ID!,
    issuer: process.env.COGNITO_ISSUER!
  };
}
