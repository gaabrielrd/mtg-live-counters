import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuthSession } from "@/auth/auth-session";
import { AuthField } from "@/components/AuthField";
import { AuthShell } from "@/components/AuthShell";
import { AuthStatusPanel } from "@/components/AuthStatusPanel";
import { GoogleAuthButton } from "@/components/GoogleAuthButton";

export function AuthPage() {
  const auth = useAuthSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setResultMessage(null);

    try {
      await auth.signIn(email.trim(), password);
      setResultMessage("Login concluido. Sua mesa esta pronta para abrir a proxima partida.");
    } catch (error) {
      setResultMessage(
        error instanceof Error ? error.message : "Falha na autenticacao."
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
      title="Entre e volte para uma mesa que parece pronta para a rodada."
      description="Acesse com sua conta Cognito ou continue com Google para criar partidas, entrar por codigo e acompanhar os totais de vida em uma interface pensada para jogo noturno."
      aside={
        <>
          <AuthStatusPanel pending={pending} />
          <section className="rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-card">
            <p className="text-xs uppercase tracking-[0.28em] text-gold/85">
              What happens next
            </p>
            <p className="mt-4 text-sm leading-7 text-white/82">
              Depois do login, voce pode criar uma nova partida, abrir a sala canonicamente
              por URL e seguir para os proximos fluxos de entrada por codigo e sincronizacao em tempo real.
            </p>
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
          className="rounded-full bg-ember px-6 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-[#ff8f63] disabled:cursor-not-allowed disabled:opacity-70"
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
        <div className="mt-5 rounded-[22px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/88">
          {resultMessage}
        </div>
      ) : null}

      <p className="mt-6 text-sm leading-7 text-white/78">
        Ainda nao criou sua conta?{" "}
        <Link
          to="/auth/signup"
          className="font-semibold text-gold transition hover:text-white"
        >
          Criar conta agora
        </Link>
      </p>
    </AuthShell>
  );
}
