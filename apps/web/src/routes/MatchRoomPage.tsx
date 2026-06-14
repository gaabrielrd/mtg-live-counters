import type { MatchSnapshotResponse } from "@mtg/shared";
import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { getMatchSnapshot } from "@/matches/api";
import {
  getMatchRoomGridLayout,
  getMatchRoomViewState
} from "@/matches/match-room";
import { useAuthenticatedHttpClient } from "@/services/http-client";

interface MatchRoomLocationState {
  snapshot?: MatchSnapshotResponse;
}

export function MatchRoomPage() {
  const httpClient = useAuthenticatedHttpClient();
  const { matchId } = useParams();
  const location = useLocation();
  const locationState = (location.state as MatchRoomLocationState | null) ?? null;
  const [snapshot, setSnapshot] = useState<MatchSnapshotResponse | null>(() => {
    const initialSnapshot = locationState?.snapshot ?? null;

    if (initialSnapshot && initialSnapshot.match.matchId === matchId) {
      return initialSnapshot;
    }

    return null;
  });
  const [isLoading, setIsLoading] = useState(!snapshot);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const playerCount = snapshot?.players.length ?? 0;
  const viewState = getMatchRoomViewState({
    isLoading,
    errorMessage,
    hasSnapshot: Boolean(snapshot),
    playerCount
  });
  const gridLayout = getMatchRoomGridLayout(playerCount);

  useEffect(() => {
    if (!matchId) {
      setErrorMessage("Partida nao encontrada.");
      setIsLoading(false);
      return;
    }

    if (snapshot?.match.matchId === matchId) {
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setErrorMessage(null);

    void getMatchSnapshot(httpClient, matchId)
      .then((nextSnapshot) => {
        if (!isMounted) {
          return;
        }

        setSnapshot(nextSnapshot);
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }

        setErrorMessage(
          error instanceof Error ? error.message : "Nao foi possivel carregar a partida."
        );
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [httpClient, matchId, snapshot?.match.matchId]);

  if (viewState === "loading") {
    return (
      <section className="rounded-[32px] border border-white/10 bg-[linear-gradient(155deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-10 shadow-card">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-gold/85">
          Match room
        </p>
        <p className="mt-4 text-base leading-7 text-white/82">
          Carregando a mesa e sincronizando o snapshot autoritativo...
        </p>
      </section>
    );
  }

  if (viewState === "error") {
    return (
      <section className="rounded-[32px] border border-rose-400/30 bg-rose-500/10 p-10 shadow-card">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-rose-700">
          Match unavailable
        </p>
        <p className="mt-4 text-base leading-7 text-rose-200">
          {errorMessage ?? "Nao foi possivel carregar a partida."}
        </p>
      </section>
    );
  }

  if (viewState === "empty" || !snapshot) {
    return (
      <section className="rounded-[32px] border border-amber-300/30 bg-amber-500/10 p-10 shadow-card">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-amber-200">
          Mesa sem jogadores
        </p>
        <p className="mt-4 max-w-2xl text-base leading-7 text-amber-50/88">
          A partida foi encontrada, mas ainda nao ha jogadores disponiveis no snapshot
          retornado pelo backend.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[36px] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-8 shadow-card lg:p-10">
        <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-gold/85">
              Match room
            </p>
            <h1 className="mt-4 font-display text-5xl leading-[0.94] text-white lg:text-6xl">
              Mesa pronta para acompanhar a partida inteira.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/82">
              O snapshot inicial organiza todos os jogadores em uma mesa clara e responsiva,
              com vida, assentos e estado de conexao visiveis desde o primeiro carregamento.
            </p>
          </div>

          <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.22em] text-white/65">
            {playerCount} jogadores na mesa
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-white/65">Match code</p>
            <p className="mt-3 text-lg font-semibold tracking-[0.24em] text-white">
              {snapshot.match.code}
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-white/65">Initial life</p>
            <p className="mt-3 text-lg font-semibold text-white">
              {snapshot.match.initialLifeTotal}
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-white/65">Capacity</p>
            <p className="mt-3 text-lg font-semibold text-white">
              {snapshot.match.currentPlayers}/{snapshot.match.maxPlayers}
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-white/65">Status</p>
            <p className="mt-3 text-lg font-semibold capitalize text-white">
              {snapshot.match.status}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-[36px] border border-white/10 bg-[linear-gradient(155deg,rgba(255,255,255,0.07),rgba(255,255,255,0.025))] p-8 shadow-card">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-gold/85">
            Main table
          </p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-display text-4xl text-white">Jogadores ativos</h2>
              <p className="mt-3 max-w-2xl text-base leading-7 text-white/78">
                Cada card prioriza leitura rapida de vida, papel e assento para uso continuo
                durante a partida.
              </p>
            </div>
            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.22em] text-white/65">
              Snapshot inicial
            </div>
          </div>

          <div className={`mt-8 grid gap-4 ${gridLayout.gridClassName}`}>
            {snapshot.players.map((player) => {
              const isViewer = player.playerId === snapshot.viewerPlayerId;

              return (
                <article
                  key={player.playerId}
                  className={`flex h-full ${gridLayout.maxCardWidthClassName}`}
                >
                  <div
                    className={`flex w-full flex-col justify-between rounded-[30px] border p-6 shadow-card ${gridLayout.cardClassName} ${
                      isViewer
                        ? "border-gold/55 bg-[linear-gradient(160deg,rgba(216,179,106,0.18),rgba(255,255,255,0.05))]"
                        : "border-white/10 bg-white/5"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate text-xl font-semibold text-white">
                          {player.displayNameSnapshot}
                        </p>
                        <p className="mt-2 text-xs uppercase tracking-[0.22em] text-white/65">
                          {player.isOwner ? "Owner" : "Player"}
                          {isViewer ? " • You" : ""}
                        </p>
                      </div>
                      <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/65">
                        Seat {player.seat ?? "-"}
                      </span>
                    </div>

                    <div className="mt-8">
                      <p className="text-xs uppercase tracking-[0.24em] text-white/55">
                        Life total
                      </p>
                      <p className="mt-3 font-display text-6xl leading-none text-white">
                        {player.currentLifeTotal}
                      </p>
                    </div>

                    <div className="mt-8 flex items-center justify-between gap-3 border-t border-white/10 pt-4 text-sm text-white/78">
                      <span>Conexao</span>
                      <span className="capitalize text-white">
                        {player.connectionState}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <aside className="space-y-6">
          <section className="rounded-[36px] border border-white/10 bg-moss/85 p-8 shadow-card">
            <p className="text-xs uppercase tracking-[0.28em] text-gold/85">Match metadata</p>
            <dl className="mt-5 space-y-4 text-sm leading-6 text-white/82">
              <div>
                <dt className="font-semibold text-white">Visibility</dt>
                <dd>{snapshot.match.isPublic ? "Publica" : "Privada"}</dd>
              </div>
              <div>
                <dt className="font-semibold text-white">Share link token</dt>
                <dd className="break-all text-white/72">{snapshot.match.shareToken}</dd>
              </div>
              <div>
                <dt className="font-semibold text-white">Viewer player</dt>
                <dd className="text-white/72">{snapshot.viewerPlayerId}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-[36px] border border-white/10 bg-white/5 p-8 shadow-card">
            <p className="text-xs uppercase tracking-[0.28em] text-gold/85">Uso na mesa</p>
            <div className="mt-5 space-y-4 text-sm leading-6 text-white/82">
              <div className="rounded-3xl border border-white/10 bg-black/10 p-5">
                O jogador atual aparece destacado para facilitar orientacao rapida durante o turno.
              </div>
              <div className="rounded-3xl border border-white/10 bg-black/10 p-5">
                O layout da mesa se adapta entre 2 e 8 participantes sem sacrificar leitura.
              </div>
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
}
