import type { MatchSnapshotResponse } from "@mtg/shared";
import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { getMatchSnapshot } from "@/matches/api";
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

  if (isLoading) {
    return (
      <section className="rounded-[32px] border border-stone-900/10 bg-paper/85 p-10 shadow-card">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-ember/75">
          Match snapshot
        </p>
        <p className="mt-4 text-base leading-7 text-stone-700">
          Carregando o estado autoritativo da partida...
        </p>
      </section>
    );
  }

  if (!snapshot || errorMessage) {
    return (
      <section className="rounded-[32px] border border-rose-200 bg-rose-50/90 p-10 shadow-card">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-rose-700">
          Match unavailable
        </p>
        <p className="mt-4 text-base leading-7 text-rose-700">
          {errorMessage ?? "Nao foi possivel carregar a partida."}
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[32px] border border-stone-900/10 bg-paper/85 p-8 shadow-card">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-ember/75">
            Match room
          </p>
          <h1 className="mt-4 font-display text-4xl text-ink">Partida pronta para a mesa</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-stone-700">
            Este snapshot vem do backend e funciona como a base de reidratacao da sala
            antes da camada realtime entrar em cena.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-3xl border border-stone-900/10 bg-white/70 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-stone-500">Match code</p>
              <p className="mt-3 text-lg font-semibold tracking-[0.24em] text-ink">
                {snapshot.match.code}
              </p>
            </div>
            <div className="rounded-3xl border border-stone-900/10 bg-white/70 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-stone-500">Initial life</p>
              <p className="mt-3 text-lg font-semibold text-ink">
                {snapshot.match.initialLifeTotal}
              </p>
            </div>
            <div className="rounded-3xl border border-stone-900/10 bg-white/70 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-stone-500">Capacity</p>
              <p className="mt-3 text-lg font-semibold text-ink">
                {snapshot.match.currentPlayers}/{snapshot.match.maxPlayers}
              </p>
            </div>
          </div>
        </div>

        <aside className="rounded-[32px] border border-stone-900/10 bg-white/75 p-8 shadow-card">
          <p className="text-xs uppercase tracking-[0.28em] text-stone-500">Metadata</p>
          <dl className="mt-5 space-y-4 text-sm leading-6 text-stone-700">
            <div>
              <dt className="font-semibold text-ink">Visibility</dt>
              <dd>{snapshot.match.isPublic ? "Publica" : "Privada"}</dd>
            </div>
            <div>
              <dt className="font-semibold text-ink">Status</dt>
              <dd className="capitalize">{snapshot.match.status}</dd>
            </div>
            <div>
              <dt className="font-semibold text-ink">Viewer player id</dt>
              <dd className="break-all">{snapshot.viewerPlayerId}</dd>
            </div>
            <div>
              <dt className="font-semibold text-ink">Share token</dt>
              <dd className="break-all">{snapshot.match.shareToken}</dd>
            </div>
          </dl>
        </aside>
      </section>

      <section className="rounded-[32px] border border-stone-900/10 bg-paper/85 p-8 shadow-card">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-ember/75">
              Active players
            </p>
            <h2 className="mt-3 font-display text-3xl text-ink">Totais de vida atuais</h2>
          </div>
          <div className="rounded-full border border-stone-900/10 bg-white/70 px-4 py-2 text-xs uppercase tracking-[0.22em] text-stone-500">
            Fonte: snapshot HTTP
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {snapshot.players.map((player) => (
            <article
              key={player.playerId}
              className="rounded-[28px] border border-stone-900/10 bg-white/80 p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold text-ink">
                    {player.displayNameSnapshot}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.22em] text-stone-500">
                    {player.isOwner ? "Owner" : "Player"}
                    {player.playerId === snapshot.viewerPlayerId ? " • You" : ""}
                  </p>
                </div>
                <span className="rounded-full border border-stone-900/10 bg-paper px-3 py-1 text-xs uppercase tracking-[0.2em] text-stone-500">
                  Seat {player.seat ?? "-"}
                </span>
              </div>

              <p className="mt-8 font-display text-5xl text-ink">
                {player.currentLifeTotal}
              </p>
              <p className="mt-3 text-sm text-stone-600">
                Estado de conexao: <span className="capitalize">{player.connectionState}</span>
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
