import { useEffect, useState, useRef } from 'react';
import { useParams, NavLink } from 'react-router-dom';
import apiClient from '../api/client';
import OptimizedImage from '../components/OptimizedImage';
import LightboxModal from '../components/LightboxModal';
import { ChevronLeft, Clock, Maximize2 } from 'lucide-react';
import { calculateReadingTime } from '../utils/readingTime';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface LogItem {
  _id: string;
  date: string;
  title: string;
  body: string;
  tags?: string[];
  images?: string[];
  imageBlurUrls?: string[];
}

function formatBody(text: string): React.ReactNode[] {
  const elements: React.ReactNode[] = [];
  const lines = text.split('\n');
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (!line) {
      continue;
    }

    const h1Match = line.match(/^#\s+(.+)$/);
    const h2Match = line.match(/^##\s+(.+)$/);
    const h3Match = line.match(/^###\s+(.+)$/);

    if (h1Match) {
      elements.push(
        <h4 key={key++} className="mt-8 mb-4 font-['Playfair_Display'] text-2xl font-bold text-[var(--brown)] first:mt-0">
          {h1Match[1]}
        </h4>
      );
    } else if (h2Match) {
      elements.push(
        <h5 key={key++} className="mt-6 mb-3 font-['Playfair_Display'] text-xl font-bold text-[var(--brown)] first:mt-0">
          {h2Match[1]}
        </h5>
      );
    } else if (h3Match) {
      elements.push(
        <h6 key={key++} className="mt-5 mb-2 font-['Playfair_Display'] text-lg font-bold text-[var(--brown-light)] first:mt-0">
          {h3Match[1]}
        </h6>
      );
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(
        <li key={key++} className="ml-6 text-lg leading-relaxed text-[var(--muted)] list-disc my-2">
          {line.slice(2)}
        </li>
      );
    } else if (/^\d+\.\s/.test(line)) {
      const content = line.replace(/^\d+\.\s/, '');
      elements.push(
        <li key={key++} className="ml-6 text-lg leading-relaxed text-[var(--muted)] list-decimal my-2">
          {content}
        </li>
      );
    } else {
      const formattedLine = line
        .replace(/\s+/g, ' ')
        .replace(/\s*,\s*/g, ', ')
        .replace(/\s*\.\s*/g, '. ')
        .replace(/\s*:\s*/g, ': ')
        .replace(/\s*;\s*/g, '; ')
        .replace(/\s*\?\s*/g, '? ')
        .replace(/\s*!\s*/g, '! ')
        .replace(/\s+$/, '');

      elements.push(
        <p key={key++} className="mt-4 text-lg leading-relaxed text-[var(--muted)] first:mt-0">
          {formattedLine}
        </p>
      );
    }
  }

  return elements;
}


export default function LogDetail() {
  const { id } = useParams<{ id: string }>();
  const [log, setLog] = useState<LogItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [autoIndex, setAutoIndex] = useState(0);

  useEffect(() => {
    if (!log?.images || log.images.length <= 1) return;
    const timer = setInterval(() => {
      setAutoIndex((prev) => (prev + 1) % log.images!.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [log]);

  const mobileContainerRef = useRef<HTMLDivElement>(null);
  const mobileImageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) {
      queueMicrotask(() => { setError(true); setLoading(false); });
      return;
    }

    apiClient
      .get(`/log/${id}`)
      .then((res) => {
        const data = res.data?.data || res.data;
        setLog(data);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  // Mobile scroll animation for the image
  useEffect(() => {
    if (!log?.images || log.images.length === 0 || !mobileContainerRef.current || !mobileImageRef.current) return;

    let ctx = gsap.context(() => {
      // Only apply on screens smaller than 1024px (lg breakpoint)
      let mm = gsap.matchMedia();
      
      mm.add("(max-width: 1023px)", () => {
        gsap.to(mobileImageRef.current, {
          scale: 0.9,
          y: 80, // Parallax push down
          opacity: 0.8,
          scrollTrigger: {
            trigger: mobileContainerRef.current,
            start: "top top",
            end: "bottom top",
            scrub: true,
          }
        });
      });
    }, mobileContainerRef);

    return () => ctx.revert();
  }, [log]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--warm-white)] pt-32 px-6 lg:px-20 max-w-4xl mx-auto">
        <div className="skeleton h-8 w-24 mb-4 rounded" />
        <div className="skeleton h-12 w-3/4 mb-10 rounded" />
        <div className="skeleton h-[50vh] w-full rounded-2xl mb-10" />
      </div>
    );
  }

  if (error || !log) {
    return (
      <div className="min-h-screen bg-[var(--warm-white)] pt-32 px-6 lg:px-20 max-w-4xl mx-auto text-center">
        <h1 className="font-['Playfair_Display'] text-4xl font-bold text-[var(--brown)] mb-6">Not Found</h1>
        <p className="text-[var(--muted)] mb-8">This log entry could not be found.</p>
        <NavLink 
          to="/page/daily-log" 
          className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--gold)] hover:text-[var(--gold-light)] transition-colors"
        >
          ← Back to Daily Log
        </NavLink>
      </div>
    );
  }

  const formattedDate = new Date(log.date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const hasImage = log.images && log.images.length > 0;

  return (
    <div className="bg-[var(--warm-white)] lg:flex lg:min-h-screen">
      {/* Back button (Mobile only) */}
      <div className="lg:hidden absolute top-4 left-4 z-30">
        <NavLink 
          to="/page/daily-log" 
          className="flex h-10 w-10 items-center justify-center rounded-full bg-black/20 text-white backdrop-blur-md transition-colors hover:bg-black/40"
        >
          <ChevronLeft className="h-6 w-6" />
        </NavLink>
      </div>

      {/* Left Side: Sticky Image Area (only if hasImage) */}
      {hasImage && (
        <div ref={mobileContainerRef} className="w-full lg:w-1/2 lg:sticky lg:top-0 lg:h-screen lg:pt-[100px] lg:px-12 lg:pb-12 flex flex-col items-center justify-center">
          <div ref={mobileImageRef} className="group relative w-full h-[45vh] sm:h-[55vh] lg:h-full max-h-[800px] bg-[var(--brown)] overflow-hidden lg:rounded-3xl lg:shadow-2xl origin-top cursor-pointer">
            {/* Back button (Desktop) */}
            <div className="hidden lg:block absolute top-6 left-6 z-30">
              <NavLink 
                to="/page/daily-log" 
                className="flex items-center gap-2 rounded-full bg-black/30 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md transition-all duration-200 hover:bg-black/50 hover:scale-105 shadow-sm ring-1 ring-white/10"
              >
                <ChevronLeft className="h-4 w-4" />
                Back to Logs
              </NavLink>
            </div>

            <OptimizedImage
              key={autoIndex}
              src={log.images![autoIndex]}
              blurSrc={log.imageBlurUrls?.[autoIndex]}
              alt={log.title}
              fit="cover"
              loading="eager"
              fetchPriority="high"
              className="h-full"
              imgClassName="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 opacity-90 group-hover:opacity-100"
            />
            <div 
              className="absolute inset-0 z-10" 
              onClick={() => { setLightboxOpen(true); setCurrentIndex(autoIndex); }} 
            />
          
            {/* Subtle gradient for aesthetics */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-black/30" />

            {/* Floating "Click to expand" chip */}
            <div className="pointer-events-none absolute bottom-6 left-6 z-20 hidden sm:inline-flex items-center gap-2 rounded-full bg-black/60 px-4 py-2 text-xs font-semibold text-white backdrop-blur-md ring-1 ring-white/20 shadow-xl transition-all duration-300 group-hover:translate-y-0 translate-y-2 opacity-80 group-hover:opacity-100">
              <Maximize2 className="h-3.5 w-3.5 text-[var(--gold)]" />
              <span>Expand Photo</span>
            </div>

            {/* Corner Thumbnails */}
            {log.images!.length > 1 && (
              <div className="absolute bottom-6 right-6 lg:bottom-10 lg:right-10 z-20 flex gap-2" onClick={(e) => e.stopPropagation()}>
                {Array.from({ length: Math.min(3, log.images!.length - 1) }).map((_, j) => {
                  const idx = (autoIndex + j + 1) % log.images!.length;
                  return (
                    <button
                      key={idx}
                      onClick={() => { setLightboxOpen(true); setCurrentIndex(idx); }}
                      className="h-14 w-20 sm:h-16 sm:w-24 lg:h-20 lg:w-28 overflow-hidden rounded-xl border-2 border-white/20 shadow-xl transition-all duration-300 hover:scale-105 hover:border-[var(--gold)]"
                      aria-label={`View photo ${idx + 1}`}
                    >
                      <OptimizedImage src={log.images![idx]} blurSrc={log.imageBlurUrls?.[idx]} alt="" fit="cover" loading="lazy" className="h-full" imgClassName="h-full w-full object-cover" />
                    </button>
                  );
                })}
                {log.images!.length > 4 && (
                  <button
                    onClick={() => { setLightboxOpen(true); setCurrentIndex((autoIndex + 4) % log.images!.length); }}
                    className="flex h-14 w-20 sm:h-16 sm:w-24 lg:h-20 lg:w-28 items-center justify-center rounded-xl border-2 border-white/20 bg-black/50 text-sm font-bold text-white shadow-xl backdrop-blur-sm transition-all duration-300 hover:bg-black/70 hover:scale-105 hover:border-[var(--gold)]"
                    aria-label="View more photos"
                  >
                    +{log.images!.length - 4}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Right Side: Scrolling Content */}
      <div className={`w-full flex flex-col pt-10 pb-20 px-5 sm:px-8 ${hasImage ? 'lg:w-1/2 lg:pt-[100px] lg:px-12 xl:px-16' : 'max-w-4xl mx-auto lg:pt-40'}`}>
        
        {/* Back button (Desktop No Image) */}
        {!hasImage && (
          <div className="hidden lg:block mb-12">
            <NavLink 
              to="/page/daily-log" 
              className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--gold)] hover:text-[var(--gold-light)] transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Logs
            </NavLink>
          </div>
        )}

        {/* Header Info */}
        <div className="mb-12">
          <div className="mb-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--gold)]">
            <span className="inline-block h-px w-6 bg-[var(--gold)]" />
            Daily Log
          </div>
          <h1 className="font-['Playfair_Display'] text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[var(--brown)] mb-6 leading-tight">
            {log.title}
          </h1>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-base sm:text-lg text-[var(--muted)] font-medium tracking-wide">
              {formattedDate}
            </span>
            <span className="h-1 w-1 rounded-full bg-[var(--brown)]/20" />
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3.5 py-1 text-xs font-semibold text-[var(--gold)] border border-[var(--gold)]/25 shadow-xs backdrop-blur-sm">
              <Clock className="h-3.5 w-3.5 text-[var(--gold)]" />
              {calculateReadingTime(log.body)}
            </span>
          </div>
        </div>

        {/* Body Content */}
        <article className="prose prose-lg prose-p:text-[var(--muted)] prose-p:leading-[1.8] prose-p:text-lg max-w-none text-left flex-1">
          {formatBody(log.body)}
        </article>

        {/* Tags */}
        {log.tags && log.tags.length > 0 && (
          <div className="mt-16 pt-8 border-t border-[var(--brown)]/10">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)] mb-5">
              Tagged under
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {log.tags.map((tag) => (
                <NavLink
                  key={tag}
                  to={`/page/daily-log?tag=${encodeURIComponent(tag)}`}
                  className="rounded-full bg-[var(--cream)] px-5 py-2 text-sm font-medium text-[var(--brown-light)] transition-all duration-200 hover:bg-[var(--gold)]/15 hover:text-[var(--gold)] hover:shadow-sm"
                >
                  #{tag}
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Universal Reusable Lightbox Modal */}
      <LightboxModal
        isOpen={lightboxOpen && !!log?.images && log.images.length > 0}
        images={log?.images || []}
        imageBlurUrls={log?.imageBlurUrls}
        currentIndex={currentIndex}
        onClose={() => setLightboxOpen(false)}
        onIndexChange={setCurrentIndex}
        title={log?.title}
      />
    </div>
  );
}
