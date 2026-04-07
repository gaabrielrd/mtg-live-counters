import { useAuthSession } from "@/auth/auth-session";

export function ProfilePage() {
  const auth = useAuthSession();

  return (
    <section className="rounded-[32px] border border-white/10 bg-[linear-gradient(155deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-10 shadow-card">
      <p className="text-sm font-semibold uppercase tracking-[0.28em] text-gold/85">
        Profile
      </p>
      <h1 className="mt-4 font-display text-5xl text-white">Sua identidade na mesa</h1>
      <p className="mt-5 max-w-2xl text-base leading-7 text-white/82">
        Este espaco centraliza os dados da sua conta para que os proximos fluxos de
        partidas, convites e historico tenham uma base clara e consistente.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs uppercase tracking-[0.24em] text-white/65">Email</p>
          <p className="mt-3 text-sm font-medium text-white">
            {auth.session?.user.email ?? "Nao disponivel"}
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs uppercase tracking-[0.24em] text-white/65">User id</p>
          <p className="mt-3 break-all text-sm font-medium text-white">
            {auth.session?.user.id ?? "Nao disponivel"}
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs uppercase tracking-[0.24em] text-white/65">Provider</p>
          <p className="mt-3 text-sm font-medium capitalize text-white">
            {auth.session?.provider ?? "Nao disponivel"}
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs uppercase tracking-[0.24em] text-white/65">Status</p>
          <p className="mt-3 text-sm font-medium text-white">{auth.status}</p>
        </div>
      </div>

      <div className="mt-8">
        <button
          type="button"
          onClick={() => auth.signOut()}
          className="rounded-full border border-white/12 bg-white/5 px-6 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-white/10"
        >
          Encerrar sessao
        </button>
      </div>
    </section>
  );
}
