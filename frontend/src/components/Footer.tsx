import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useScroll, useMotionValueEvent } from 'framer-motion';
import { SITE_NAME, FOOTER_TEXT } from '../constants/content';
import { NAV_ITEMS } from '../constants/navItems';
import { ChevronUp } from 'lucide-react';
import useSocialLinks from '../hooks/useSocialLinks';

export default function Footer() {
  const [showBackToTop, setShowBackToTop] = useState(false);
  const { socialButtons } = useSocialLinks();
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, 'change', (latest) => {
    const previous = scrollY.getPrevious() || 0;
    const isScrollingUp = latest < previous;
    
    // Only show the button if past 400px AND the user is scrolling up
    const shouldShow = latest > 400 && isScrollingUp;
    
    if (showBackToTop !== shouldShow) {
      setShowBackToTop(shouldShow);
    }
  });

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <footer className="border-t border-[var(--gold)]/20 bg-[var(--brown)]">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-[var(--gold)] via-[var(--gold-light)] to-[var(--gold)] rounded-full blur-lg opacity-25"></div>
                  <div className="relative bg-gradient-to-br from-[var(--gold)]/15 via-[var(--gold-light)]/10 to-[var(--gold)]/15 p-1.5 rounded-full border border-[var(--gold)]/25 backdrop-blur-sm">
                    <img
                      src="/sprojectlogo.png"
                      alt="S Project Logo"
                      className="h-12 w-12 object-contain filter drop-shadow-sm"
                    />
                  </div>
                </div>
                <span className="font-['Playfair_Display'] text-lg font-bold text-[var(--cream)]">
                  {SITE_NAME}
                </span>
              </div>
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-[var(--cream)]/50">
                Social Entrepreneur, Philanthropist & Humanitarian — creating impact through community building.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gold)]">
                Quick Links
              </h3>
              <ul className="mt-4 space-y-2.5">
                {NAV_ITEMS.map((item) => (
                  <li key={item.sectionId}>
                    <NavLink
                      to={item.path}
                      className="text-sm text-[var(--cream)]/60 transition-colors hover:text-[var(--gold)]"
                    >
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>

            {/* Connect */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gold)]">
                Connect With Me
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-[var(--cream)]/50">
                Interested in collaborating or just want to say hello?
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                {socialButtons.map((s) => (
                  <a
                    key={s.key}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--cream)]/15 text-[var(--cream)]/60 transition-all duration-200 hover:border-[var(--gold)] hover:bg-[var(--gold)] hover:text-white"
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
              <NavLink
                to="/page/connect"
                className="mt-5 inline-flex items-center gap-2 rounded-xl border border-[var(--gold)]/30 px-5 py-2.5 text-sm font-semibold text-[var(--gold)] transition-all duration-200 hover:bg-[var(--gold)] hover:text-white"
              >
                Contact Me
                <span>→</span>
              </NavLink>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-[var(--cream)]/10 pt-6 sm:flex-row">
            <p className="text-sm text-[var(--cream)]/40 text-center sm:text-left">
              {FOOTER_TEXT}
            </p>
            <button
              onClick={scrollToTop}
              className="text-sm text-[var(--cream)]/40 transition-colors hover:text-[var(--gold)]"
            >
              Back to top ↑
            </button>
          </div>
        </div>
      </footer>

      {/* Floating back-to-top button */}
      <button
        onClick={scrollToTop}
        className={`back-to-top ${showBackToTop ? 'visible' : ''}`}
        aria-label="Back to top"
      >
        <span className="back-to-top__icon" aria-hidden="true">
          <ChevronUp size={18} strokeWidth={2.75} />
        </span>
      </button>
    </>
  );
}
