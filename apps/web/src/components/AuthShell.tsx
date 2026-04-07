import type { PropsWithChildren, ReactNode } from "react";

interface AuthShellProps extends PropsWithChildren {
  eyebrow: string;
  title: string;
  description: string;
  aside: ReactNode;
}

export function AuthShell({
  eyebrow,
  title,
  description,
  aside,
  children
}: AuthShellProps) {
  return (
    <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative overflow-hidden rounded-[36px] border border-white/10 bg-[linear-gradient(155deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-8 shadow-card sm:p-10">
        <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top_left,rgba(242,125,77,0.22),transparent_55%)]" />
        <div className="relative">
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-gold/85">
            {eyebrow}
          </p>
          <h1 className="mt-4 max-w-2xl font-display text-4xl leading-tight text-white sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-white/82 sm:text-lg">
            {description}
          </p>
          <div className="mt-8">{children}</div>
        </div>
      </section>

      <aside className="space-y-6">{aside}</aside>
    </div>
  );
}
