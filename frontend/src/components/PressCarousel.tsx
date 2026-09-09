import {
  useRef,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import OptimizedImage from './OptimizedImage';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface PressItem {
  _id: string;
  outlet: string;
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

const AUTO_ROTATE_MS = 3000;

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

  return (
    <div
      className={`group flex flex-col overflow-hidden rounded-[28px] transition-all duration-300 ease-out h-full ${isCenter ? 'hover:-translate-y-2 hover:shadow-2xl' : ''}`}
      onClick={(e) => {
        if (onClick) onClick(e);
        else if (href) window.open(href, '_blank', 'noopener,noreferrer');
      }}
      style={{
        backgroundColor: 'var(--card-bg)',
        cursor: href && isCenter ? 'pointer' : 'default',
        boxShadow: '0 8px 20px -8px rgba(44,26,14,0.15)',
      }}
    >
      <div className="relative w-full aspect-[4/3] overflow-hidden shrink-0">
        {image ? (
          <OptimizedImage
            src={image}
            blurSrc={item.imageBlurUrls?.[0]}
            alt={`${item.outlet} — ${item.title}`}
            fit="cover"
            loading={isCenter ? 'eager' : 'lazy'}
            fetchPriority={isCenter ? 'high' : undefined}
            className="h-full w-full"
            imgClassName="h-full w-full pointer-events-none select-none"
          />
        ) : (
          <div
            className="h-full w-full"
            style={{ background: 'linear-gradient(135deg, var(--cream), var(--card-bg))' }}
          />
        )}
      </div>

      <div className="px-6 py-6 sm:px-7 sm:py-7 flex flex-col gap-3 flex-1 bg-[var(--card-bg)]">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-sm font-semibold" style={{ color: 'var(--gold)' }}>
            {item.outlet}
          </span>
          <span className="text-xs" style={{ color: 'var(--muted)' }}>
            {item.year}
          </span>
        </div>

        <h3
          className="font-bold leading-snug"
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(1.1rem, 1rem + 1vw, 1.5rem)',
            color: 'var(--brown)',
          }}
        >
          {item.title}
        </h3>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Desktop 3D Carousel (Framer Motion)
// ─────────────────────────────────────────────────────────────────────────────

function DesktopCarousel({ items, activeIdx, navigate, jumpTo, isDraggingRef, draggedFarRef, isMobile }: any) {
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

  const lastAdvanceRef = useRef<number>(Date.now());
  const draggedFarRef = useRef(false);

  // Handle responsive architecture
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    setIsDesktop(mq.matches);
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