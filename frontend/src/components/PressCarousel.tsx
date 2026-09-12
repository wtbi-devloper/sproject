import {
  useRef,
  useState,
  useEffect,
  useCallback,
  type MutableRefObject,
} from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Newspaper, ArrowUpRight } from 'lucide-react';
import OptimizedImage from './OptimizedImage';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface PressItem {
  _id: string;
  outlet: string;
  outletLogo?: string;
  outletLogoBlurUrl?: string;
  mediaType?: string;
  title: string;
  year: string;
  link?: string;
  url?: string;
  images?: string[];
  imageBlurUrls?: string[];
}

interface PressCarouselProps {
  items: PressItem[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

// FIX 11: Increased from 3000ms → 5000ms so users have time to read card titles
const AUTO_ROTATE_MS = 5000;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function mod(n: number, m: number) {
  return ((n % m) + m) % m;
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared Card Content
// ─────────────────────────────────────────────────────────────────────────────

function PressCardContent({ item, isCenter, onClick }: { item: PressItem; isCenter: boolean; onClick?: (e: React.MouseEvent) => void }) {
  const href = item.link || item.url;
  const image = item.images?.[0];
  const mediaType = item.mediaType || 'Newspaper';

  return (
    <div
      className={`group flex flex-col overflow-hidden rounded-[26px] border border-[var(--gold)]/20 transition-all duration-300 ease-out h-full select-none ${
        isCenter ? 'hover:-translate-y-2 hover:shadow-2xl' : ''
      }`}
      onClick={(e) => {
        if (onClick) onClick(e);
        else if (href) window.open(href, '_blank', 'noopener,noreferrer');
      }}
      style={{
        backgroundColor: '#FFFFFF',
        cursor: href && isCenter ? 'pointer' : 'default',
        boxShadow: isCenter
          ? '0 20px 40px -15px rgba(44,26,14,0.18), 0 0 0 1px rgba(200,150,42,0.15)'
          : '0 8px 24px -10px rgba(44,26,14,0.12)',
      }}
    >
      {/* 1. Masthead Header: Top-Left Year + Media Format, Top-Right Logo/Badge, and Full Outlet Title */}
      <div className="flex flex-col gap-2 px-5 py-3.5 sm:px-6 sm:py-4 bg-[#FAF8F5] border-b border-[var(--brown)]/8">
        {/* Top row: Format pill on left, Logo or 'Press Coverage' on top right */}
        <div className="flex items-center justify-between gap-3 min-h-[44px]">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-black uppercase tracking-wider shrink-0"
            style={{
              backgroundColor: 'rgba(200,150,42,0.12)',
              color: 'var(--gold)',
              border: '1px solid rgba(200,150,42,0.25)',
            }}
          >
            <Newspaper className="h-3 w-3 shrink-0" />
            <span>{item.year} · {mediaType}</span>
          </span>

          {/* Top-Right: Logo if available, else 'Press Coverage' text */}
          {item.outletLogo ? (
            <div className="h-10 sm:h-12 max-w-[150px] sm:max-w-[180px] flex items-center justify-end shrink-0">
              <img
                src={item.outletLogo}
                alt={item.outlet}
                className="max-h-10 sm:max-h-12 max-w-full object-contain object-right pointer-events-none drop-shadow-xs"
              />
            </div>
          ) : (
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]/60 shrink-0">
              Press Coverage
            </span>
          )}
        </div>

        {/* Outlet Title row: Always visible, full text with no clipping */}
        <div className="flex items-center min-h-[26px]">
          <h4
            className="font-['Playfair_Display'] font-black text-sm sm:text-base tracking-wide uppercase text-[var(--brown)] leading-snug break-words"
            title={item.outlet}
          >
            {item.outlet}
          </h4>
        </div>
      </div>

      {/* 2. Newspaper Clipping Preview Frame */}
      <div className="relative w-full aspect-[16/10] overflow-hidden shrink-0 bg-[#F5F2EA] border-b border-[var(--brown)]/6">
        {image ? (
          <>
            <OptimizedImage
              src={image}
              blurSrc={item.imageBlurUrls?.[0]}
              alt={`${item.outlet} — ${item.title}`}
              fit="cover"
              loading={isCenter ? 'eager' : 'lazy'}
              fetchPriority={isCenter ? 'high' : undefined}
              className="block h-full w-full"
              imgClassName="block h-full w-full pointer-events-none select-none transition-transform duration-700 group-hover:scale-105 object-cover"
            />
            {/* Subtle newsprint inner shadow vignette */}
            <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_15px_rgba(44,26,14,0.12)]" />
          </>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-[#F5F2EA] via-[#EFECE3] to-[#F5F2EA]">
            <Newspaper className="h-10 w-10 text-[var(--gold)]/40 mb-2" />
            <span className="text-xs font-bold uppercase tracking-widest text-[var(--brown)]/50">
              Editorial Feature
            </span>
          </div>
        )}
      </div>

      {/* 3. Headline & Meta */}
      <div className="px-5 py-4 sm:px-6 sm:py-5 flex flex-col justify-between flex-1 bg-white gap-3">
        <div>
          <h3
            className="font-bold leading-snug transition-colors duration-200 group-hover:text-[var(--gold)] line-clamp-2 sm:line-clamp-3"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(1rem, 0.95rem + 0.5vw, 1.25rem)',
              color: 'var(--brown)',
            }}
            title={item.title}
          >
            {item.title}
          </h3>
        </div>

        {/* 4. Action Footer */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-[var(--brown)]/6 text-xs">
          <span
            className="flex-1 min-w-0 text-[11.5px] font-semibold text-[var(--muted)] truncate"
            title={item.outlet}
          >
            {item.outlet}
          </span>
          <span className="inline-flex items-center gap-1 font-bold text-[var(--gold)] group-hover:translate-x-1 transition-transform shrink-0">
            Read Article
            <ArrowUpRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Desktop 3D Carousel (Framer Motion)
// ─────────────────────────────────────────────────────────────────────────────

function DesktopCarousel({ items, activeIdx, navigate, jumpTo, isDraggingRef, draggedFarRef, isMobile }: {
  items: PressItem[];
  activeIdx: number;
  navigate: (dir: 'next' | 'prev') => void;
  jumpTo: (realIdx: number) => void;
  isDraggingRef: MutableRefObject<boolean>;
  draggedFarRef: MutableRefObject<boolean>;
  isMobile: boolean;
}) {
  const count = items.length;
  const dragStartXRef = useRef(0);
  const clickStartRef = useRef({ x: 0, y: 0, time: 0 });

  const spread = isMobile ? 180 : 260;
  const zDepth = isMobile ? 120 : 180;

  return (
    <div 
      className="relative w-full h-[420px] sm:h-[460px] md:h-[520px] lg:h-[580px] flex items-center justify-center overflow-visible"
      style={{ perspective: isMobile ? 800 : 1200 }}
    >
      {items.map((item: PressItem, idx: number) => {
        let offset = (idx - activeIdx) % count;
        if (offset > count / 2) offset -= count;
        if (offset < -count / 2) offset += count;

        const isCenter = offset === 0;
        const absOffset = Math.abs(offset);
        
        // Stack layout calculations
        const x = offset * spread; // Spread out visually
        const y = absOffset * (isMobile ? 20 : 35); // Push background cards down slightly
        const z = -absOffset * zDepth;
        const rotateY = offset * -15;
        const rotateZ = offset * 8; // Fan out like a hand of cards
        const zIndex = 30 - absOffset;
        
        // Show only center and its immediate neighbors to keep it clean
        const opacity = absOffset === 0 ? 1 : absOffset === 1 ? (isMobile ? 0.6 : 0.4) : 0;
        const pointerEvents = absOffset > 1 ? 'none' : 'auto';

        return (
          <motion.div
            key={item._id}
            className="absolute w-[280px] sm:w-[320px] md:w-[420px] lg:w-[460px] cursor-grab active:cursor-grabbing origin-bottom"
            initial={false}
            animate={{
              x,
              y,
              z,
              rotateY,
              rotateZ,
              zIndex,
              opacity,
            }}
            transition={{
              type: 'spring',
              stiffness: 250,
              damping: 30,
              mass: 1
            }}
            style={{ 
              pointerEvents,
              transformStyle: 'preserve-3d'
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onPointerDown={(e) => {
              clickStartRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
            }}
            onDragStart={(_, info) => {
              isDraggingRef.current = true;
              draggedFarRef.current = false;
              dragStartXRef.current = info.point.x;
            }}
            onDragEnd={(_, info) => {
              setTimeout(() => { isDraggingRef.current = false; }, 50);
              const draggedDist = info.point.x - dragStartXRef.current;
              const swipeThreshold = 40;
              
              if (Math.abs(draggedDist) > swipeThreshold) {
                draggedFarRef.current = true;
              }

              if (draggedDist < -swipeThreshold) {
                navigate('next');
              } else if (draggedDist > swipeThreshold) {
                navigate('prev');
              }
            }}
          >
            {/* Overlay intercepts clicks on background cards */}
            {!isCenter && (
              <div 
                className="absolute inset-0 z-50 cursor-pointer rounded-[28px]"
                onClick={() => {
                  if (!isDraggingRef.current && !draggedFarRef.current) jumpTo(idx);
                }}
              />
            )}
            
            <PressCardContent 
              item={item} 
              isCenter={isCenter} 
              onClick={(e) => {
                const dx = Math.abs(e.clientX - clickStartRef.current.x);
                const dy = Math.abs(e.clientY - clickStartRef.current.y);
                const dt = Date.now() - clickStartRef.current.time;
                
                // If it moved more than 10px or took longer than 500ms, it's a drag or long-press, not a click
                if (dx > 10 || dy > 10 || dt > 500) return;

                const href = item.link || item.url;
                if (href && isCenter) {
                  window.open(href, '_blank', 'noopener,noreferrer');
                }
              }}
            />
          </motion.div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export default function PressCarousel({ items }: PressCarouselProps) {
  const count = items.length;

  const [activeIdx, setActiveIdx] = useState(0);
  const activeIdxRef = useRef(0); 
  const [liveText, setLiveText] = useState('');
  const [isDesktop, setIsDesktop] = useState(false);

  const isTouchingRef = useRef(false);
  const isFocusedRef = useRef(false);
  const isDraggingRef = useRef(false);

  const lastAdvanceRef = useRef<number>(0);
  // Initialize with current time after mount to avoid impure function in render
  useEffect(() => {
    lastAdvanceRef.current = Date.now();
  }, []);
  const draggedFarRef = useRef(false);

  // Handle responsive architecture
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    setTimeout(() => setIsDesktop(mq.matches), 0);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // ── programmatic navigation ──────
  const navigate = useCallback(
    (dir: 'next' | 'prev') => {
      if (count <= 1) return;
      const current = activeIdxRef.current;
      const newIdx = mod(current + (dir === 'next' ? 1 : -1), count);
      setLiveText(`Now showing: ${items[newIdx].outlet} — ${items[newIdx].title}`);
      setActiveIdx(newIdx);
      activeIdxRef.current = newIdx;
      lastAdvanceRef.current = Date.now();
    },
    [count, items],
  );

  const jumpTo = useCallback(
    (realIdx: number) => {
      if (realIdx === activeIdxRef.current) return;
      setLiveText(`Now showing: ${items[realIdx].outlet} — ${items[realIdx].title}`);
      setActiveIdx(realIdx);
      activeIdxRef.current = realIdx;
      lastAdvanceRef.current = Date.now();
    },
    [items], 
  );

  // ── autoplay ──────
  useEffect(() => {
    if (count <= 1) return;
    const id = setInterval(() => {
      if (isTouchingRef.current || isFocusedRef.current || isDraggingRef.current) return;
      if (Date.now() - lastAdvanceRef.current >= AUTO_ROTATE_MS) {
        navigate('next');
      }
    }, 250);
    return () => clearInterval(id);
  }, [count, navigate]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLElement>) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); navigate('prev'); }
      if (e.key === 'ArrowRight') { e.preventDefault(); navigate('next'); }
    },
    [navigate],
  );

  const handleFocusIn = useCallback((e: React.FocusEvent) => { 
    try {
      if ((e.target as Element).matches(':focus-visible')) {
        isFocusedRef.current = true; 
      }
    } catch {
      isFocusedRef.current = true;
    }
  }, []);
  
  const handleFocusOut = useCallback(() => {
    isFocusedRef.current = false;
    lastAdvanceRef.current = Date.now();
  }, []);

  if (count === 0) return null;

  return (
    <section
      id="press"
      className="scroll-mt-24 py-20 lg:py-28 overflow-hidden"
      aria-label="Press & Media carousel"
      aria-roledescription="carousel"
      onFocusCapture={handleFocusIn}
      onBlurCapture={handleFocusOut}
      onKeyDown={handleKeyDown}
    >
      <div className="mx-auto max-w-7xl px-6 mb-10 sm:mb-14">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--gold)]">
              <span className="inline-block h-px w-6 bg-[var(--gold)]" />
              Press &amp; Media
            </div>
            <h2 className="mt-3 font-['Playfair_Display'] text-3xl font-bold tracking-tight text-[var(--brown)] sm:text-4xl lg:text-5xl">
              In the News
            </h2>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 w-full sm:w-auto mt-2 sm:mt-0">
            {count > 1 && (
              <div className="flex items-center gap-2" role="tablist" aria-label="Press items">
                {items.map((item, i) => (
                  <button
                    key={item._id}
                    type="button"
                    role="tab"
                    aria-selected={i === activeIdx}
                    aria-label={`Go to press item ${i + 1}: ${item.outlet}`}
                    onClick={() => jumpTo(i)}
                    className="rounded-full transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                    style={{
                      width: i === activeIdx ? '1.5rem' : '0.45rem',
                      height: '0.45rem',
                      background: i === activeIdx ? 'var(--gold)' : 'var(--muted)',
                      opacity: i === activeIdx ? 1 : 0.35,
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  />
                ))}
              </div>
            )}
            <NavLink
              to="/page/press"
              className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[var(--gold)] to-[var(--gold-light)] px-5 py-2 sm:px-6 sm:py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-[var(--gold)]/20 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[var(--gold)]/30 shrink-0"
            >
              View All Coverage
              <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
            </NavLink>
          </div>
        </div>
      </div>

      <div className="relative">
        {/* 3D Stacked Carousel (Now for both Mobile & Desktop) */}
        <DesktopCarousel 
          items={items} 
          activeIdx={activeIdx} 
          navigate={navigate}
          jumpTo={jumpTo}
          isDraggingRef={isDraggingRef}
          draggedFarRef={draggedFarRef}
          isMobile={!isDesktop}
        />

        {/* Arrow controls — desktop only */}
        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => navigate('prev')}
              aria-label="Previous press item"
              className="hidden md:flex absolute left-3 lg:left-6 top-[calc(50%-2rem)] -translate-y-1/2 h-11 w-11 items-center justify-center rounded-full transition-transform duration-150 hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 z-50"
              style={{ backgroundColor: 'var(--card-bg)', color: 'var(--brown)', boxShadow: '0 6px 20px rgba(44,26,14,0.18)' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => navigate('next')}
              aria-label="Next press item"
              className="hidden md:flex absolute right-3 lg:right-6 top-[calc(50%-2rem)] -translate-y-1/2 h-11 w-11 items-center justify-center rounded-full transition-transform duration-150 hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 z-50"
              style={{ backgroundColor: 'var(--card-bg)', color: 'var(--brown)', boxShadow: '0 6px 20px rgba(44,26,14,0.18)' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </>
        )}
      </div>


      {/* Screen reader live region */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {liveText}
      </div>
    </section>
  );
}