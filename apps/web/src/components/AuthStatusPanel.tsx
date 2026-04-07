import type { ReactNode } from "react";
import { AUTH_CONFIG_HELP_TEXT } from "@/auth/auth-copy";
import { getOptionalAuthConfig } from "@/auth/config";
import { useAuthSession } from "@/auth/auth-session";

interface AuthStatusPanelProps {
  pending?: boolean;
  extra?: ReactNode;
  onValidateToken?: () => void;
}

export function AuthStatusPanel({
  pending = false,
  extra,
  onValidateToken
}: AuthStatusPanelProps) {
  const auth = useAuthSession();
  const config = getOptionalAuthConfig();

  return (
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
            "Nenhum usuario autenticado"}
        </p>
      </div>

      {!config ? (
        <div className="mt-4 rounded-2xl border border-paper/10 bg-black/10 px-4 py-3 text-sm leading-6 text-paper/80">
          {AUTH_CONFIG_HELP_TEXT}
        </div>
      ) : null}

      {extra ? <div className="mt-6">{extra}</div> : null}

      <div className="mt-6 flex flex-wrap gap-3">
        {onValidateToken ? (
          <button
            type="button"
            disabled={pending || auth.status !== "authenticated"}
            onClick={onValidateToken}
            className="rounded-full border border-paper/20 px-4 py-2 text-sm font-medium transition hover:bg-black/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Validar token na API
          </button>
        ) : null}
        <button
          type="button"
          disabled={auth.status !== "authenticated"}
          onClick={() => auth.signOut()}
          className="rounded-full border border-paper/20 px-4 py-2 text-sm font-medium transition hover:bg-black/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Encerrar sessao
        </button>
      </div>
    </section>
  );
}
