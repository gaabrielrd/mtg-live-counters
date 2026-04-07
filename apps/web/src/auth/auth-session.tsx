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
}

interface AuthContextValue {
  status: "loading" | "guest" | "authenticated";
  session: AuthSessionSnapshot | null;
  errorMessage: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  refreshSession: () => Promise<void>;
  getIdToken: () => Promise<string | undefined>;
}

const AuthSessionContext = createContext<AuthContextValue | undefined>(undefined);

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
    expiresAt: payload.exp * 1000
  } satisfies AuthSessionSnapshot;
}

function getCurrentCognitoUser() {
  return getUserPool().getCurrentUser();
}

async function loadPersistedSession() {
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
      setSession(nextSession);
      setStatus("authenticated");
    },
    signUp: async (email, password) => {
      setErrorMessage(null);
      await signUpWithCognito(email, password);
      const nextSession = await signInWithCognito(email, password);
      setSession(nextSession);
      setStatus("authenticated");
    },
    signOut: () => {
      getCurrentCognitoUser()?.signOut();
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
