import { useEffect, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import { X, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import apiClient from '../api/client';
import OptimizedImage from '../components/OptimizedImage';

gsap.registerPlugin(ScrollTrigger);

interface TimelineEntry {
  _id: string;
  year: string;
  title: string;
  description: string;
  images?: string[];
  imageBlurUrls?: string[];
}

function StoryImageGallery({
  entry,
  openLightbox,
}: {
  entry: TimelineEntry;
  openLightbox: (imgs: string[], idx: number) => void;
}) {
  const [autoIndex, setAutoIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => setIsVisible(e.isIntersecting),
      { threshold: 0.1 }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!entry.images || entry.images.length <= 1 || !isVisible) return;
    const timer = setInterval(() => {
      setAutoIndex((prev) => (prev + 1) % entry.images!.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [entry.images, isVisible]);

  if (!entry.images || entry.images.length === 0) return null;

  const images = entry.images;
  const total = images.length;
  const maxThumbs = Math.min(3, total - 1);
  const thumbs = Array.from({ length: maxThumbs }, (_, j) => (autoIndex + j + 1) % total);

  return (
    <div
      ref={containerRef}
      className="group relative overflow-hidden rounded-2xl border border-[var(--gold)]/20 bg-gradient-to-b from-white/90 via-white/40 to-white/20 p-1.5 shadow-[0_16px_40px_rgba(44,26,14,0.06),0_0_24px_rgba(200,150,42,0.08)] backdrop-blur-md transition-all duration-500 hover:border-[var(--gold)]/40 hover:shadow-[0_20px_50px_rgba(200,150,42,0.14)]"
    >
      <div className="relative overflow-hidden rounded-xl">
        {/* Clickable overlay hint at TOP RIGHT on hover */}
        <button
          onClick={() => openLightbox(images, autoIndex)}
          className="absolute inset-0 z-10 flex items-start justify-end p-3.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          aria-label="View images"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full bg-black/65 px-3.5 py-1.5 text-[11px] font-bold text-white shadow-lg backdrop-blur-md transition-transform duration-300 group-hover:scale-105">
            <Sparkles className="h-3 w-3 text-[var(--gold-light)]" />
            {total > 1 ? `View all ${total} photos` : 'View photo'}
          </span>
        </button>

        <OptimizedImage
          src={images[autoIndex]}
          blurSrc={entry.imageBlurUrls?.[autoIndex]}
          alt={entry.title}
          fit="cover"
          loading="lazy"
          imgClassName="aspect-[4/3] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03] cursor-pointer"
        />

        {/* Thumbnail strip bottom-right */}
        {total > 1 && (
          <div className="absolute bottom-3 right-3 z-20 flex gap-1.5">
            {thumbs.map((idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  openLightbox(images, idx);
                }}
                className="h-10 w-10 overflow-hidden rounded-xl border-2 border-white/80 shadow-md transition-transform hover:scale-105 hover:border-[var(--gold)]"
              >
                <OptimizedImage
                  src={images[idx]}
                  blurSrc={entry.imageBlurUrls?.[idx]}
                  alt=""
                  fit="cover"
                  loading="lazy"
                  imgClassName="h-full w-full object-cover"
                />
              </button>
            ))}
            {total > 4 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openLightbox(images, (autoIndex + 4) % total);
                }}
                className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-white/80 bg-black/60 text-xs font-bold text-white shadow-md backdrop-blur-md transition-colors hover:bg-black/80 hover:border-[var(--gold)]"
              >
                +{total - 4}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Story() {
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const pageRef = useRef<HTMLDivElement>(null);
  const timelineAreaRef = useRef<HTMLDivElement>(null);
  const desktopTrackRef = useRef<HTMLDivElement>(null);
  const mobileTrackRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const travelingDotRef = useRef<HTMLDivElement>(null);
  const mobileProgressRef = useRef<HTMLDivElement>(null);
  const mobileDotRef = useRef<HTMLDivElement>(null);

  // Lightbox state
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);

  const openLightbox = (images: string[], index: number) => setLightbox({ images, index });
  const closeLightbox = () => setLightbox(null);
  const prevImage = () =>
    setLightbox((lb) =>
      lb ? { ...lb, index: (lb.index - 1 + lb.images.length) % lb.images.length } : null
    );
  const nextImage = () =>
    setLightbox((lb) =>
      lb ? { ...lb, index: (lb.index + 1) % lb.images.length } : null
    );

  // Close on Escape / arrow keys
  useEffect(() => {
    if (!lightbox) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') prevImage();
      if (e.key === 'ArrowRight') nextImage();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightbox]);

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

  useGSAP(
    () => {
      if (loading || timeline.length === 0 || !timelineAreaRef.current) return;

      const isMobile = window.innerWidth < 1024;
      const entries = gsap.utils.toArray<HTMLElement>('.story-entry');
      if (entries.length === 0) return;

      const firstEntry = entries[0];
      const lastEntry = entries[entries.length - 1];
      const areaRect = timelineAreaRef.current.getBoundingClientRect();

      if (!isMobile) {
        // ===== DESKTOP LOGIC (>= 1024px) =====
        const firstDesktopNode = firstEntry.querySelector<HTMLElement>('.desktop-node');
        const lastDesktopNode = lastEntry.querySelector<HTMLElement>('.desktop-node');

        if (firstDesktopNode && lastDesktopNode && desktopTrackRef.current) {
          const firstRect = firstDesktopNode.getBoundingClientRect();
          const lastRect = lastDesktopNode.getBoundingClientRect();
          const topOffset = firstRect.top + firstRect.height / 2 - areaRect.top;
          const bottomOffset = lastRect.top + lastRect.height / 2 - areaRect.top;
          const trackHeight = Math.max(bottomOffset - topOffset, 60);

          desktopTrackRef.current.style.top = `${topOffset}px`;
          desktopTrackRef.current.style.height = `${trackHeight}px`;

          if (progressBarRef.current) {
            gsap.fromTo(
              progressBarRef.current,
              { scaleY: 0 },
              {
                scaleY: 1,
                ease: 'none',
                scrollTrigger: {
                  trigger: firstDesktopNode,
                  endTrigger: lastDesktopNode,
                  start: 'center center',
                  end: 'center center',
                  scrub: 0.3,
                },
              }
            );
          }

          if (travelingDotRef.current) {
            gsap.fromTo(
              travelingDotRef.current,
              { top: '0%' },
              {
                top: '100%',
                ease: 'none',
                scrollTrigger: {
                  trigger: firstDesktopNode,
                  endTrigger: lastDesktopNode,
                  start: 'center center',
                  end: 'center center',
                  scrub: 0.3,
                },
              }
            );
          }
        }
      } else {
        // ===== MOBILE LOGIC (< 1024px) =====
        const firstMobileNode = firstEntry.querySelector<HTMLElement>('.mobile-node');
        const lastMobileNode = lastEntry.querySelector<HTMLElement>('.mobile-node');

        if (firstMobileNode && lastMobileNode && mobileTrackRef.current) {
          const firstRect = firstMobileNode.getBoundingClientRect();
          const lastRect = lastMobileNode.getBoundingClientRect();
          const topOffset = firstRect.top + firstRect.height / 2 - areaRect.top;
          const bottomOffset = lastRect.top + lastRect.height / 2 - areaRect.top;
          const trackHeight = Math.max(bottomOffset - topOffset, 60);

          mobileTrackRef.current.style.top = `${topOffset}px`;
          mobileTrackRef.current.style.height = `${trackHeight}px`;

          if (mobileProgressRef.current) {
            gsap.fromTo(
              mobileProgressRef.current,
              { scaleY: 0 },
              {
                scaleY: 1,
                ease: 'none',
                scrollTrigger: {
                  trigger: firstMobileNode,
                  endTrigger: lastMobileNode,
                  start: 'center center',
                  end: 'center center',
                  scrub: 0.1,
                },
              }
            );
          }

          if (mobileDotRef.current) {
            gsap.fromTo(
              mobileDotRef.current,
              { top: '0%' },
              {
                top: '100%',
                ease: 'none',
                scrollTrigger: {
                  trigger: firstMobileNode,
                  endTrigger: lastMobileNode,
                  start: 'center center',
                  end: 'center center',
                  scrub: 0.1,
                },
              }
            );
          }
        }
      }

      // Per-entry entrance animations & node color fill
      entries.forEach((entry, idx) => {
        const isEven = entry.classList.contains('even');
        const imgPanel = entry.querySelector('.desktop-view .entry-img');
        const textPanel = entry.querySelector('.desktop-view .entry-text');
        const connectorStem = entry.querySelector('.connector-stem');
        const nodes = entry.querySelectorAll<HTMLElement>('.milestone-node');

        // Desktop Text Entrance
        if (textPanel && !isMobile) {
          gsap.fromTo(
            textPanel,
            { opacity: 0, x: isEven ? 40 : -40 },
            {
              opacity: 1,
              x: 0,
              duration: 0.85,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: entry,
                start: 'top 85%',
                toggleActions: 'play none none reverse',
              },
            }
          );
        }

        // Desktop Image Entrance
        if (imgPanel && !isMobile) {
          gsap.fromTo(
            imgPanel,
            { opacity: 0, x: isEven ? -40 : 40, scale: 0.97 },
            {
              opacity: 1,
              x: 0,
              scale: 1,
              duration: 0.95,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: entry,
                start: 'top 85%',
                toggleActions: 'play none none reverse',
              },
            }
          );
        }

        // Synchronized Node Empty-to-Fill:
        // Node 0 is the starting station (starts filled).
        // Nodes 1..N trigger the moment the beacon arrives (top 52% on mobile, center center on desktop)!
        if (idx > 0) {
          nodes.forEach((node) => {
            ScrollTrigger.create({
              trigger: node,
              start: isMobile ? 'top 52%' : 'center center',
              onEnter: () => {
                node.classList.remove('node-empty');
                node.classList.add('node-filled');
              },
              onLeaveBack: () => {
                node.classList.remove('node-filled');
                node.classList.add('node-empty');
              },
              onRefresh: (self) => {
                if (self.progress > 0) {
                  node.classList.remove('node-empty');
                  node.classList.add('node-filled');
                } else {
                  node.classList.remove('node-filled');
                  node.classList.add('node-empty');
                }
              },
            });
          });
        }

        // Connector stem fill (Desktop)
        if (connectorStem && !isMobile) {
          const targetNode = entry.querySelector('.desktop-node');
          gsap.fromTo(
            connectorStem,
            { scaleX: 0, transformOrigin: isEven ? 'left center' : 'right center' },
            {
              scaleX: 1,
              duration: 0.4,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: targetNode || entry,
                start: 'center center',
                toggleActions: 'play reverse play reverse',
              },
            }
          );
        }
      });

      // Refresh ScrollTrigger to ensure dynamic layout heights are calibrated
      ScrollTrigger.refresh();
    },
    { scope: pageRef, dependencies: [loading, timeline.length] }
  );

  return (
    <div
      ref={pageRef}
      className="relative min-h-screen overflow-x-hidden bg-[var(--warm-white)] text-[var(--brown)]"
    >
      {/* ===== LUXURY AMBIENT BACKGROUND LIGHTING ===== */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-[120px] left-[5%] h-[600px] w-[600px] rounded-full bg-gradient-to-br from-[var(--gold)]/10 via-[var(--gold-light)]/5 to-transparent blur-3xl" />
        <div className="absolute top-[35%] right-[2%] h-[650px] w-[650px] rounded-full bg-gradient-to-bl from-[var(--gold-light)]/8 via-[var(--gold)]/4 to-transparent blur-3xl" />
        <div className="absolute top-[70%] left-[8%] h-[600px] w-[600px] rounded-full bg-gradient-to-tr from-[var(--gold)]/8 via-[var(--card-bg)]/40 to-transparent blur-3xl" />
      </div>

      {/* ===== BESPOKE HERO HEADER (UNIFIED WITH FULL PAGE BG) ===== */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-8 pt-24 sm:pb-12 sm:pt-28 lg:pt-32">
        <div className="flex flex-col items-start text-left">
          {/* <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-1.5 text-xs font-black uppercase tracking-[0.24em] text-[var(--gold)] shadow-sm backdrop-blur-md ring-1 ring-[var(--gold)]/20">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--gold)] opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--gold)]"></span>
            </span>
            Archival Journey
          </div> */}

          <div className="flex w-full flex-wrap items-end justify-between gap-x-8 gap-y-4">
            <div>
              <h1 className="font-['Playfair_Display'] text-4xl font-bold tracking-tight text-[var(--brown)] sm:text-5xl lg:text-6xl">
                The Journey <span className="italic text-[var(--gold-light)]">So Far.</span>
              </h1>
            </div>
            <p className="max-w-md text-base leading-relaxed text-[var(--muted)] font-medium">
              An evolving narrative of pivotal milestones, defining chapters, and the continuous
              pursuit of purposeful work.
            </p>
          </div>

          <div className="mt-6 h-1 w-20 rounded-full bg-gradient-to-r from-[var(--gold)] via-[var(--gold-light)] to-transparent" />
        </div>
      </section>

      {/* ===== MAIN TIMELINE SECTION ===== */}
      <main className="relative z-10 mx-auto max-w-6xl px-4 pb-24 sm:px-6 lg:pb-32">
        {loading ? (
          <div className="space-y-16">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col gap-8 lg:flex-row">
                <div className="skeleton h-64 w-full rounded-3xl lg:w-1/2" />
                <div className="flex w-full flex-col gap-3 lg:w-1/2">
                  <div className="skeleton h-4 w-24 rounded" />
                  <div className="skeleton h-8 w-3/4 rounded" />
                  <div className="skeleton h-24 w-full rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : timeline.length === 0 ? (
          <div className="rounded-3xl border border-[var(--gold)]/20 bg-white/60 p-16 text-center shadow-sm backdrop-blur-md">
            <p className="text-base font-bold text-[var(--brown)]">Timeline coming soon.</p>
            <p className="mt-1 text-sm text-[var(--muted)]">Archival entries are being assembled.</p>
          </div>
        ) : (
          <div className="relative">
            {/* === TIMELINE ENTRIES CONTAINER === */}
            <div
              ref={timelineAreaRef}
              className="relative flex flex-col gap-12 pl-10 sm:gap-20 sm:pl-12 lg:gap-28 lg:pl-0"
            >
              {/* DESKTOP TIMELINE TRACK: Starts AT First Node, Ends AT Last Node */}
              <div
                ref={desktopTrackRef}
                className="pointer-events-none absolute left-1/2 hidden -translate-x-1/2 lg:block"
                style={{ top: '0px', height: '100%' }}
              >
                {/* Background track line */}
                <div className="absolute left-1/2 top-0 h-full w-[2px] -translate-x-1/2 bg-[var(--brown)]/10" />

                {/* Ambient glow groove */}
                <div className="absolute left-1/2 top-0 h-full w-24 -translate-x-1/2 bg-gradient-to-r from-transparent via-[var(--gold)]/[0.04] to-transparent" />

                {/* Progress bar */}
                <div
                  ref={progressBarRef}
                  style={{ transformOrigin: 'top center' }}
                  className="absolute left-1/2 top-0 h-full w-[2.5px] -translate-x-1/2 origin-top bg-gradient-to-b from-[var(--gold)] via-[var(--gold-light)] to-[var(--gold)] drop-shadow-[0_0_8px_rgba(200,150,42,0.5)]"
                />

                {/* Traveling beacon (Starts on first node!) */}
                <div
                  ref={travelingDotRef}
                  className="absolute left-1/2 z-20 -translate-x-1/2 -translate-y-1/2"
                  style={{ top: '0%' }}
                >
                  <div className="relative flex items-center justify-center">
                    <span className="absolute inline-flex h-7 w-7 animate-ping rounded-full bg-[var(--gold-light)] opacity-60" />
                    <div
                      className="h-[18px] w-[18px] rounded-full bg-gradient-to-br from-[var(--gold-light)] to-[var(--gold)] ring-2 ring-white shadow-xl"
                      style={{
                        boxShadow: '0 0 16px var(--gold-light), 0 0 30px var(--gold)',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* MOBILE TIMELINE TRACK: Starts at 32px (matching first node) */}
              <div
                ref={mobileTrackRef}
                className="pointer-events-none absolute left-4 sm:left-5 lg:hidden"
                style={{ top: '32px', height: 'calc(100% - 32px)' }}
              >
                {/* Background track line */}
                <div className="absolute left-0 top-0 h-full w-[2px] -translate-x-1/2 bg-[var(--brown)]/10" />

                {/* Mobile progress bar */}
                <div
                  ref={mobileProgressRef}
                  style={{ transformOrigin: 'top center' }}
                  className="absolute left-0 top-0 h-full w-[2px] -translate-x-1/2 origin-top bg-gradient-to-b from-[var(--gold)] via-[var(--gold-light)] to-[var(--gold)] drop-shadow-[0_0_8px_rgba(200,150,42,0.5)]"
                />

                {/* Mobile traveling beacon (Starts on first node!) */}
                <div
                  ref={mobileDotRef}
                  className="absolute left-0 z-20 -translate-x-1/2 -translate-y-1/2"
                  style={{ top: '0%' }}
                >
                  <div className="relative flex items-center justify-center">
                    <span className="absolute inline-flex h-6 w-6 animate-ping rounded-full bg-[var(--gold-light)] opacity-60" />
                    <div
                      className="h-3.5 w-3.5 rounded-full bg-gradient-to-br from-[var(--gold-light)] to-[var(--gold)] ring-2 ring-white shadow-lg"
                      style={{
                        boxShadow: '0 0 14px var(--gold-light), 0 0 24px var(--gold)',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* === MILESTONE ENTRIES LIST === */}
              {timeline.map((entry, i) => {
                const isEven = i % 2 === 0;
                const hasImage = entry.images && entry.images.length > 0;
                const isFirst = i === 0;

                return (
                  <article
                    key={entry._id}
                    data-id={entry._id}
                    className={`story-entry ${isEven ? 'even' : 'odd'} relative w-full`}
                  >
                    {/* ===== 1. MOBILE VIEW (< lg): UNIFIED ALL-IN-ONE CARD ===== */}
                    <div className="mobile-card relative w-full rounded-3xl border border-[var(--gold)]/20 bg-white/80 p-5 shadow-[0_8px_30px_rgba(44,26,14,0.04)] backdrop-blur-md transition-all duration-300 sm:p-6 lg:hidden">
                      {/* Mobile Node Connector: Concentric on line (16px / sm: 20px), stem flush to card */}
                      <div className="mobile-node-wrap absolute -left-6 sm:-left-7 top-8 z-10 -translate-y-1/2 flex items-center">
                        <div
                          className={`milestone-node mobile-node ${isFirst ? 'node-filled' : 'node-empty'
                            } h-3 w-3 shrink-0 -translate-x-1/2 rounded-full border-2 border-[var(--gold)]/40 bg-[var(--warm-white)] transition-all duration-500`}
                        />
                        <div className="h-[1.5px] w-[18px] shrink-0 sm:w-[22px] bg-gradient-to-r from-[var(--gold)]/70 to-[var(--gold)]/20" />
                      </div>

                      {/* Header: Year Badge */}
                      <div className="mb-3">
                        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--gold)]/30 bg-gradient-to-r from-[var(--gold)]/15 via-[var(--gold-light)]/20 to-[var(--gold)]/10 px-3.5 py-1 text-xs font-bold text-[var(--gold)] shadow-sm">
                          <span className="text-[10px]">✦</span>
                          <span>{entry.year}</span>
                        </div>
                      </div>

                      {/* Title */}
                      <h2 className="font-['Playfair_Display'] text-2xl font-bold leading-tight text-[var(--brown)] sm:text-3xl">
                        {entry.title}
                      </h2>

                      {/* Gold Accent Bar */}
                      <div className="mt-2.5 mb-4 h-0.5 w-10 rounded-full bg-gradient-to-r from-[var(--gold)] to-[var(--gold-light)]" />

                      {/* Embedded Photo Gallery: Inside the same card */}
                      {hasImage && (
                        <div className="mb-4 overflow-hidden rounded-2xl">
                          <StoryImageGallery entry={entry} openLightbox={openLightbox} />
                        </div>
                      )}

                      {/* Narrative Description */}
                      <p className="text-sm leading-[1.8] text-[var(--muted)] sm:text-base">
                        {entry.description}
                      </p>
                    </div>

                    {/* ===== 2. DESKTOP VIEW (>= lg): ALTERNATING 3-COLUMN ZIGZAG GRID ===== */}
                    <div className="desktop-view hidden lg:grid lg:grid-cols-[1fr_48px_1fr] lg:items-center lg:gap-6">
                      {/* Image Panel */}
                      <div
                        className={`entry-img w-full ${isEven ? 'lg:pr-8' : 'lg:order-3 lg:pl-8'
                          }`}
                      >
                        {hasImage ? (
                          <StoryImageGallery entry={entry} openLightbox={openLightbox} />
                        ) : (
                          <div className="flex aspect-[4/3] w-full items-center justify-center rounded-3xl border border-[var(--gold)]/20 bg-gradient-to-br from-white/80 via-white/50 to-[var(--card-bg)]/40 p-8 shadow-sm backdrop-blur-md">
                            <div className="text-center">
                              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--gold)]/10 text-[var(--gold)] ring-1 ring-[var(--gold)]/25">
                                <Sparkles className="h-5 w-5" />
                              </div>
                              <span className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold)]">
                                {entry.year}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Desktop Center Node Column */}
                      <div className="desktop-node-wrap relative hidden h-full items-center justify-center lg:order-2 lg:flex">
                        <div
                          className={`milestone-node desktop-node ${isFirst ? 'node-filled' : 'node-empty'
                            } relative z-10 h-3.5 w-3.5 rounded-full border-2 border-[var(--gold)]/40 bg-[var(--warm-white)] transition-all duration-500`}
                        />

                        {/* Connector Branch to Card */}
                        <div
                          className={`connector-stem absolute top-1/2 h-[1.5px] w-6 -translate-y-1/2 ${isEven
                              ? 'left-1/2 bg-gradient-to-r from-[var(--gold)]/50 to-[var(--gold)]/10'
                              : 'right-1/2 bg-gradient-to-l from-[var(--gold)]/50 to-[var(--gold)]/10'
                            }`}
                        />
                      </div>

                      {/* Desktop Text Card Panel */}
                      <div
                        className={`entry-text w-full ${isEven ? 'lg:order-3 lg:pl-8' : 'lg:order-1 lg:pr-8'
                          }`}
                      >
                        <div className="group relative rounded-3xl border border-[var(--gold)]/15 bg-white/70 p-6 sm:p-8 shadow-[0_4px_24px_rgba(44,26,14,0.03)] backdrop-blur-md transition-all duration-300 hover:border-[var(--gold)]/35 hover:bg-white/85 hover:shadow-[0_8px_30px_rgba(200,150,42,0.08)]">
                          <div className="mb-4 flex items-center justify-between">
                            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--gold)]/30 bg-gradient-to-r from-[var(--gold)]/15 via-[var(--gold-light)]/20 to-[var(--gold)]/10 px-3.5 py-1 text-xs font-bold text-[var(--gold)] shadow-sm">
                              <span className="text-[10px]">✦</span>
                              <span>{entry.year}</span>
                            </div>
                          </div>

                          <h2 className="font-['Playfair_Display'] text-2xl font-bold leading-tight text-[var(--brown)] sm:text-3xl lg:text-3xl">
                            {entry.title}
                          </h2>

                          <div className="mt-3 h-0.5 w-10 rounded-full bg-gradient-to-r from-[var(--gold)] to-[var(--gold-light)]" />

                          <p className="mt-4 text-sm leading-[1.8] text-[var(--muted)] sm:text-base">
                            {entry.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* === END OF JOURNEY MILESTONE === */}
            <div className="mt-20 flex flex-col items-center gap-3 text-center sm:mt-28">
              <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[var(--gold)] to-[var(--gold-light)] shadow-lg shadow-[var(--gold)]/30 ring-4 ring-white">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <p className="font-['Playfair_Display'] text-xl font-bold italic text-[var(--brown)]">
                The story continues...
              </p>
              <p className="max-w-xs text-sm text-[var(--muted)]">
                Every milestone unlocks the next chapter of exploration.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* ===== LIGHTBOX MODAL ===== */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black/90 backdrop-blur-md"
          onClick={closeLightbox}
        >
          {/* Close */}
          <button
            onClick={closeLightbox}
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Counter */}
          <div className="absolute left-1/2 top-4 -translate-x-1/2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold text-white/80 backdrop-blur-sm">
            {lightbox.index + 1} / {lightbox.images.length}
          </div>

          {/* Prev */}
          {lightbox.images.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                prevImage();
              }}
              className="absolute left-3 top-1/2 z-10 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20 sm:left-6"
              aria-label="Previous"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}

          {/* Image */}
          <div
            className="relative mx-16 max-h-[85vh] max-w-4xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightbox.images[lightbox.index]}
              alt=""
              className="h-full max-h-[85vh] w-full rounded-2xl object-contain shadow-2xl"
            />
          </div>

          {/* Next */}
          {lightbox.images.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                nextImage();
              }}
              className="absolute right-3 top-1/2 z-10 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20 sm:right-6"
              aria-label="Next"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}

          {/* Thumbnail strip */}
          {lightbox.images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2 rounded-2xl bg-black/40 p-2 backdrop-blur-sm">
              {lightbox.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightbox((lb) => (lb ? { ...lb, index: idx } : null));
                  }}
                  className={`h-12 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${idx === lightbox.index
                      ? 'border-[var(--gold)] opacity-100 scale-105'
                      : 'border-transparent opacity-50 hover:opacity-80'
                    }`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}