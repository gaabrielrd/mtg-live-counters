import { getAuthConfig } from "./config";

const oauthVerifierStorageKey = "mtg.auth.oauth.verifier";
const oauthStateStorageKey = "mtg.auth.oauth.state";
const oauthModeStorageKey = "mtg.auth.oauth.mode";

type OAuthMode = "login" | "signup";

function createRandomString(length: number) {
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const bytes = crypto.getRandomValues(new Uint8Array(length));

  return Array.from(bytes, (byte) => charset[byte % charset.length]).join("");
}

async function sha256(value: string) {
  const encoded = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", encoded);
  return new Uint8Array(hash);
}

function encodeBase64Url(bytes: Uint8Array) {
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function getOAuthCallbackUrl() {
  return `${window.location.origin}/auth/callback`;
}

function getHostedUiBaseUrl() {
  const config = getAuthConfig();

  if (!config.hostedUiBaseUrl) {
    throw new Error(
      "Hosted UI base URL is not configured. Fill VITE_COGNITO_HOSTED_UI_BASE_URL."
    );
  }

  return config.hostedUiBaseUrl;
}

export async function createGoogleOAuthUrl(mode: OAuthMode) {
  const config = getAuthConfig();
  const verifier = createRandomString(64);
  const state = createRandomString(48);
  const challenge = encodeBase64Url(await sha256(verifier));
  const authorizeUrl = new URL(`${getHostedUiBaseUrl()}/oauth2/authorize`);

  sessionStorage.setItem(oauthVerifierStorageKey, verifier);
  sessionStorage.setItem(oauthStateStorageKey, state);
  sessionStorage.setItem(oauthModeStorageKey, mode);

  authorizeUrl.searchParams.set("identity_provider", "Google");
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("client_id", config.userPoolClientId);
  authorizeUrl.searchParams.set("redirect_uri", getOAuthCallbackUrl());
  authorizeUrl.searchParams.set("scope", "openid email profile");
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("code_challenge_method", "S256");
  authorizeUrl.searchParams.set("code_challenge", challenge);

  return authorizeUrl.toString();
}

export function getStoredOAuthVerifier() {
  return sessionStorage.getItem(oauthVerifierStorageKey);
}

export function getStoredOAuthState() {
  return sessionStorage.getItem(oauthStateStorageKey);
}

export function getStoredOAuthMode() {
  return sessionStorage.getItem(oauthModeStorageKey) as OAuthMode | null;
}

export function clearStoredOAuthFlow() {
  sessionStorage.removeItem(oauthVerifierStorageKey);
  sessionStorage.removeItem(oauthStateStorageKey);
  sessionStorage.removeItem(oauthModeStorageKey);
}

export async function exchangeAuthorizationCode(code: string, verifier: string) {
  const config = getAuthConfig();
  const response = await fetch(`${getHostedUiBaseUrl()}/oauth2/token`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: config.userPoolClientId,
      code,
      code_verifier: verifier,
      redirect_uri: getOAuthCallbackUrl()
    })
  });

  if (!response.ok) {
    throw new Error("Nao foi possivel trocar o codigo Google por tokens Cognito.");
  }

  return (await response.json()) as {
    id_token?: string;
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    token_type?: string;
  };
}

export async function refreshHostedUiTokens(refreshToken: string) {
  const config = getAuthConfig();
  const response = await fetch(`${getHostedUiBaseUrl()}/oauth2/token`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: config.userPoolClientId,
      refresh_token: refreshToken
    })
  });

  if (!response.ok) {
    throw new Error("Nao foi possivel renovar a sessao Google.");
  }

  return (await response.json()) as {
    id_token?: string;
    access_token?: string;
    expires_in?: number;
    token_type?: string;
  };
}
