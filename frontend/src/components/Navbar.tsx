import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useScroll, useMotionValueEvent, AnimatePresence, motion, useTransform } from 'framer-motion';
import { NAV_ITEMS } from '../constants/navItems';
import { SITE_NAME } from '../constants/content';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.location.pathname !== '/' && window.scrollY > 10;
  });

  const { scrollY, scrollYProgress } = useScroll();
  const location = useLocation();

  const isHome = location.pathname === '/';
  const isConnect = location.pathname === '/page/connect';

  // FIX 15: Progress bar width derived from scroll progress (home page only)
  const progressWidth = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  useMotionValueEvent(scrollY, 'change', (latest) => {
    if (isHome) return;

    const isScrolled = latest > 20;
    if (scrolled !== isScrolled) {
      setScrolled(isScrolled);
    }
  });

  // The hero owns its pin duration, so it also signals precisely when its visual
  // treatment ends. This keeps the navbar theme in sync if that duration changes.
  useEffect(() => {
    if (!isHome) return;

    const handleHeroThemeChange = (event: Event) => {
      setScrolled((event as CustomEvent<{ isLight: boolean }>).detail.isLight);
    };

    setScrolled(document.documentElement.dataset.heroNavbarTheme === 'light');
    window.addEventListener('hero-theme-change', handleHeroThemeChange);
    return () => window.removeEventListener('hero-theme-change', handleHeroThemeChange);
  }, [isHome]);

  // Close mobile menu on escape and keep non-home scroll styling responsive.
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };

    const handleResize = () => {
      if (isHome) return;

      const isScrolled = window.scrollY > 20;
      if (scrolled !== isScrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('keydown', handleKey);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('resize', handleResize);
    };
  }, [isHome, scrolled]);

  // Theme logic:
  // - Home: Starts dark (transparent), becomes light (cream) when scrolled past hero
  // - Connect: Always dark (uses brown palette)
  // - Others: Always light (cream)
  const isLight = isHome ? scrolled : !isConnect;

  let navBg = '';
  if (isLight) {
    navBg = mobileOpen
      ? 'rounded-2xl bg-[var(--cream)]/95 border-[var(--brown)]/12 shadow-[var(--brown)]/8'
      : 'rounded-[26px] bg-[var(--cream)]/80 border-[var(--brown)]/12 shadow-[var(--brown)]/8';
  } else if (isConnect) {
    navBg = mobileOpen
      ? 'rounded-2xl bg-[#3D2616]/95 border-[var(--gold)]/20 shadow-2xl shadow-black/40'
      : (scrolled
          ? 'rounded-[26px] bg-[#3D2616]/80 border-[var(--gold)]/20 shadow-lg shadow-black/30'
          : 'rounded-[26px] bg-transparent border-transparent shadow-none');
  } else {
    // Home Top
    navBg = mobileOpen
      ? 'rounded-2xl bg-black/40 border-white/10 shadow-black/10'
      : 'rounded-[26px] bg-black/20 border-white/10 shadow-black/10';
  }

  // To make the transition smoother, we apply transition classes to the nav wrapper
  const navClasses = `fixed top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-4xl z-50 transition-all duration-500 backdrop-blur-md border overflow-hidden ${
    !isLight && !mobileOpen && isConnect && !scrolled ? '' : 'shadow-lg'
  } ${navBg}`;

  const logoTextClass = isLight ? 'text-[var(--brown)]' : 'text-[var(--cream)]';
  const mutedTextClasses = isLight
    ? 'text-[var(--brown)]/80 font-medium hover:text-[var(--gold)] hover:bg-[var(--brown)]/5'
    : 'text-[var(--cream)]/90 font-medium hover:text-[var(--gold)] hover:bg-[var(--gold)]/10';
  const activeTextClasses = isLight
    ? 'text-[var(--gold)] font-bold bg-[var(--gold)]/8'
    : 'text-[var(--gold)] font-bold bg-[var(--gold)]/15 ring-1 ring-[var(--gold)]/30';
  const hamburgerClass = isLight
    ? 'text-[var(--brown)] hover:bg-[var(--brown)]/8'
    : 'text-[var(--cream)] hover:bg-[var(--gold)]/20';
  const dropdownItemBase = isLight
    ? 'hover:bg-[var(--brown)]/6 hover:text-[var(--gold)]'
    : 'hover:bg-[var(--gold)]/10 hover:text-[var(--gold)]';
  const dropdownItemActive = isLight
    ? 'bg-[var(--gold)]/8 text-[var(--gold)]'
    : 'bg-[var(--gold)]/15 text-[var(--gold)] ring-1 ring-[var(--gold)]/30';
  const dropdownItemInactive = isLight ? 'text-[var(--brown)]/80' : 'text-[var(--cream)]/90';
  const dropdownBorder = isLight ? 'border-[var(--brown)]/10' : 'border-[var(--gold)]/20';

  return (
    <>
      {/* Mobile menu overlay - MUST BE OUTSIDE NAV */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      <nav className={navClasses}>
        {/* FIX 15: Scroll progress bar — thin gold line at top, home page only */}
        {isHome && (
          <motion.div
            className="absolute top-0 left-0 h-[2px] bg-gradient-to-r from-[var(--gold)] to-[var(--gold-light)] z-50 pointer-events-none origin-left"
            style={{ width: progressWidth }}
          />
        )}

        <div className="mx-auto flex max-w-7xl items-center justify-between pl-3 pr-5 py-2.5">
          {/* Logo */}
          <NavLink
            to="/"
            className={`flex items-center gap-3 group transition-all duration-300 hover:scale-[1.03] ${logoTextClass}`}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--gold)] via-[var(--gold-light)] to-[var(--gold)] rounded-full blur-xl opacity-20 group-hover:opacity-35 transition-opacity duration-300"></div>
              <div className="relative bg-gradient-to-br from-[var(--gold)]/10 via-[var(--gold-light)]/5 to-[var(--gold)]/10 p-1.5 rounded-full border border-[var(--gold)]/20 backdrop-blur-sm">
                <img
                  src="/sprojectlogo.png"
                  alt="S Project Logo"
                  className="h-8 w-8 object-contain filter drop-shadow-sm transition-all duration-500 brightness-[2] contrast-150"
                />
              </div>
            </div>
            <span className="font-['Playfair_Display'] text-lg font-bold tracking-tight">
              {SITE_NAME}
            </span>
          </NavLink>

          {/* Desktop nav */}
          <div className="hidden items-center gap-1 md:flex">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.sectionId}
                to={item.path}
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 text-sm transition-all duration-300 ${
                    isActive ? activeTextClasses : mutedTextClasses
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>

          {/* Mobile toggle */}
          <button
            className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors md:hidden ${hamburgerClass}`}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            <div className="relative w-5 h-5">
              <span
                className={`absolute left-0 block h-0.5 w-5 bg-current transition-all duration-300 ${
                  mobileOpen ? 'top-2.5 rotate-45' : 'top-0.5'
                }`}
              />
              <span
                className={`absolute left-0 top-2.5 block h-0.5 w-5 bg-current transition-all duration-300 ${
                  mobileOpen ? 'opacity-0 scale-0' : 'opacity-100 scale-100'
                }`}
              />
              <span
                className={`absolute left-0 block h-0.5 w-5 bg-current transition-all duration-300 ${
                  mobileOpen ? 'top-2.5 -rotate-45' : 'top-[18px]'
                }`}
              />
            </div>
          </button>
        </div>

        {/* Mobile menu dropdown content */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className={`relative z-50 border-t md:hidden overflow-hidden ${dropdownBorder}`}
            >
              <div className="flex flex-col gap-1 px-6 py-4 max-h-[calc(100dvh-6rem)] overflow-y-auto">
                {NAV_ITEMS.map((item, i) => (
                  <motion.div
                    key={item.sectionId}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 + 0.1, duration: 0.3 }}
                  >
                    <NavLink
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) =>
                        `block rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${dropdownItemBase} ${
                          isActive
                            ? dropdownItemActive
                            : dropdownItemInactive
                        }`
                      }
                    >
                      {item.label}
                    </NavLink>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
}
