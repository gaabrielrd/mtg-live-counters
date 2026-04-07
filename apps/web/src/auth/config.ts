const requiredAuthEnvVars = [
  "VITE_COGNITO_REGION",
  "VITE_COGNITO_USER_POOL_ID",
  "VITE_COGNITO_USER_POOL_CLIENT_ID"
] as const;

export interface AuthConfig {
  region: string;
  userPoolId: string;
  userPoolClientId: string;
  hostedUiBaseUrl?: string;
}

export function getOptionalAuthConfig(): AuthConfig | null {
  const missing = requiredAuthEnvVars.filter((key) => !import.meta.env[key]);

  if (missing.length > 0) {
    return null;
  }

  return {
    region: import.meta.env.VITE_COGNITO_REGION!,
    userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID!,
    userPoolClientId: import.meta.env.VITE_COGNITO_USER_POOL_CLIENT_ID!,
    hostedUiBaseUrl: import.meta.env.VITE_COGNITO_HOSTED_UI_BASE_URL
  };
}

export function getAuthConfig(): AuthConfig {
  const config = getOptionalAuthConfig();

  if (!config) {
    throw new Error(
      `Missing auth configuration: ${requiredAuthEnvVars.join(", ")}`
    );
  }

  return config;
}

export function getApiBaseUrl() {
  return import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:3001";
}
