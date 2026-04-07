/* eslint-disable react-refresh/only-export-components */
import {
  type PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState
} from "react";
import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserAttribute,
  CognitoUserSession,
  CognitoUserPool
} from "amazon-cognito-identity-js";
import { getOptionalAuthConfig } from "./config";
import {
  clearStoredOAuthFlow,
  createGoogleOAuthUrl,
  exchangeAuthorizationCode,
  getStoredOAuthState,
  getStoredOAuthVerifier,
  refreshHostedUiTokens
} from "./oauth";

export const authModuleSummary =
  "Cognito now backs native email/password sign up, sign in, token persistence, and backend-ready JWT session handling.";

export interface AuthSessionUser {
  id: string;
  email?: string;
}

export interface AuthSessionSnapshot {
  user: AuthSessionUser;
  idToken: string;
  accessToken: string;
  expiresAt: number;
  refreshToken?: string;
  provider: "cognito" | "google";
}

interface AuthContextValue {
  status: "loading" | "guest" | "authenticated";
  session: AuthSessionSnapshot | null;
  errorMessage: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  beginGoogleAuth: (mode: "login" | "signup") => Promise<void>;
  completeGoogleCallback: (search: string) => Promise<void>;
  signOut: () => void;
  refreshSession: () => Promise<void>;
  getIdToken: () => Promise<string | undefined>;
}

const AuthSessionContext = createContext<AuthContextValue | undefined>(undefined);
const hostedUiSessionStorageKey = "mtg.auth.hosted-ui.session";

function getUserPool() {
  const authConfig = getOptionalAuthConfig();

  if (!authConfig) {
    throw new Error(
      "Cognito auth is not configured. Fill VITE_COGNITO_REGION, VITE_COGNITO_USER_POOL_ID and VITE_COGNITO_USER_POOL_CLIENT_ID."
    );
  }

  return new CognitoUserPool({
    UserPoolId: authConfig.userPoolId,
    ClientId: authConfig.userPoolClientId
  });
}

function decodeJwtPayload(token: string) {
  const [, payload] = token.split(".");

  if (!payload) {
    throw new Error("Invalid JWT payload");
  }

  return JSON.parse(window.atob(payload.replace(/-/g, "+").replace(/_/g, "/"))) as {
    sub?: string;
    email?: string;
    exp?: number;
  };
}

function mapUserSession(idToken: string, accessToken: string) {
  const payload = decodeJwtPayload(idToken);

  if (!payload.sub || !payload.exp) {
    throw new Error("Token payload is missing required claims");
  }

  return {
    user: {
      id: payload.sub,
      email: payload.email
    },
    idToken,
    accessToken,
    expiresAt: payload.exp * 1000,
    provider: "cognito"
  } satisfies AuthSessionSnapshot;
}

function mapHostedUiSession(
  idToken: string,
  accessToken: string,
  refreshToken?: string
) {
  const payload = decodeJwtPayload(idToken);

  if (!payload.sub || !payload.exp) {
    throw new Error("Token payload is missing required claims");
  }

  return {
    user: {
      id: payload.sub,
      email: payload.email
    },
    idToken,
    accessToken,
    refreshToken,
    expiresAt: payload.exp * 1000,
    provider: "google"
  } satisfies AuthSessionSnapshot;
}

function persistHostedUiSession(session: AuthSessionSnapshot | null) {
  if (!session || session.provider !== "google") {
    localStorage.removeItem(hostedUiSessionStorageKey);
    return;
  }

  localStorage.setItem(hostedUiSessionStorageKey, JSON.stringify(session));
}

function readHostedUiSession() {
  const rawValue = localStorage.getItem(hostedUiSessionStorageKey);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as AuthSessionSnapshot;
  } catch {
    localStorage.removeItem(hostedUiSessionStorageKey);
    return null;
  }
}

async function resolveHostedUiSession() {
  const storedSession = readHostedUiSession();

  if (!storedSession) {
    return null;
  }

  if (storedSession.expiresAt > Date.now() + 15_000) {
    return storedSession;
  }

  if (!storedSession.refreshToken) {
    persistHostedUiSession(null);
    return null;
  }

  const refreshedTokens = await refreshHostedUiTokens(storedSession.refreshToken);

  if (!refreshedTokens.id_token || !refreshedTokens.access_token) {
    persistHostedUiSession(null);
    return null;
  }

  const refreshedSession = mapHostedUiSession(
    refreshedTokens.id_token,
    refreshedTokens.access_token,
    storedSession.refreshToken
  );

  persistHostedUiSession(refreshedSession);
  return refreshedSession;
}

function getCurrentCognitoUser() {
  return getUserPool().getCurrentUser();
}

