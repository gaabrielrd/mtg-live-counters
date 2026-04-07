import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PASSWORD_REQUIREMENTS } from "@/auth/auth-copy";
import { useAuthSession } from "@/auth/auth-session";
import {
  hasSignupErrors,
  validateSignupForm,
  type SignupFieldErrors
} from "@/auth/auth-validation";
import { AuthField } from "@/components/AuthField";
import { AuthShell } from "@/components/AuthShell";
import { AuthStatusPanel } from "@/components/AuthStatusPanel";
import { GoogleAuthButton } from "@/components/GoogleAuthButton";

function createEmptyErrors(): SignupFieldErrors {
  return {};
}

export function SignupPage() {
  const auth = useAuthSession();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<SignupFieldErrors>(createEmptyErrors);
  const [pending, setPending] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const passwordChecklist = useMemo(() => PASSWORD_REQUIREMENTS, []);

  function clearFieldError(field: keyof SignupFieldErrors) {
    setFieldErrors((current) => ({
      ...current,
      [field]: undefined
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateSignupForm({
      email,
      password,
      confirmPassword
    });

    setFieldErrors(nextErrors);
    setResultMessage(null);

    if (hasSignupErrors(nextErrors)) {
      return;
    }

    setPending(true);

    try {
      await auth.signUp(email.trim(), password);
      setResultMessage("Conta criada com sucesso. Redirecionando para a mesa...");
      window.setTimeout(() => {
        navigate("/matches", { replace: true });
      }, 700);
    } catch (error) {
      setResultMessage(
        error instanceof Error
          ? error.message
          : "Nao foi possivel criar a conta agora."
      );
      setPending(false);
      return;
    }

    setPending(false);
  }

  async function handleGoogleAuth() {
    setResultMessage(null);

    try {
      await auth.beginGoogleAuth("signup");
    } catch (error) {
      setResultMessage(
        error instanceof Error
          ? error.message
          : "Falha ao iniciar cadastro com Google."
      );
    }
  }

  return (
    <AuthShell
      eyebrow="Create account"
      title="Abra sua mesa com uma conta pronta para partidas ao vivo."
      description="Use um email valido, defina uma senha consistente e entre direto no fluxo autenticado assim que o Cognito aceitar o cadastro."
      aside={
        <>
          <AuthStatusPanel
            pending={pending}
            extra={
              <div className="rounded-[28px] border border-paper/10 bg-black/10 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-gold/90">
                  Antes de enviar
                </p>
                <ul className="mt-4 space-y-2 text-sm leading-6 text-paper/80">
                  {passwordChecklist.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            }
          />
          <section className="rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-card">
            <p className="text-xs uppercase tracking-[0.28em] text-gold/85">
              Flow
            </p>
            <p className="mt-4 text-sm leading-7 text-white/82">
              Depois do sucesso, a conta e criada, a sessao e aberta e o app leva
              voce direto para <span className="font-semibold text-white">/matches</span>.
            </p>
          </section>
        </>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        <AuthField
          label="Email"
          type="email"
          value={email}
          autoComplete="email"
          placeholder="planeswalker@example.com"
          error={fieldErrors.email}
          onChange={(value) => {
            setEmail(value);
            clearFieldError("email");
          }}
        />

        <AuthField
          label="Senha"
          type="password"
          value={password}
          autoComplete="new-password"
          minLength={12}
          placeholder="Crie uma senha forte"
          error={fieldErrors.password}
          onChange={(value) => {
            setPassword(value);
            clearFieldError("password");
          }}
        />

        <AuthField
          label="Confirmacao de senha"
          type="password"
          value={confirmPassword}
          autoComplete="new-password"
          minLength={12}
          placeholder="Repita a senha"
          error={fieldErrors.confirmPassword}
          onChange={(value) => {
            setConfirmPassword(value);
            clearFieldError("confirmPassword");
          }}
        />

        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-ember px-6 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-[#ff8f63] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending ? "Criando conta..." : "Criar conta"}
        </button>
      </form>

      <div className="mt-5">
        <GoogleAuthButton
          label="Criar conta com Google"
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
        Ja tem conta?{" "}
        <Link to="/auth" className="font-semibold text-gold transition hover:text-white">
          Entrar agora
        </Link>
      </p>
    </AuthShell>
  );
}
