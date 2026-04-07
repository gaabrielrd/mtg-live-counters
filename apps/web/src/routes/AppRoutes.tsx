import type { ReactElement } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuthSession } from "@/auth/auth-session";
import { AppLayout } from "@/layouts/AppLayout";
import { AuthCallbackPage } from "@/routes/AuthCallbackPage";
import { AuthPage } from "@/routes/AuthPage";
import { HomePage } from "@/routes/HomePage";
import { MatchCreatePage } from "@/routes/MatchCreatePage";
import { MatchRoomPage } from "@/routes/MatchRoomPage";
import { ProfilePage } from "@/routes/ProfilePage";
import { SignupPage } from "@/routes/SignupPage";

function RedirectAuthenticatedAuthRoute({ children }: { children: ReactElement }) {
  const auth = useAuthSession();

  if (auth.status === "loading") {
    return (
      <section className="rounded-[32px] border border-white/10 bg-[linear-gradient(155deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-10 shadow-card">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-gold/85">
          Session
        </p>
        <p className="mt-4 text-base leading-7 text-ink/86">
          Verificando a sessao atual...
        </p>
      </section>
    );
  }

  if (auth.status === "authenticated") {
    return <Navigate to="/profile" replace />;
  }

  return children;
}

function RequireAuthenticatedRoute({ children }: { children: ReactElement }) {
  const auth = useAuthSession();

  if (auth.status === "loading") {
    return (
      <section className="rounded-[32px] border border-white/10 bg-[linear-gradient(155deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-10 shadow-card">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-gold/85">
          Session
        </p>
        <p className="mt-4 text-base leading-7 text-ink/86">
          Verificando a sessao atual...
        </p>
      </section>
    );
  }

  if (auth.status !== "authenticated") {
    return <Navigate to="/auth" replace />;
  }

  return children;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route
          path="/auth"
          element={
            <RedirectAuthenticatedAuthRoute>
              <AuthPage />
            </RedirectAuthenticatedAuthRoute>
          }
        />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route
          path="/auth/signup"
          element={
            <RedirectAuthenticatedAuthRoute>
              <SignupPage />
            </RedirectAuthenticatedAuthRoute>
          }
        />
        <Route path="/profile" element={<ProfilePage />} />
        <Route
          path="/matches"
          element={
            <RequireAuthenticatedRoute>
              <MatchCreatePage />
            </RequireAuthenticatedRoute>
          }
        />
        <Route
          path="/matches/:matchId"
          element={
            <RequireAuthenticatedRoute>
              <MatchRoomPage />
            </RequireAuthenticatedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
