import { useEffect, useState, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import OptimizedImage from '../../components/OptimizedImage';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface TimelineEntry {
  _id: string;
  year: string;
  title: string;
  description: string;
  images?: string[];
  imageBlurUrls?: string[];
}

export default function StoryPreview() {
  const navigate = useNavigate();
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const sectionRef = useRef<HTMLElement>(null);
  const desktopContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    apiClient
      .get('/story/timeline')
      .then((res) => {
        const data = res.data?.data || res.data || [];
        const parsedData = Array.isArray(data) ? [...data] : [];
        parsedData.sort((a, b) => {
          const yearA = a.year.match(/\d{4}/);
          const yearB = b.year.match(/\d{4}/);
          const valA = yearA ? parseInt(yearA[0], 10) : 0;
          const valB = yearB ? parseInt(yearB[0], 10) : 0;
          if (valA !== valB) return valB - valA;
          return b.year.localeCompare(a.year);
        });
        setTimeline(parsedData);
      })
      .catch(() => setTimeline([]))
      .finally(() => setLoading(false));
  }, []);

  const items = timeline.slice(0, 5);

  useGSAP(() => {
    if (loading || items.length === 0) return;

    const totalItems = items.length;

    if (totalItems <= 1) {
      // Fallback: show only the first item statically
      gsap.set('.desktop-text:not(.item-0)', { opacity: 0, zIndex: 0 });
      gsap.set('.desktop-img:not(.item-0)', { opacity: 0, zIndex: 0 });
      gsap.set('.desktop-text.item-0', { opacity: 1, zIndex: 10 });
      gsap.set('.desktop-img.item-0', { opacity: 1, zIndex: 10 });
      gsap.set('.progress-fill', { height: '100%' });
      return;
    }

    // Reset states initially
    gsap.set('.desktop-text', { zIndex: 0 });
    gsap.set('.desktop-text:not(.item-0) .desktop-text-elem', { opacity: 0, y: 30 });
    gsap.set('.desktop-img:not(.item-0)', { opacity: 0, z: -100, rotateX: -10, y: 100, zIndex: 0 });
    gsap.set('.desktop-text.item-0', { zIndex: 10 });
    gsap.set('.desktop-text.item-0 .desktop-text-elem', { opacity: 1, y: 0 });
    gsap.set('.desktop-img.item-0', { opacity: 1, z: 0, rotateX: 0, y: 0, scale: 1, zIndex: 10 });
    gsap.set('.progress-fill', { height: '0%' });

    // ── Per-item scroll distance: 50vh (snappy, not a slog) ──────────────────
    const SCROLL_PER_ITEM = 50; // percent of container height per story item

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: desktopContainerRef.current,
        start: 'top top',
        end: `+=${totalItems * SCROLL_PER_ITEM}%`,
        pin: true,
        scrub: 1,
        anticipatePin: 1,
        refreshPriority: 1,
        invalidateOnRefresh: true,
      },
    });

    // Progress bar tracks the same scroll window
    gsap.to('.progress-fill', {
      height: '100%',
      ease: 'none',
      scrollTrigger: {
        trigger: desktopContainerRef.current,
        start: 'top top',
        end: `+=${totalItems * SCROLL_PER_ITEM}%`,
        scrub: true,
      },
    });

    items.forEach((_, i) => {
      if (i !== 0) {
        tl.to({}, { duration: 1 }) // Hold previous item on screen
          .to(`.desktop-text.item-${i - 1} .desktop-text-elem`, { opacity: 0, y: -30, duration: 0.5, stagger: 0.1, ease: 'power2.in' })
          .to(`.desktop-img.item-${i - 1}`, { opacity: 0, z: -50, rotateX: 10, y: -50, zIndex: 0, duration: 0.8, ease: 'power2.inOut' }, '<')
          .set(`.desktop-text.item-${i}`, { zIndex: 10 }, '<0.4')
          .set(`.desktop-img.item-${i}`, { zIndex: 10 }, '<0.4')
          .to(`.desktop-text.item-${i} .desktop-text-elem`, { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out' }, '<0.2')
          .to(`.desktop-img.item-${i}`, { opacity: 1, z: 0, rotateX: 0, y: 0, duration: 1, ease: 'power3.out' }, '<');
      }
    });

    // Final pause so the last item stays on screen before unpinning
    tl.to({}, { duration: 1 });
  }, { scope: sectionRef, dependencies: [items.length, loading] });

  return (
    <section id="story" ref={sectionRef} className="bg-[var(--cream)]">
      {loading ? (
        <div className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
          <div className="mt-10 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-20 w-full" />
            ))}
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
          <div className="rounded-2xl border border-[var(--brown)]/8 bg-[var(--card-bg)] p-10 text-center text-sm text-[var(--muted)]">
            Timeline coming soon.
          </div>
        </div>
      ) : (
        <>
          {/* RESPONSIVE PINNED COMPOSITION */}
          <div ref={desktopContainerRef} className="flex flex-col lg:flex-row h-[100dvh] w-full overflow-hidden bg-[var(--cream)] relative pt-20 pb-4 sm:pt-24 sm:pb-6 lg:pt-0 lg:pb-0 justify-center lg:justify-start gap-3 sm:gap-6 lg:gap-0">

            {/* Header Overlay */}
            <div className="relative lg:absolute lg:top-12 lg:left-[max(1.5rem,calc((100vw-80rem)/2+1.5rem))] z-20 xl:top-16 px-6 lg:px-0 shrink-0">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--gold)]">
                <span className="inline-block h-px w-6 bg-[var(--gold)]" />
                My Story
              </div>
              <h2 className="mt-1 lg:mt-3 font-['Playfair_Display'] text-3xl font-bold tracking-tight text-[var(--brown)] sm:text-4xl lg:text-5xl">
                The journey so far.
              </h2>
            </div>

            {/* Left Side: Progress & Text */}
            <div className="relative flex w-full shrink-0 lg:h-full lg:w-1/2 flex-col justify-start lg:justify-center px-6 lg:pl-[max(2.5rem,calc((100vw-80rem)/2+2.5rem))] lg:pr-16 xl:pr-20 z-10">
              {/* Progress Bar */}
              <div className="absolute left-6 lg:left-[max(2.5rem,calc((100vw-80rem)/2+2.5rem))] top-2 lg:top-1/2 h-[130px] sm:h-[180px] lg:h-[300px] w-[2px] lg:-translate-y-1/2 bg-[var(--brown)]/10 rounded-full">
                <div className="progress-fill w-full bg-gradient-to-b from-[var(--gold)] to-[var(--gold-light)] h-0 relative rounded-full">
                  <div className="absolute -bottom-1.5 -left-[5px] h-[12px] w-[12px] rounded-full bg-white shadow-[0_0_15px_var(--gold)] border-[2px] border-[var(--gold)] z-10" />
                </div>
              </div>

              {/* Text Items */}
              <div className="relative ml-7 lg:ml-12 h-[130px] sm:h-[180px] lg:h-[300px] w-full">
                {items.map((entry, i) => (
                  <div key={entry._id} onClick={() => navigate('/page/story')} className={`desktop-text item-${i} absolute top-1/2 flex w-full -translate-y-1/2 flex-col cursor-pointer`}>
                    <div className="desktop-text-elem text-xs lg:text-sm font-semibold uppercase tracking-widest text-[var(--gold)]">
                      {entry.year}
                    </div>
                    <h3 className="desktop-text-elem mt-1 sm:mt-2 lg:mt-4 font-['Playfair_Display'] text-xl sm:text-2xl lg:text-3xl font-bold leading-tight text-[var(--brown)] xl:text-4xl pr-4">
                      {entry.title}
                    </h3>
                    <p className="desktop-text-elem mt-1 sm:mt-2 lg:mt-6 max-w-md text-xs sm:text-sm lg:text-base leading-relaxed text-[var(--muted)] xl:text-lg line-clamp-2 sm:line-clamp-3 lg:line-clamp-none pr-4">
                      {entry.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Side: Visuals */}
            <div className="relative flex w-full h-[30vh] sm:h-[40vh] lg:h-full lg:w-1/2 items-center justify-center px-6 lg:p-12 xl:p-16 z-0 shrink-0" style={{ perspective: "1000px" }}>
              <div className="relative h-full w-full max-h-[100%] lg:max-h-[70vh] max-w-[600px]" style={{ transformStyle: "preserve-3d" }}>
                {items.map((entry, i) => {
                  const hasImage = entry.images && entry.images.length > 0;
                  return (
                    <div key={entry._id} onClick={() => hasImage && navigate('/page/story')} className={`desktop-img item-${i} absolute inset-0 overflow-hidden rounded-2xl ${hasImage ? 'cursor-pointer shadow-2xl shadow-[var(--brown)]/15 border border-[var(--gold)]/20 bg-white/30 backdrop-blur-sm p-2 lg:p-3' : 'pointer-events-none'}`}>
                      {hasImage && (
                        <div className="relative h-full w-full overflow-hidden rounded-xl">
                          <OptimizedImage
                            src={entry.images![0]}
                            blurSrc={entry.imageBlurUrls?.[0]}
                            alt={entry.title}
                            fit="cover"
                            loading={i === 0 ? "eager" : "lazy"}
                            imgClassName="h-full w-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="relative lg:absolute lg:bottom-12 lg:left-[max(1.5rem,calc((100vw-80rem)/2+1.5rem))] z-20 xl:bottom-16 flex justify-center lg:justify-start shrink-0 mt-1 sm:mt-2 lg:mt-0">
              <NavLink
                to="/page/story"
                className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[var(--gold)] to-[var(--gold-light)] px-5 py-2.5 sm:px-6 sm:py-3 lg:px-8 lg:py-3.5 text-xs lg:text-sm font-bold text-white shadow-lg shadow-[var(--gold)]/20 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[var(--gold)]/30"
              >
                View Full Story
                <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
              </NavLink>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
