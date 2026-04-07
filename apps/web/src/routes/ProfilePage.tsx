import { useAuthSession } from "@/auth/auth-session";

export function ProfilePage() {
  const auth = useAuthSession();

  return (
    <section className="rounded-[32px] border border-stone-900/10 bg-paper/85 p-10 shadow-card">
      <p className="text-sm font-semibold uppercase tracking-[0.28em] text-ember/75">
        User profile
      </p>
      <h1 className="mt-4 font-display text-4xl text-ink">Authenticated profile</h1>
      <p className="mt-5 max-w-2xl text-base leading-7 text-stone-700">
        Esta pagina placeholder vai concentrar os dados basicos do usuario autenticado
        enquanto o modulo de perfil cresce.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl border border-stone-900/10 bg-white/70 p-5">
          <p className="text-xs uppercase tracking-[0.24em] text-stone-500">Email</p>
          <p className="mt-3 text-sm font-medium text-ink">
            {auth.session?.user.email ?? "Nao disponivel"}
          </p>
        </div>

        <div className="rounded-3xl border border-stone-900/10 bg-white/70 p-5">
          <p className="text-xs uppercase tracking-[0.24em] text-stone-500">User id</p>
          <p className="mt-3 break-all text-sm font-medium text-ink">
            {auth.session?.user.id ?? "Nao disponivel"}
          </p>
        </div>

        <div className="rounded-3xl border border-stone-900/10 bg-white/70 p-5">
          <p className="text-xs uppercase tracking-[0.24em] text-stone-500">Provider</p>
          <p className="mt-3 text-sm font-medium capitalize text-ink">
            {auth.session?.provider ?? "Nao disponivel"}
          </p>
        </div>

        <div className="rounded-3xl border border-stone-900/10 bg-white/70 p-5">
          <p className="text-xs uppercase tracking-[0.24em] text-stone-500">Status</p>
          <p className="mt-3 text-sm font-medium text-ink">{auth.status}</p>
        </div>
      </div>

      <div className="mt-8">
        <button
          type="button"
          onClick={() => auth.signOut()}
          className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-paper transition hover:bg-stone-800"
        >
          Logout
        </button>
      </div>
    </section>
  );
}
