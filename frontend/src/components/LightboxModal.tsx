import { useEffect, useRef, useState, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import OptimizedImage from './OptimizedImage';

export interface LightboxModalProps {
  isOpen: boolean;
  images: string[];
  imageBlurUrls?: string[];
  currentIndex: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
  title?: string;
}

export default function LightboxModal({
  isOpen,
  images,
  imageBlurUrls,
  currentIndex,
  onClose,
  onIndexChange,
  title,
}: LightboxModalProps) {
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const [touchDeltaX, setTouchDeltaX] = useState<number>(0);
  const thumbnailRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const total = images.length;

  const next = useCallback(() => {
    if (total <= 1) return;
    onIndexChange((currentIndex + 1) % total);
  }, [currentIndex, total, onIndexChange]);

  const prev = useCallback(() => {
    if (total <= 1) return;
    onIndexChange((currentIndex - 1 + total) % total);
  }, [currentIndex, total, onIndexChange]);

  // Keyboard navigation & Escape to close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, prev, next]);

  // Body scroll locking when open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Auto-scroll active thumbnail into view
  useEffect(() => {
    if (!isOpen || total <= 1) return;
    const activeThumb = thumbnailRefs.current[currentIndex];
    if (activeThumb) {
      activeThumb.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  }, [currentIndex, isOpen, total]);

  // Mobile Touch Gestures (Swipe Left / Right)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setTouchDeltaX(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - touchStartX.current;
    const diffY = currentY - touchStartY.current;

    // Only track if horizontal swipe dominates
    if (Math.abs(diffX) > Math.abs(diffY)) {
      setTouchDeltaX(diffX);
    }
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null) return;

    const SWIPE_THRESHOLD = 45; // pixels
    if (touchDeltaX < -SWIPE_THRESHOLD) {
      next(); // Swiped left -> next
    } else if (touchDeltaX > SWIPE_THRESHOLD) {
      prev(); // Swiped right -> prev
    }

    touchStartX.current = null;
    touchStartY.current = null;
    setTouchDeltaX(0);
  };

  if (!isOpen || images.length === 0) return null;

  const currentImage = images[currentIndex] || images[0];
  const currentBlur = imageBlurUrls?.[currentIndex];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/92 backdrop-blur-2xl animate-fade-in select-none overflow-hidden"
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── Top Bar: Title, Counter & Close Button ── */}
      <div
        className="absolute top-0 left-0 right-0 z-40 flex items-center justify-between p-4 sm:p-6 pointer-events-none"
      >
        {/* Counter & Optional Title */}
        <div className="flex items-center gap-3 pointer-events-auto">
          <span className="rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-bold tracking-widest text-white/90 shadow-md backdrop-blur-md ring-1 ring-white/15">
            {currentIndex + 1} / {total}
          </span>
          {title && (
            <span className="hidden text-xs sm:text-sm font-medium text-white/70 truncate max-w-xs sm:max-w-md drop-shadow sm:inline-block">
              {title}
            </span>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="pointer-events-auto flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-all duration-200 hover:bg-white/20 hover:scale-105 active:scale-95 ring-1 ring-white/15 shadow-lg cursor-pointer"
          aria-label="Close image viewer"
        >
          <X className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>
      </div>

      {/* ── Desktop Navigation Arrows (Anchored to Screen Edges) ── */}
      {total > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            className="absolute left-3 sm:left-6 md:left-8 top-1/2 -translate-y-1/2 z-40 hidden sm:flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition-all duration-200 hover:bg-white/20 hover:scale-110 active:scale-95 ring-1 ring-white/15 shadow-2xl cursor-pointer pointer-events-auto"
            aria-label="Previous photo"
          >
            <ChevronLeft className="h-6 w-6 sm:h-7 sm:w-7" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            className="absolute right-3 sm:right-6 md:right-8 top-1/2 -translate-y-1/2 z-40 hidden sm:flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition-all duration-200 hover:bg-white/20 hover:scale-110 active:scale-95 ring-1 ring-white/15 shadow-2xl cursor-pointer pointer-events-auto"
            aria-label="Next photo"
          >
            <ChevronRight className="h-6 w-6 sm:h-7 sm:w-7" />
          </button>
        </>
      )}

      {/* ── Center Stage: Main Image ── */}
      <div
        className="relative z-20 flex h-full w-full items-center justify-center px-4 sm:px-20 md:px-28 pt-16 sm:pt-20 pb-24 sm:pb-28 pointer-events-none"
      >
        <div
          className="relative max-h-full max-w-full flex items-center justify-center transition-transform duration-150 ease-out pointer-events-auto"
          style={{
            transform: touchDeltaX !== 0 ? `translateX(${touchDeltaX * 0.4}px)` : 'none',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <OptimizedImage
            key={`lb-img-${currentIndex}`}
            src={currentImage}
            blurSrc={currentBlur}
            alt={title || `Photo ${currentIndex + 1}`}
            fit="contain"
            loading="eager"
            fetchPriority="high"
            imgClassName="max-h-[68vh] sm:max-h-[74vh] md:max-h-[78vh] max-w-[92vw] sm:max-w-[85vw] md:max-w-[80vw] w-auto h-auto rounded-2xl object-contain shadow-[0_25px_60px_rgba(0,0,0,0.9)] ring-1 ring-white/10"
          />
        </div>
      </div>

      {/* ── Bottom Section: Floating Centered Filmstrip ── */}
      {total > 1 && (
        <div
          className="absolute bottom-3 sm:bottom-6 left-0 right-0 z-40 flex flex-col items-center gap-2 pointer-events-none px-4"
        >
          {/* Mobile Swipe Hint */}
          <span className="text-[11px] font-medium text-white/50 sm:hidden drop-shadow pointer-events-none">
            Swipe left or right to browse
          </span>

          {/* Filmstrip Capsule */}
          <div
            className="pointer-events-auto w-fit max-w-[min(92vw,720px)] mx-auto flex items-center justify-center gap-2 sm:gap-2.5 overflow-x-auto p-1.5 sm:p-2 rounded-2xl bg-black/60 backdrop-blur-xl ring-1 ring-white/15 shadow-2xl scrollbar-none"
            onClick={(e) => e.stopPropagation()}
          >
            {images.map((img, idx) => (
              <button
                key={idx}
                ref={(el) => {
                  thumbnailRefs.current[idx] = el;
                }}
                onClick={() => onIndexChange(idx)}
                className={`relative h-11 w-14 sm:h-14 sm:w-20 shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                  idx === currentIndex
                    ? 'border-[var(--gold)] scale-105 shadow-[0_0_12px_rgba(200,150,42,0.45)] ring-1 ring-[var(--gold)]/40 opacity-100'
                    : 'border-white/10 opacity-40 hover:opacity-85 hover:border-white/40'
                }`}
                aria-label={`Go to photo ${idx + 1}`}
              >
                <img src={img} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
