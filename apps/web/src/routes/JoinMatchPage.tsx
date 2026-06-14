import { DOMAIN_ERROR_CODES } from "@mtg/shared";
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuthSession } from "@/auth/auth-session";
import { storePostAuthRedirectPath } from "@/auth/post-auth-redirect";
import { joinMatchByLink } from "@/matches/api";
import {
  getJoinLinkErrorMessage,
  getJoinLinkRedirectMatchId,
  isJoinLinkErrorCode
} from "@/matches/join-link";
import { useAuthenticatedHttpClient } from "@/services/http-client";

export function JoinMatchPage() {
  const auth = useAuthSession();
  const httpClient = useAuthenticatedHttpClient();
  const navigate = useNavigate();
  const location = useLocation();
  const { shareToken } = useParams();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (auth.status === "loading") {
      return;
    }

    if (!shareToken) {
      setErrorMessage("Esse link de partida nao e valido ou ja expirou.");
      return;
    }

    if (auth.status === "guest") {
      storePostAuthRedirectPath(`${location.pathname}${location.search}`);
      navigate("/auth", { replace: true });
      return;
    }

    let cancelled = false;
    setErrorMessage(null);

    void joinMatchByLink(httpClient, { shareToken })
      .then((snapshot) => {
        if (cancelled) {
          return;
        }

        navigate(`/matches/${snapshot.match.matchId}`, {
          replace: true,
          state: {
            snapshot
          }
        });
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        const existingMatchId = getJoinLinkRedirectMatchId(error);

        if (existingMatchId) {
          navigate(`/matches/${existingMatchId}`, { replace: true });
          return;
        }

        if (isJoinLinkErrorCode(error, DOMAIN_ERROR_CODES.ALREADY_IN_MATCH)) {
          setErrorMessage("Voce ja faz parte dessa partida.");
          return;
        }

        setErrorMessage(getJoinLinkErrorMessage(error));
      });

    return () => {
      cancelled = true;
    };
  }, [
    auth.status,
    httpClient,
    location.pathname,
    location.search,
    navigate,
    shareToken
  ]);

  if (auth.status === "loading" || (auth.status === "guest" && !errorMessage)) {
    return (
      <section className="rounded-[32px] border border-white/10 bg-[linear-gradient(155deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-10 shadow-card">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-gold/85">
          Shared link
        </p>
        <p className="mt-4 text-base leading-7 text-white/82">
          Validando sua sessao e preparando a entrada na partida...
        </p>
      </section>
    );
  }

  if (!errorMessage) {
    return (
      <section className="rounded-[32px] border border-white/10 bg-[linear-gradient(155deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-10 shadow-card">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-gold/85">
          Shared link
        </p>
        <p className="mt-4 text-base leading-7 text-white/82">
          Entrando na partida pelo link compartilhado...
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-[32px] border border-rose-400/30 bg-rose-500/10 p-10 shadow-card">
      <p className="text-sm font-semibold uppercase tracking-[0.28em] text-rose-700">
        Shared link unavailable
      </p>
      <p className="mt-4 text-base leading-7 text-rose-200">{errorMessage}</p>
    </section>
  );
}
