import {
  DEFAULT_INITIAL_LIFE_TOTAL,
  DEFAULT_MAX_PLAYERS,
  MAX_MATCH_PLAYERS,
  MIN_MATCH_PLAYERS
} from "@mtg/shared";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createMatch } from "@/matches/api";
import {
  getCreateMatchErrorMessage,
  hasCreateMatchErrors,
  validateCreateMatchForm
} from "@/matches/create-match";
import { useAuthenticatedHttpClient } from "@/services/http-client";

export function MatchCreatePage() {
  const httpClient = useAuthenticatedHttpClient();
  const navigate = useNavigate();
  const [initialLifeTotal, setInitialLifeTotal] = useState(String(DEFAULT_INITIAL_LIFE_TOTAL));
  const [maxPlayers, setMaxPlayers] = useState(String(DEFAULT_MAX_PLAYERS));
  const [isPublic, setIsPublic] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const validation = validateCreateMatchForm({
    initialLifeTotal,
    maxPlayers,
    isPublic
  });
  const hasFieldErrors = hasCreateMatchErrors(validation.errors);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validation.normalizedValues) {
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const snapshot = await createMatch(httpClient, validation.normalizedValues);

      navigate(`/matches/${snapshot.match.matchId}`, {
        replace: true,
        state: {
          snapshot
        }
      });
    } catch (error) {
      setErrorMessage(getCreateMatchErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
      <section className="rounded-[32px] border border-white/10 bg-[linear-gradient(155deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-8 shadow-card">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-gold/85">
          Match creation
        </p>
        <h1 className="mt-4 font-display text-5xl text-white">Criar nova partida</h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-white/82">
          Ajuste os defaults da mesa, revise as validacoes antes do envio e entre
          direto na partida assim que o backend persistir o snapshot autoritativo.
        </p>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.24em] text-white/65">
                Initial life total
              </span>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                value={initialLifeTotal}
                onChange={(event) => {
                  setInitialLifeTotal(event.target.value);
                  setErrorMessage(null);
                }}
                aria-invalid={validation.errors.initialLifeTotal ? "true" : "false"}
                className={`mt-3 w-full rounded-3xl border px-4 py-3 text-base text-white outline-none transition focus:border-ember ${
                  validation.errors.initialLifeTotal
                    ? "border-rose-400/45 bg-rose-500/10"
                    : "border-white/10 bg-black/20"
                }`}
              />
              <span className="mt-2 block text-xs leading-6 text-white/60">
                Comeca em {DEFAULT_INITIAL_LIFE_TOTAL} por padrao e precisa ser um inteiro positivo.
              </span>
              {validation.errors.initialLifeTotal ? (
                <span className="mt-2 block text-sm text-rose-200">
                  {validation.errors.initialLifeTotal}
                </span>
              ) : null}
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.24em] text-white/65">
                Max players
              </span>
              <input
                type="number"
                inputMode="numeric"
                min={MIN_MATCH_PLAYERS}
                max={MAX_MATCH_PLAYERS}
                step={1}
                value={maxPlayers}
                onChange={(event) => {
                  setMaxPlayers(event.target.value);
                  setErrorMessage(null);
                }}
                aria-invalid={validation.errors.maxPlayers ? "true" : "false"}
                className={`mt-3 w-full rounded-3xl border px-4 py-3 text-base text-white outline-none transition focus:border-ember ${
                  validation.errors.maxPlayers
                    ? "border-rose-400/45 bg-rose-500/10"
                    : "border-white/10 bg-black/20"
                }`}
              />
              <span className="mt-2 block text-xs leading-6 text-white/60">
                O dominio usa {DEFAULT_MAX_PLAYERS} por padrao e aceita ate {MAX_MATCH_PLAYERS}.
              </span>
              {validation.errors.maxPlayers ? (
                <span className="mt-2 block text-sm text-rose-200">
                  {validation.errors.maxPlayers}
                </span>
              ) : null}
            </label>
          </div>

          <label className="flex items-start gap-4 rounded-3xl border border-white/10 bg-white/5 p-5">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(event) => {
                setIsPublic(event.target.checked);
                setErrorMessage(null);
              }}
              className="mt-1 h-5 w-5 rounded border-white/20 bg-black/20 text-ember focus:ring-ember/40"
            />
            <span>
              <span className="block text-sm font-semibold text-white">
                Listar como partida publica
              </span>
              <span className="mt-1 block text-sm leading-6 text-white/78">
                Partidas privadas continuam acessiveis apenas para quem tiver codigo ou link.
              </span>
            </span>
          </label>

          {errorMessage ? (
            <div className="rounded-3xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {errorMessage}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting || hasFieldErrors}
            className="rounded-full bg-ember px-6 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-[#ff8f63] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Criando partida..." : "Criar partida"}
          </button>
        </form>
      </section>

      <aside className="rounded-[32px] border border-white/10 bg-moss/85 p-8 shadow-card">
        <p className="text-xs uppercase tracking-[0.28em] text-gold/85">Regras aplicadas</p>
        <div className="mt-5 space-y-4 text-sm leading-6 text-white/82">
          <div className="rounded-3xl border border-white/10 bg-black/10 p-5">
            <p className="font-semibold text-white">Defaults do dominio</p>
            <p className="mt-2">
              Vida inicial padrao: {DEFAULT_INITIAL_LIFE_TOTAL}. Capacidade padrao:{" "}
              {DEFAULT_MAX_PLAYERS}.
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-black/10 p-5">
            <p className="font-semibold text-white">Limites</p>
            <p className="mt-2">
              O backend aceita entre {MIN_MATCH_PLAYERS} e {MAX_MATCH_PLAYERS} jogadores por partida.
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-black/10 p-5">
            <p className="font-semibold text-white">Criador como primeiro jogador</p>
            <p className="mt-2">
              Quando tudo estiver valido, a criacao persiste a partida, adiciona voce
              como owner e abre a sala com o snapshot inicial.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
