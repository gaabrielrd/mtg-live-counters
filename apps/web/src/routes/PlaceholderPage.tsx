interface PlaceholderPageProps {
  title: string;
  description: string;
}

export function PlaceholderPage({
  title,
  description
}: PlaceholderPageProps) {
  return (
    <section className="rounded-[32px] border border-white/10 bg-[linear-gradient(155deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-10 shadow-card">
      <p className="text-sm font-semibold uppercase tracking-[0.28em] text-gold/85">
        Coming next
      </p>
      <h1 className="mt-4 font-display text-4xl text-ink">{title}</h1>
      <p className="mt-5 max-w-2xl text-base leading-7 text-ink/86">
        {description}
      </p>
    </section>
  );
}
