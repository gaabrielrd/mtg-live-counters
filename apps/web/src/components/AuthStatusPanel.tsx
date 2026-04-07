import type { ReactNode } from "react";
import { useAuthSession } from "@/auth/auth-session";

interface AuthStatusPanelProps {
  pending?: boolean;
  extra?: ReactNode;
}

export function AuthStatusPanel({
  pending = false,
  extra
}: AuthStatusPanelProps) {
  const auth = useAuthSession();

  return (
    <section className="rounded-[32px] border border-white/10 bg-moss/90 p-8 text-paper shadow-card">
      <p className="text-xs uppercase tracking-[0.28em] text-gold/90">
        Session
      </p>
      <div className="mt-5 space-y-4 text-sm leading-7 text-paper/85">
        <p>
          Status:{" "}
          <span className="capitalize text-paper">{auth.status}</span>
        </p>
        <p>
          Conta:{" "}
          <span className="text-paper">
            {auth.session?.user.email ??
              auth.session?.user.id ??
              "Nenhum usuario autenticado"}
          </span>
        </p>
        <p>
          Provider:{" "}
          <span className="capitalize text-paper">
            {auth.session?.provider ?? "indisponivel"}
          </span>
        </p>
      </div>

      {extra ? <div className="mt-6">{extra}</div> : null}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={pending || auth.status !== "authenticated"}
          onClick={() => auth.signOut()}
          className="rounded-full border border-paper/20 px-4 py-2 text-sm font-medium transition hover:bg-black/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Encerrar sessao
        </button>
      </div>
    </section>
  );
}
