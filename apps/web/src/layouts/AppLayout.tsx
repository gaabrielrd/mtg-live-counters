import { NavLink, Outlet } from "react-router-dom";

const NAV_ITEMS = [
  { to: "/", label: "Home" },
  { to: "/matches", label: "Matches" },
  { to: "/auth", label: "Auth" }
];

export function AppLayout() {
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
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <Outlet />
      </main>
    </div>
  );
}
