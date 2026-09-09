
interface SectionPageShellProps {
  kicker: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export default function SectionPageShell({ kicker, title, subtitle, children }: SectionPageShellProps) {
  return (
    <div className="mx-auto max-w-7xl px-6 pt-24 sm:pt-28 lg:pt-32 pb-24">
      <div className="animate-fade-up max-w-3xl mb-12 lg:mb-16">
        <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--gold)]">
          <span className="inline-block h-px w-6 bg-[var(--gold)]" />
          {kicker}
        </div>
        <h1 className="mt-4 font-['Playfair_Display'] text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[var(--brown)]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-4 max-w-2xl text-base sm:text-lg leading-relaxed text-[var(--muted)] font-medium">
            {subtitle}
          </p>
        )}
        {/* Decorative underline */}
        <div className="mt-6 h-1 w-20 rounded-full bg-gradient-to-r from-[var(--gold)] via-[var(--gold-light)] to-transparent" />
      </div>

      {children}
    </div>
  );
}
