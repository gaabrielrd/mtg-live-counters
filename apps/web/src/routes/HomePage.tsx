import { DOMAIN_ERROR_CODES } from "@mtg/shared";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuthSession } from "@/auth/auth-session";
import { joinMatchByCode } from "@/matches/api";
import {
  HttpClientError,
  useAuthenticatedHttpClient
} from "@/services/http-client";

function getJoinErrorMessage(error: unknown): string {
  if (error instanceof HttpClientError) {
    switch (error.code) {
      case DOMAIN_ERROR_CODES.MATCH_CODE_INVALID:
        return "Codigo de partida invalido.";
      case DOMAIN_ERROR_CODES.MATCH_FULL:
        return "Essa partida nao aceita novos jogadores.";
      case DOMAIN_ERROR_CODES.ALREADY_IN_MATCH:
        return "Voce ja participa desta partida.";
      case DOMAIN_ERROR_CODES.UNAUTHORIZED:
        return "Voce precisa entrar na sua conta antes de participar.";
      default:
        return error.message || "Nao foi possivel entrar na partida.";
    }
  }

  return error instanceof Error ? error.message : "Nao foi possivel entrar na partida.";
}

export function HomePage() {
  const auth = useAuthSession();
  const httpClient = useAuthenticatedHttpClient();
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const primaryCta = auth.status === "authenticated" ? "/matches" : "/auth/signup";
  const primaryLabel =
    auth.status === "authenticated" ? "Create a match" : "Create your account";
  const normalizedJoinCode = joinCode.trim().toUpperCase();

  async function handleJoinMatch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (auth.status !== "authenticated") {
      toast.error("Voce precisa entrar na sua conta antes de participar.");
      navigate("/auth");
      return;
    }

    setIsJoining(true);

    try {
      const snapshot = await joinMatchByCode(httpClient, {
        code: normalizedJoinCode
      });

      setJoinCode("");
      toast.success("Partida encontrada. Entrando na mesa...");
      navigate(`/matches/${snapshot.match.matchId}`, {
        state: {
          snapshot
        }
      });
    } catch (error) {
      toast.error(getJoinErrorMessage(error));
    } finally {
      setIsJoining(false);
    }
  }

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(216,179,106,0.18),transparent_26%),radial-gradient(circle_at_15%_25%,rgba(242,125,77,0.14),transparent_20%)]" />

      <section className="relative mx-auto grid min-h-[78vh] max-w-7xl gap-10 px-6 py-14 lg:grid-cols-[1.2fr_0.8fr] lg:items-end lg:py-20">
        <div className="rounded-[40px] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.1),rgba(255,255,255,0.03))] p-8 shadow-card sm:p-12">
          <p className="text-xs uppercase tracking-[0.4em] text-gold/90">
            Command the table
          </p>
          <h1 className="mt-6 max-w-4xl font-display text-6xl leading-[0.92] text-white sm:text-7xl lg:text-8xl">
            Every life total, under one dark and decisive board.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/85">
            Create matches in seconds, keep every player visible, and prepare
            the table for real-time updates with a UI that feels made for game night.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              to={primaryCta}
              className="rounded-full bg-ember px-7 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[#ff8f63]"
            >
              {primaryLabel}
            </Link>
            <Link
              to={auth.status === "authenticated" ? "/matches" : "/auth"}
              className="rounded-full border border-white/12 bg-white/5 px-7 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white/90 transition hover:bg-white/10 hover:text-white"
            >
              {auth.status === "authenticated" ? "Open matches" : "Login"}
            </Link>
          </div>
        </div>

        <aside className="grid gap-4">
          <div className="rounded-[32px] border border-white/10 bg-moss/80 p-7 shadow-card">
            <p className="text-xs uppercase tracking-[0.32em] text-gold/85">
              Built for the table
            </p>
            <div className="mt-6 grid gap-4 text-sm leading-7 text-white/85">
              <div className="rounded-[24px] border border-white/10 bg-black/10 p-5">
                Shared snapshots keep the room aligned before realtime takes over.
              </div>
              <div className="rounded-[24px] border border-white/10 bg-black/10 p-5">
                Match defaults stay anchored in the backend, so the experience remains trustworthy.
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/5 p-7 shadow-card">
            <p className="text-xs uppercase tracking-[0.32em] text-gold/85">
              Match modes
            </p>
            <div className="mt-5 flex flex-wrap gap-3 text-sm text-white/85">
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                Private rooms
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                Public tables
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                Shared join codes
              </span>
            </div>
          </div>
        </aside>
      </section>

      <section className="relative mx-auto grid max-w-7xl gap-6 px-6 pb-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-card">
          <p className="text-xs uppercase tracking-[0.34em] text-gold/85">
            Enter by code
          </p>
          <h2 className="mt-4 font-display text-4xl text-white">
            Join a match the moment the code lands on the table.
          </h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-white/82">
            This entry point is coming next. The experience will accept a short
            room code or shared link and sync you into the active match snapshot.
          </p>

          <form className="mt-8 flex flex-col gap-3 sm:flex-row" onSubmit={handleJoinMatch}>
            <input
              type="text"
              value={joinCode}
              onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
              placeholder="ABCD12"
              maxLength={12}
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              disabled={isJoining}
              className="w-full rounded-full border border-white/10 bg-black/20 px-5 py-3 text-sm uppercase tracking-[0.32em] text-white outline-none transition focus:border-ember disabled:cursor-not-allowed disabled:text-white/60"
            />
            <button
              type="submit"
              disabled={isJoining || normalizedJoinCode.length === 0}
              className="rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:text-white/60"
            >
              {isJoining ? "Joining..." : "Join match"}
            </button>
          </form>
        </div>

        <div className="rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(242,125,77,0.16),rgba(17,20,26,0.92))] p-8 shadow-card">
          <p className="text-xs uppercase tracking-[0.34em] text-gold/85">
            Start here
          </p>
          <h2 className="mt-4 font-display text-4xl text-white">
            Create your account and take the first seat.
          </h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-white/84">
            Sign up once, create a match, and let the app place you directly in
            the room as the first player with the correct starting life total.
          </p>
          <div className="mt-8">
            <Link
              to={auth.status === "authenticated" ? "/matches" : "/auth/signup"}
              className="inline-flex rounded-full bg-gold px-7 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-canvas transition hover:bg-[#e8c785]"
            >
              {auth.status === "authenticated" ? "Create your next match" : "Create account and play"}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
