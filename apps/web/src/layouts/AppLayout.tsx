import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuthSession } from "@/auth/auth-session";

const AUTHENTICATED_NAV_ITEMS = [
  { to: "/", label: "Home" },
  { to: "/matches", label: "Matches" },
  { to: "/profile", label: "Profile" }
];

const GUEST_NAV_ITEMS = [
  { to: "/", label: "Home" },
  { to: "/auth", label: "Login" }
];

export function AppLayout() {
  const auth = useAuthSession();
  const location = useLocation();
  const navItems =
    auth.status === "authenticated" ? AUTHENTICATED_NAV_ITEMS : GUEST_NAV_ITEMS;
  const isHomePage = location.pathname === "/";

  return (
    <div className="min-h-screen bg-transparent text-white">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#050608]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <p className="font-display text-3xl tracking-[0.08em] text-gold">
            Magic Life Counter
          </p>

          <nav className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    "rounded-full px-4 py-2 text-sm transition",
                    isActive
                      ? "bg-ember text-white"
                      : "text-white/85 hover:bg-white/8 hover:text-white"
                  ].join(" ")
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main
        className={
          isHomePage ? "px-0 py-0" : "mx-auto max-w-7xl px-6 py-10"
        }
      >
        <Outlet />
      </main>
    </div>
  );
}
