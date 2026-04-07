import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthSession } from "@/auth/auth-session";

export function AuthCallbackPage() {
  const auth = useAuthSession();
  const navigate = useNavigate();
  const [message, setMessage] = useState("Conectando sua conta Google ao Cognito...");

  useEffect(() => {
    let cancelled = false;

    void auth
      .completeGoogleCallback(window.location.search)
      .then(() => {
        if (cancelled) {
          return;
        }

        setMessage("Conta Google conectada. Redirecionando...");
        window.setTimeout(() => {
          navigate("/matches", { replace: true });
        }, 500);
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        setMessage(
          error instanceof Error
            ? error.message
            : "Falha ao concluir o login com Google."
        );
      });

    return () => {
      cancelled = true;
    };
  }, [auth, navigate]);

  return (
    <div className="mx-auto max-w-2xl rounded-[32px] border border-amber-950/10 bg-paper/90 p-8 text-ink shadow-card">
      <p className="text-sm font-semibold uppercase tracking-[0.32em] text-ember/80">
        Google callback
      </p>
      <h1 className="mt-4 font-display text-4xl leading-tight">
        Finalizando sua autenticacao.
      </h1>
      <p className="mt-4 text-base leading-7 text-stone-700">{message}</p>
      <p className="mt-6 text-sm leading-7 text-stone-600">
        Se algo travar, volte para{" "}
        <Link to="/auth" className="font-semibold text-ember transition hover:text-ink">
          /auth
        </Link>{" "}
        e tente novamente.
      </p>
    </div>
  );
}
