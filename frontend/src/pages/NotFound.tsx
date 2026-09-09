import { NavLink } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="relative flex min-h-[calc(100vh-140px)] flex-col items-center justify-center overflow-hidden px-6 pt-24 sm:pt-28 lg:pt-32 pb-20 text-center">
      {/* Background decorations */}
      <div className="absolute top-1/4 left-1/4 h-64 w-64 rounded-full bg-[var(--gold)]/5 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 h-48 w-48 rounded-full bg-[var(--gold)]/3 blur-3xl" />

      <div className="relative animate-fade-up">
        <div className="font-['Playfair_Display'] text-[10rem] font-bold leading-none text-[var(--gold)]/10 select-none">
          404
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="font-['Playfair_Display'] text-6xl font-bold text-[var(--gold)]">
            404
          </div>
        </div>
      </div>

      <h1 className="animate-fade-up animate-fade-up-1 relative mt-4 font-['Playfair_Display'] text-2xl font-bold text-[var(--brown)]">
        Page Not Found
      </h1>

      <p className="animate-fade-up animate-fade-up-2 relative mt-3 max-w-md text-sm leading-relaxed text-[var(--muted)]">
        The page you're looking for doesn't exist or has been moved. Let's get you back on track.
      </p>

      <div className="animate-fade-up animate-fade-up-3 relative mt-8 flex gap-4">
        <NavLink
          to="/"
          className="rounded-xl bg-gradient-to-r from-[var(--gold)] to-[var(--gold-light)] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[var(--gold)]/20 transition-all duration-300 hover:shadow-xl hover:shadow-[var(--gold)]/30 hover:-translate-y-0.5"
        >
          Back to Home
        </NavLink>
        <NavLink
          to="/page/connect"
          className="rounded-xl border border-[var(--brown)]/20 px-6 py-3 text-sm font-semibold text-[var(--brown)] transition-all duration-300 hover:border-[var(--gold)] hover:bg-[var(--cream)] hover:-translate-y-0.5"
        >
          Contact Me
        </NavLink>
      </div>
    </div>
  );
}