async function loadPersistedSession() {
  const hostedUiSession = await resolveHostedUiSession();

  if (hostedUiSession) {
    return hostedUiSession;
  }

  const currentUser = getCurrentCognitoUser();

  if (!currentUser) {
    return null;
  }

  return new Promise<AuthSessionSnapshot | null>((resolve, reject) => {
    currentUser.getSession((error: Error | null, session: CognitoUserSession | null) => {
      if (error) {
        reject(error);
        return;
      }

      if (!session?.isValid()) {
        resolve(null);
        return;
      }

      resolve(
        mapUserSession(
          session.getIdToken().getJwtToken(),
          session.getAccessToken().getJwtToken()
        )
      );
    });
  });
}

function signInWithCognito(email: string, password: string) {
  return new Promise<AuthSessionSnapshot>((resolve, reject) => {
    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: getUserPool()
    });

    cognitoUser.authenticateUser(
      new AuthenticationDetails({
        Username: email,
        Password: password
      }),
      {
        onSuccess: (session) => {
          resolve(
            mapUserSession(
              session.getIdToken().getJwtToken(),
              session.getAccessToken().getJwtToken()
            )
          );
        },
        onFailure: (error) => {
          reject(error);
        }
      }
    );
  });
}

function signUpWithCognito(email: string, password: string) {
  return new Promise<void>((resolve, reject) => {
    getUserPool().signUp(
      email,
      password,
      [
        new CognitoUserAttribute({
          Name: "email",
          Value: email
        })
      ],
      [],
      (error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      }
    );
  });
}

function formatAuthError(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Authentication request failed.";
}

export function AuthSessionProvider({ children }: PropsWithChildren) {
  const isMountedRef = useRef(true);
  const [status, setStatus] = useState<AuthContextValue["status"]>("loading");
  const [session, setSession] = useState<AuthSessionSnapshot | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    isMountedRef.current = true;

    void loadPersistedSession()
      .then((nextSession) => {
        if (!isMountedRef.current) {
          return;
        }

        setSession(nextSession);
        setStatus(nextSession ? "authenticated" : "guest");
      })
      .catch((error) => {
        console.error("auth.session.restore_failed", error);

        if (!isMountedRef.current) {
          return;
        }

        setSession(null);
        setStatus("guest");
        setErrorMessage(formatAuthError(error));
      });

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const contextValue: AuthContextValue = {
    status,
    session,
    errorMessage,
    signIn: async (email, password) => {
      setErrorMessage(null);
      const nextSession = await signInWithCognito(email, password);
      persistHostedUiSession(null);
      setSession(nextSession);
      setStatus("authenticated");
    },
    signUp: async (email, password) => {
      setErrorMessage(null);
      await signUpWithCognito(email, password);
      const nextSession = await signInWithCognito(email, password);
      persistHostedUiSession(null);
      setSession(nextSession);
      setStatus("authenticated");
    },
    beginGoogleAuth: async (mode) => {
      setErrorMessage(null);
      window.location.assign(await createGoogleOAuthUrl(mode));
    },
    completeGoogleCallback: async (search) => {
      setErrorMessage(null);

      const params = new URLSearchParams(search);
      const code = params.get("code");
      const state = params.get("state");
      const error = params.get("error");
      const errorDescription = params.get("error_description");

      if (error) {
        throw new Error(errorDescription ?? "Falha ao autenticar com Google.");
      }

      if (!code) {
        throw new Error("Google callback sem codigo de autorizacao.");
      }

      const expectedState = getStoredOAuthState();
      const verifier = getStoredOAuthVerifier();

      if (!state || !expectedState || state !== expectedState || !verifier) {
        clearStoredOAuthFlow();
        throw new Error("Sessao OAuth invalida ou expirada. Tente novamente.");
      }

      const tokens = await exchangeAuthorizationCode(code, verifier);
      clearStoredOAuthFlow();

      if (!tokens.id_token || !tokens.access_token) {
        throw new Error("Resposta do Cognito sem tokens suficientes.");
      }

      const nextSession = mapHostedUiSession(
        tokens.id_token,
        tokens.access_token,
        tokens.refresh_token
      );

      persistHostedUiSession(nextSession);
      setSession(nextSession);
      setStatus("authenticated");
    },
    signOut: () => {
      getCurrentCognitoUser()?.signOut();
      clearStoredOAuthFlow();
      persistHostedUiSession(null);
      setSession(null);
      setStatus("guest");
      setErrorMessage(null);
    },
    refreshSession: async () => {
      setErrorMessage(null);
      const nextSession = await loadPersistedSession();
      setSession(nextSession);
      setStatus(nextSession ? "authenticated" : "guest");
    },
    getIdToken: async () => {
      const nextSession = await loadPersistedSession();

      if (nextSession) {
        setSession(nextSession);
        setStatus("authenticated");
      }

      return nextSession?.idToken;
    }
  };

  return (
    <AuthSessionContext.Provider value={contextValue}>
      {children}
    </AuthSessionContext.Provider>
  );
}

export function useAuthSession() {
  const context = useContext(AuthSessionContext);

  if (!context) {
    throw new Error("useAuthSession must be used within AuthSessionProvider");
  }

  return context;
}
