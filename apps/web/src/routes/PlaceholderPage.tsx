interface PlaceholderPageProps {
  title: string;
  description: string;
}

export function PlaceholderPage({
  title,
  description
}: PlaceholderPageProps) {
  return (
    <section className="rounded-[32px] border border-stone-900/10 bg-paper/85 p-10 shadow-card">
      <p className="text-sm font-semibold uppercase tracking-[0.28em] text-ember/75">
        Module scaffold
      </p>
      <h1 className="mt-4 font-display text-4xl text-ink">{title}</h1>
      <p className="mt-5 max-w-2xl text-base leading-7 text-stone-700">
        {description}
      </p>
    </section>
  );
}
