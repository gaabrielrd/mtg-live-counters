import { useState } from "react";
import { useAuthSession } from "@/auth/auth-session";
import { getOptionalAuthConfig } from "@/auth/config";
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
  const config = getOptionalAuthConfig();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [pending, setPending] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [backendSession, setBackendSession] =
    useState<AuthenticatedSessionResponse | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setResultMessage(null);

    try {
      if (mode === "signin") {
        await auth.signIn(email, password);
        setResultMessage("Login concluído e tokens carregados na sessão local.");
      } else {
        await auth.signUp(email, password);
        setResultMessage("Conta criada e sessão autenticada com sucesso.");
      }
    } catch (error) {
      setResultMessage(error instanceof Error ? error.message : "Falha na autenticação.");
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

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-[32px] border border-amber-950/10 bg-paper/85 p-8 shadow-card">
        <p className="text-sm font-semibold uppercase tracking-[0.32em] text-ember/80">
          Cognito native auth
        </p>
        <h1 className="mt-4 font-display text-4xl leading-tight text-ink">
          Email e senha agora passam por um fluxo real de identidade.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-stone-700">
          Este formulário usa Cognito User Pool como fonte principal de identidade,
          persiste a sessão no navegador e já prepara um bearer token válido para a API.
        </p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div className="flex gap-2 rounded-full border border-stone-900/10 bg-white/70 p-1">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={[
                "rounded-full px-4 py-2 text-sm transition",
                mode === "signin"
                  ? "bg-ink text-paper"
                  : "text-stone-700 hover:bg-stone-900/5"
              ].join(" ")}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={[
                "rounded-full px-4 py-2 text-sm transition",
                mode === "signup"
                  ? "bg-ink text-paper"
                  : "text-stone-700 hover:bg-stone-900/5"
              ].join(" ")}
            >
              Criar conta
            </button>
          </div>

          <label className="block">
            <span className="text-sm font-medium text-stone-700">Email</span>
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-stone-900/10 bg-white px-4 py-3 text-ink outline-none transition focus:border-ember"
              placeholder="planeswalker@example.com"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-stone-700">Senha</span>
            <input
              required
              type="password"
              minLength={12}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-stone-900/10 bg-white px-4 py-3 text-ink outline-none transition focus:border-ember"
              placeholder="No mínimo 12 caracteres"
            />
          </label>

          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-ember px-6 py-3 text-sm font-semibold text-paper transition hover:bg-ember/90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {pending
              ? "Processando..."
              : mode === "signin"
                ? "Entrar com Cognito"
                : "Criar conta no Cognito"}
          </button>
        </form>

        {resultMessage ? (
          <div className="mt-5 rounded-2xl border border-stone-900/10 bg-canvas px-4 py-3 text-sm text-stone-700">
            {resultMessage}
          </div>
        ) : null}
      </section>

      <aside className="space-y-6">
        <section className="rounded-[32px] border border-moss/20 bg-moss p-8 text-paper shadow-card">
          <p className="text-xs uppercase tracking-[0.28em] text-gold/90">
            Session state
          </p>
          <div className="mt-5 space-y-4 text-sm leading-7 text-paper/85">
            <p>Status: {auth.status}</p>
            <p>User Pool: {config?.userPoolId ?? "Not configured"}</p>
            <p>Client: {config?.userPoolClientId ?? "Not configured"}</p>
            <p>
              User:{" "}
              {auth.session?.user.email ??
                auth.session?.user.id ??
                "Nenhum usuário autenticado"}
            </p>
          </div>

          {!config ? (
            <div className="mt-4 rounded-2xl border border-paper/10 bg-black/10 px-4 py-3 text-sm leading-6 text-paper/80">
              Preencha `apps/web/.env.local` com as variáveis `VITE_COGNITO_*`
              antes de testar login real.
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={pending || auth.status !== "authenticated"}
              onClick={() => void validateBackendSession()}
              className="rounded-full border border-paper/20 px-4 py-2 text-sm font-medium transition hover:bg-black/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Validar token na API
            </button>
            <button
              type="button"
              disabled={auth.status !== "authenticated"}
              onClick={() => auth.signOut()}
              className="rounded-full border border-paper/20 px-4 py-2 text-sm font-medium transition hover:bg-black/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Encerrar sessão
            </button>
          </div>
        </section>

        <section className="rounded-[32px] border border-amber-950/10 bg-paper/85 p-8 shadow-card">
          <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
            Backend proof
          </p>
          <pre className="mt-4 overflow-x-auto rounded-3xl bg-stone-950 p-5 text-xs leading-6 text-emerald-100">
            {JSON.stringify(
              backendSession ?? {
                status: "pending",
                detail: "Autentique e valide a sessão para conferir as claims aceitas pela API."
              },
              null,
              2
            )}
          </pre>
        </section>
      </aside>
    </div>
  );
}
