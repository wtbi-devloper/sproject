import { useEffect, useRef, useState, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Minus, Plus } from 'lucide-react';
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
  const touchStartDistance = useRef<number>(0);
  const lastTapTime = useRef<number>(0);
  const panStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [touchDeltaX, setTouchDeltaX] = useState<number>(0);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [zoomCenter, setZoomCenter] = useState<{ x: number; y: number } | null>(null);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isZooming, setIsZooming] = useState<boolean>(false);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const thumbnailRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const imageRef = useRef<HTMLDivElement>(null);
  const total = images.length;

  const resetZoom = useCallback(() => {
    setZoomLevel(1);
    setZoomCenter(null);
    setPanOffset({ x: 0, y: 0 });
    setIsZooming(false);
    setIsPanning(false);
  }, []);

  const next = useCallback(() => {
    if (total <= 1) return;
    onIndexChange((currentIndex + 1) % total);
    resetZoom();
  }, [currentIndex, total, onIndexChange, resetZoom]);

  const prev = useCallback(() => {
    if (total <= 1) return;
    onIndexChange((currentIndex - 1 + total) % total);
    resetZoom();
  }, [currentIndex, total, onIndexChange, resetZoom]);

  const handleZoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(prev + 0.5, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel(prev => {
      const nextLevel = Math.max(prev - 0.5, 1);
      if (nextLevel === 1) {
        setZoomCenter(null);
        setPanOffset({ x: 0, y: 0 });
      }
      return nextLevel;
    });
  }, []);

  const zoomToPoint = useCallback((clientX: number, clientY: number) => {
    const rect = imageRef.current?.getBoundingClientRect();
    if (rect) {
      if (zoomLevel > 1.05) {
        resetZoom();
      } else {
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        setZoomCenter({ x, y });
        setPanOffset({ x: 0, y: 0 });
        setZoomLevel(2.5);
      }
    }
  }, [zoomLevel, resetZoom]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    zoomToPoint(e.clientX, e.clientY);
  }, [zoomToPoint]);

  // Keyboard navigation & Escape to close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
      if (e.key === '+' || e.key === '=') handleZoomIn();
      if (e.key === '-' || e.key === '_') handleZoomOut();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, prev, next, handleZoomIn, handleZoomOut]);

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

  // Mobile / Tablet Touch Gestures:
  // - 1 finger (unzoomed): swipe left/right to navigate
  // - 1 finger (zoomed): pan / drag image across view
  // - 2 fingers: pinch to zoom into the exact point between fingers
  // - Double-tap: zoom in at the tapped point
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const [t1, t2] = [e.touches[0], e.touches[1]];
      touchStartDistance.current = Math.hypot(
        t2.clientX - t1.clientX,
        t2.clientY - t1.clientY
      );
      setIsZooming(true);
      setIsPanning(false);

      // Set zoom origin to the midpoint between the 2 fingers if not yet zoomed
      const rect = imageRef.current?.getBoundingClientRect();
      if (rect) {
        const midX = (t1.clientX + t2.clientX) / 2 - rect.left;
        const midY = (t1.clientY + t2.clientY) / 2 - rect.top;
        if (zoomLevel <= 1.05) {
          setZoomCenter({ x: midX, y: midY });
        }
      }

      touchStartX.current = null;
      touchStartY.current = null;
      setTouchDeltaX(0);
      return;
    }

    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const now = Date.now();

      // Detect double tap (within 300ms)
      if (now - lastTapTime.current < 300) {
        zoomToPoint(touch.clientX, touch.clientY);
        lastTapTime.current = 0;
        touchStartX.current = null;
        touchStartY.current = null;
        return;
      }
      lastTapTime.current = now;

      touchStartX.current = touch.clientX;
      touchStartY.current = touch.clientY;
      setTouchDeltaX(0);

      if (zoomLevel > 1) {
        setIsPanning(true);
        panStart.current = {
          x: touch.clientX - panOffset.x,
          y: touch.clientY - panOffset.y,
        };
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStartDistance.current > 0) {
      const [t1, t2] = [e.touches[0], e.touches[1]];
      const distance = Math.hypot(
        t2.clientX - t1.clientX,
        t2.clientY - t1.clientY
      );
      const scale = distance / touchStartDistance.current;
      touchStartDistance.current = distance;
      setZoomLevel((prevLevel) => {
        const nextLevel = Math.min(4, Math.max(1, prevLevel * scale));
        if (nextLevel <= 1.05) {
          setZoomCenter(null);
          setPanOffset({ x: 0, y: 0 });
        }
        return nextLevel;
      });
      return;
    }

    if (e.touches.length === 1) {
      if (touchStartX.current === null || touchStartY.current === null) return;
      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;

      if (zoomLevel > 1) {
        // Panning the image
        const newX = currentX - panStart.current.x;
        const newY = currentY - panStart.current.y;
        
        // Calculate bounds based on zoom level and screen size
        const maxOffset = (zoomLevel - 1) * 200;
        setPanOffset({
          x: Math.max(-maxOffset, Math.min(maxOffset, newX)),
          y: Math.max(-maxOffset, Math.min(maxOffset, newY)),
        });
      } else {
        // Swiping carousel
        const diffX = currentX - touchStartX.current;
        const diffY = currentY - touchStartY.current;

        if (Math.abs(diffX) > Math.abs(diffY)) {
          setTouchDeltaX(diffX);
        }
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2 && isZooming) {
      touchStartDistance.current = 0;
      setIsZooming(false);
      if (zoomLevel < 1.1) {
        resetZoom();
      }
      return;
    }

    if (isPanning) {
      setIsPanning(false);
    }

    if (touchStartX.current === null) return;

    if (zoomLevel === 1) {
      const SWIPE_THRESHOLD = 45; // pixels
      if (touchDeltaX < -SWIPE_THRESHOLD) {
        next(); // Swiped left -> next
      } else if (touchDeltaX > SWIPE_THRESHOLD) {
        prev(); // Swiped right -> prev
      }
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
      style={{ touchAction: 'none' }}
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

      {/* ── Desktop Zoom Controls (double-click the image to zoom too) ── */}
      <div className="absolute right-3 sm:right-6 md:right-8 bottom-24 sm:bottom-28 z-40 hidden sm:flex flex-col gap-2 pointer-events-auto">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleZoomIn();
          }}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition-all duration-200 hover:bg-white/20 hover:scale-110 active:scale-95 ring-1 ring-white/15 shadow-lg cursor-pointer"
          aria-label="Zoom in"
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleZoomOut();
          }}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition-all duration-200 hover:bg-white/20 hover:scale-110 active:scale-95 ring-1 ring-white/15 shadow-lg cursor-pointer"
          aria-label="Zoom out"
        >
          <Minus className="h-4 w-4" />
        </button>
      </div>

      {/* ── Center Stage: Main Image ── */}
      <div
        className="relative z-20 flex h-full w-full items-center justify-center px-4 sm:px-20 md:px-28 pt-16 sm:pt-20 pb-24 sm:pb-28 pointer-events-none"
      >
        <div
          ref={imageRef}
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={handleDoubleClick}
          className={`relative max-h-full max-w-full flex items-center justify-center pointer-events-auto ${
            isZooming || isPanning ? '' : 'transition-transform duration-150 ease-out'
          } ${zoomLevel > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in'}`}
          style={{
            transform: [
              touchDeltaX !== 0 ? `translateX(${touchDeltaX * 0.4}px)` : '',
              zoomLevel > 1 && (panOffset.x !== 0 || panOffset.y !== 0)
                ? `translate(${panOffset.x}px, ${panOffset.y}px)`
                : '',
              zoomLevel !== 1 ? `scale(${zoomLevel})` : '',
            ]
              .filter(Boolean)
              .join(' ') || 'none',
            transformOrigin: zoomCenter ? `${zoomCenter.x}px ${zoomCenter.y}px` : 'center',
          }}
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
