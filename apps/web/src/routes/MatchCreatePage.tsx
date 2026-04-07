import { DEFAULT_INITIAL_LIFE_TOTAL, DEFAULT_MAX_PLAYERS, MAX_MATCH_PLAYERS, MIN_MATCH_PLAYERS } from "@mtg/shared";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createMatch } from "@/matches/api";
import { useAuthenticatedHttpClient } from "@/services/http-client";

function normalizeOptionalInteger(rawValue: string): number | undefined {
  const trimmed = rawValue.trim();

  if (!trimmed) {
    return undefined;
  }

  const parsed = Number(trimmed);
  return Number.isInteger(parsed) ? parsed : undefined;
}

export function MatchCreatePage() {
  const httpClient = useAuthenticatedHttpClient();
  const navigate = useNavigate();
  const [initialLifeTotal, setInitialLifeTotal] = useState(String(DEFAULT_INITIAL_LIFE_TOTAL));
  const [maxPlayers, setMaxPlayers] = useState(String(DEFAULT_MAX_PLAYERS));
  const [isPublic, setIsPublic] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const snapshot = await createMatch(httpClient, {
        initialLifeTotal: normalizeOptionalInteger(initialLifeTotal),
        maxPlayers: normalizeOptionalInteger(maxPlayers),
        isPublic
      });

      navigate(`/matches/${snapshot.match.matchId}`, {
        replace: true,
        state: {
          snapshot
        }
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Nao foi possivel criar a partida.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
      <section className="rounded-[32px] border border-stone-900/10 bg-paper/85 p-8 shadow-card">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-ember/75">
          Match creation
        </p>
        <h1 className="mt-4 font-display text-4xl text-ink">Criar nova partida</h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-stone-700">
          Defina a vida inicial, a capacidade da mesa e se a partida pode aparecer na
          listagem publica. O backend continua sendo a fonte autoritativa para defaults,
          limites e entrada do jogador criador.
        </p>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
                Initial life total
              </span>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                value={initialLifeTotal}
                onChange={(event) => setInitialLifeTotal(event.target.value)}
                className="mt-3 w-full rounded-3xl border border-stone-900/10 bg-white/80 px-4 py-3 text-base text-ink outline-none transition focus:border-ember/45"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
                Max players
              </span>
              <input
                type="number"
                inputMode="numeric"
                min={MIN_MATCH_PLAYERS}
                max={MAX_MATCH_PLAYERS}
                step={1}
                value={maxPlayers}
                onChange={(event) => setMaxPlayers(event.target.value)}
                className="mt-3 w-full rounded-3xl border border-stone-900/10 bg-white/80 px-4 py-3 text-base text-ink outline-none transition focus:border-ember/45"
              />
            </label>
          </div>

          <label className="flex items-start gap-4 rounded-3xl border border-stone-900/10 bg-white/70 p-5">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(event) => setIsPublic(event.target.checked)}
              className="mt-1 h-5 w-5 rounded border-stone-300 text-ember focus:ring-ember/40"
            />
            <span>
              <span className="block text-sm font-semibold text-ink">Listar como partida publica</span>
              <span className="mt-1 block text-sm leading-6 text-stone-600">
                Partidas privadas continuam acessiveis apenas para quem tiver codigo ou link.
              </span>
            </span>
          </label>

          {errorMessage ? (
            <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {errorMessage}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-paper transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Criando partida..." : "Criar partida"}
          </button>
        </form>
      </section>

      <aside className="rounded-[32px] border border-moss/15 bg-white/70 p-8 shadow-card">
        <p className="text-xs uppercase tracking-[0.28em] text-stone-500">Regras aplicadas</p>
        <div className="mt-5 space-y-4 text-sm leading-6 text-stone-700">
          <div className="rounded-3xl border border-stone-900/10 bg-paper/80 p-5">
            <p className="font-semibold text-ink">Defaults do dominio</p>
            <p className="mt-2">
              Vida inicial padrao: {DEFAULT_INITIAL_LIFE_TOTAL}. Capacidade padrao: {DEFAULT_MAX_PLAYERS}.
            </p>
          </div>
          <div className="rounded-3xl border border-stone-900/10 bg-paper/80 p-5">
            <p className="font-semibold text-ink">Limites</p>
            <p className="mt-2">
              O backend aceita entre {MIN_MATCH_PLAYERS} e {MAX_MATCH_PLAYERS} jogadores por partida.
            </p>
          </div>
          <div className="rounded-3xl border border-stone-900/10 bg-paper/80 p-5">
            <p className="font-semibold text-ink">Criador como primeiro jogador</p>
            <p className="mt-2">
              A criacao ja persiste a partida, adiciona voce como owner e devolve o snapshot inicial.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
