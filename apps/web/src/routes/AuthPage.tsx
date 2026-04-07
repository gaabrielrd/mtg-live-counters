import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuthSession } from "@/auth/auth-session";
import { AuthField } from "@/components/AuthField";
import { AuthShell } from "@/components/AuthShell";
import { AuthStatusPanel } from "@/components/AuthStatusPanel";
import { GoogleAuthButton } from "@/components/GoogleAuthButton";
import { useAuthenticatedHttpClient } from "@/services/http-client";

interface AuthenticatedSessionResponse {
  status: string;
  requestId: string;
  user: {
    id?: string;
    email?: string;
  };
  token: {
    use?: string;
  };
}

export function AuthPage() {
  const auth = useAuthSession();
  const httpClient = useAuthenticatedHttpClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [backendSession, setBackendSession] =
    useState<AuthenticatedSessionResponse | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setResultMessage(null);

    try {
      await auth.signIn(email.trim(), password);
      setResultMessage("Login concluido e tokens carregados na sessao local.");
    } catch (error) {
      setResultMessage(
        error instanceof Error ? error.message : "Falha na autenticacao."
      );
    } finally {
      setPending(false);
    }
  }

  async function validateBackendSession() {
    setPending(true);
    setResultMessage(null);

    try {
      const response =
        await httpClient.request<AuthenticatedSessionResponse>({
          path: "/auth/session"
        });
      setBackendSession(response);
      setResultMessage("Token validado com sucesso pelo backend.");
    } catch (error) {
      setBackendSession(null);
      setResultMessage(
        error instanceof Error ? error.message : "Falha ao validar token no backend."
      );
    } finally {
      setPending(false);
    }
  }

  async function handleGoogleAuth() {
    setResultMessage(null);

    try {
      await auth.beginGoogleAuth("login");
    } catch (error) {
      setResultMessage(
        error instanceof Error ? error.message : "Falha ao iniciar login com Google."
      );
    }
  }

  return (
    <AuthShell
      eyebrow="Sign in"
      title="Retome sua sessao e valide os tokens que movem a partida."
      description="Entre com a conta Cognito existente para recuperar sua sessao local, testar o bearer token e seguir para o fluxo autenticado do app."
      aside={
        <>
          <AuthStatusPanel
            pending={pending}
            onValidateToken={() => void validateBackendSession()}
          />
          <section className="rounded-[32px] border border-amber-950/10 bg-paper/85 p-8 shadow-card">
            <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
              Backend proof
            </p>
            <pre className="mt-4 overflow-x-auto rounded-3xl bg-stone-950 p-5 text-xs leading-6 text-emerald-100">
              {JSON.stringify(
                backendSession ?? {
                  status: "pending",
                  detail:
                    "Autentique e valide a sessao para conferir as claims aceitas pela API."
                },
                null,
                2
              )}
            </pre>
          </section>
        </>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <AuthField
          label="Email"
          type="email"
          value={email}
          autoComplete="email"
          placeholder="planeswalker@example.com"
          onChange={setEmail}
        />

        <AuthField
          label="Senha"
          type="password"
          value={password}
          autoComplete="current-password"
          minLength={12}
          placeholder="Sua senha Cognito"
          onChange={setPassword}
        />

        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-ember px-6 py-3 text-sm font-semibold text-paper transition hover:bg-ember/90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending ? "Entrando..." : "Entrar com Cognito"}
        </button>
      </form>

      <div className="mt-5">
        <GoogleAuthButton
          label="Continuar com Google"
          disabled={pending}
          onClick={() => void handleGoogleAuth()}
        />
      </div>

      {resultMessage ? (
        <div className="mt-5 rounded-2xl border border-stone-900/10 bg-canvas px-4 py-3 text-sm text-stone-700">
          {resultMessage}
        </div>
      ) : null}

      <p className="mt-6 text-sm leading-7 text-stone-600">
        Ainda nao criou sua conta?{" "}
        <Link
          to="/auth/signup"
          className="font-semibold text-ember transition hover:text-ink"
        >
          Criar conta agora
        </Link>
      </p>
    </AuthShell>
  );
}
