import type { ReactNode } from "react";

interface FeatureCardProps {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
}

export function FeatureCard({
  eyebrow,
  title,
  description,
  children
}: FeatureCardProps) {
  return (
    <article className="rounded-[28px] border border-white/10 bg-paper/90 p-6 shadow-card backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-ember/80">
        {eyebrow}
      </p>
      <h3 className="mt-3 font-display text-2xl text-ink">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-ink/86">{description}</p>
      {children ? <div className="mt-5">{children}</div> : null}
    </article>
  );
}
