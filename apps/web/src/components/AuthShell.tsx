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
      <section className="relative overflow-hidden rounded-[36px] border border-amber-950/10 bg-paper/90 p-8 shadow-card sm:p-10">
        <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top_left,rgba(148,92,63,0.18),transparent_55%)]" />
        <div className="relative">
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-ember/80">
            {eyebrow}
          </p>
          <h1 className="mt-4 max-w-2xl font-display text-4xl leading-tight text-ink sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-stone-700 sm:text-lg">
            {description}
          </p>
          <div className="mt-8">{children}</div>
        </div>
      </section>

      <aside className="space-y-6">{aside}</aside>
    </div>
  );
}
