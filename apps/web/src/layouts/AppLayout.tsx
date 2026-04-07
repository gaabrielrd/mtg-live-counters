import { NavLink, Outlet } from "react-router-dom";
import { useAuthSession } from "@/auth/auth-session";

const NAV_ITEMS = [
  { to: "/", label: "Home" },
  { to: "/matches", label: "Matches" },
  { to: "/profile", label: "Profile" },
  { to: "/auth", label: "Auth" }
];

export function AppLayout() {
  const auth = useAuthSession();

  return (
    <div className="min-h-screen bg-transparent text-ink">
      <header className="sticky top-0 z-10 border-b border-stone-900/10 bg-paper/75 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="font-display text-2xl tracking-wide text-ember">
              Magic Life Counter
            </p>
            <p className="text-xs uppercase tracking-[0.24em] text-stone-600">
              React, TypeScript, Tailwind and real-time foundations
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden rounded-full border border-stone-900/10 bg-white/70 px-4 py-2 text-xs uppercase tracking-[0.2em] text-stone-600 sm:block">
              {auth.status === "authenticated"
                ? auth.session?.user.email ?? "Authenticated"
                : auth.status === "loading"
                  ? "Loading session"
                  : "Guest session"}
            </div>

            <nav className="flex items-center gap-2 rounded-full border border-stone-900/10 bg-white/70 p-1">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    [
                      "rounded-full px-4 py-2 text-sm transition",
                      isActive
                        ? "bg-ink text-paper"
                        : "text-stone-700 hover:bg-stone-900/5"
                    ].join(" ")
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <Outlet />
      </main>
    </div>
  );
}
