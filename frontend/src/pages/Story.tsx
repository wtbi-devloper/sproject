import { useEffect, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import { Sparkles } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import apiClient from '../api/client';
import OptimizedImage from '../components/OptimizedImage';
import LightboxModal from '../components/LightboxModal';

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

      // Select active track, progress line, beacon, and node selector for current viewport
      const track = isMobile ? mobileTrackRef.current : desktopTrackRef.current;
      const progressLine = isMobile ? mobileProgressRef.current : progressBarRef.current;
      const beacon = isMobile ? mobileDotRef.current : travelingDotRef.current;
      const nodeSelector = isMobile ? '.mobile-node' : '.desktop-node';

      const firstNode = firstEntry.querySelector<HTMLElement>(nodeSelector);
      const lastNode = lastEntry.querySelector<HTMLElement>(nodeSelector);

      if (!track || !progressLine || !beacon || !firstNode || !lastNode) return;

      const areaRect = timelineAreaRef.current.getBoundingClientRect();
      const firstRect = firstNode.getBoundingClientRect();
      const lastRect = lastNode.getBoundingClientRect();

      const topOffset = firstRect.top + firstRect.height / 2 - areaRect.top;
      const leftOffset = firstRect.left + firstRect.width / 2 - areaRect.left;
      const initialTrackHeight = Math.max(lastRect.top - firstRect.top, 60);

      // Align track origin precisely to the center of the first static node on both X and Y axes
      track.style.left = `${leftOffset}px`;
      track.style.top = `${topOffset}px`;
      track.style.height = `${initialTrackHeight}px`;

      // Set hardware-accelerated initial transforms (centered on track origin)
      gsap.set(beacon, { xPercent: -50, yPercent: -50, y: 0 });
      gsap.set(progressLine, { scaleY: 0, transformOrigin: 'top center' });

      // Pre-calculate exact threshold (0.0 to 1.0) for every milestone station
      const nodeThresholds: { node: HTMLElement; threshold: number }[] = [];
      const startY = firstRect.top + firstRect.height / 2;
      const totalSpan = Math.max(lastRect.top + lastRect.height / 2 - startY, 1);

      entries.forEach((entry) => {
        const node = entry.querySelector<HTMLElement>(nodeSelector);
        if (node) {
          const nodeCenterY = node.getBoundingClientRect().top + node.getBoundingClientRect().height / 2;
          const dist = nodeCenterY - startY;
          const threshold = totalSpan > 0 ? Math.max(0, Math.min(1, dist / totalSpan)) : 0;
          nodeThresholds.push({ node, threshold });
        }
      });

      // Synchronous Node Ignition: ignites node ONLY when the moving beacon has arrived at or passed it
      const updateNodeStates = (p: number) => {
        nodeThresholds.forEach(({ node, threshold }, i) => {
          if (i === 0) {
            // Initial static node is filled by default as the journey's starting station
            node.classList.remove('node-empty');
            node.classList.add('node-filled');
            return;
          }
          // Only fill when beacon has actually arrived at or passed this node's exact position!
          if (p >= threshold) {
            node.classList.remove('node-empty');
            node.classList.add('node-filled');
          } else {
            node.classList.remove('node-filled');
            node.classList.add('node-empty');
          }
        });
      };

      // 1. Progress line expansion (starts strictly at 0 on initial scroll)
      gsap.fromTo(
        progressLine,
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: firstEntry,
            endTrigger: lastNode,
            start: isMobile ? 'top 25%' : 'top 30%',
            end: isMobile ? 'center 45%' : 'center 45%',
            scrub: true,
          },
        }
      );

      // 2. Beacon locomotion: starts concentric on first static node, moves down as user scrolls
      gsap.fromTo(
        beacon,
        { y: 0 },
        {
          y: () => {
            const f = firstNode.getBoundingClientRect();
            const l = lastNode.getBoundingClientRect();
            const h = Math.max(l.top - f.top, 60);
            if (track) track.style.height = `${h}px`;
            return h;
          },
          ease: 'none',
          scrollTrigger: {
            trigger: firstEntry,
            endTrigger: lastNode,
            start: isMobile ? 'top 25%' : 'top 30%',
            end: isMobile ? 'center 45%' : 'center 45%',
            scrub: true,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              updateNodeStates(self.progress);
            },
            onRefresh: (self) => {
              updateNodeStates(self.progress);
            },
          },
        }
      );

      // 3. Desktop Per-entry entrance animations & connector stems
      entries.forEach((entry) => {
        const isEven = entry.classList.contains('even');
        const imgPanel = entry.querySelector('.desktop-view .entry-img');
        const textPanel = entry.querySelector('.desktop-view .entry-text');
        const connectorStem = entry.querySelector('.connector-stem');

        if (textPanel && !isMobile) {
          gsap.fromTo(
            textPanel,
            { opacity: 0, x: isEven ? 35 : -35 },
            {
              opacity: 1,
              x: 0,
              duration: 0.7,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: entry,
                start: 'top 88%',
                toggleActions: 'play none none reverse',
              },
            }
          );
        }

        if (imgPanel && !isMobile) {
          gsap.fromTo(
            imgPanel,
            { opacity: 0, x: isEven ? -35 : 35, scale: 0.98 },
            {
              opacity: 1,
              x: 0,
              scale: 1,
              duration: 0.75,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: entry,
                start: 'top 88%',
                toggleActions: 'play none none reverse',
              },
            }
          );
        }

        if (connectorStem && !isMobile) {
          const targetNode = entry.querySelector('.desktop-node');
          gsap.fromTo(
            connectorStem,
            { scaleX: 0, transformOrigin: isEven ? 'left center' : 'right center' },
            {
              scaleX: 1,
              duration: 0.35,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: targetNode || entry,
                start: 'center 62%',
                toggleActions: 'play reverse play reverse',
              },
            }
          );
        }
      });

      // 4. Dynamic Content / Image Loading Defense (ResizeObserver)
      let ro: ResizeObserver | null = null;
      if (typeof ResizeObserver !== 'undefined' && timelineAreaRef.current) {
        ro = new ResizeObserver(() => {
          ScrollTrigger.refresh();
        });
        ro.observe(timelineAreaRef.current);
      }

      // Initial calibration refresh
      ScrollTrigger.refresh();

      return () => {
        if (ro) ro.disconnect();
      };
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

      {/* ===== BESPOKE HERO HEADER ===== */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-8 pt-24 sm:pb-12 sm:pt-28 lg:pt-32">
        <div className="flex flex-col items-start text-left max-w-3xl">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--gold)]">
            <span className="inline-block h-px w-6 bg-[var(--gold)]" />
            Our Story
          </div>
          <h1 className="mt-4 font-['Playfair_Display'] text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[var(--brown)]">
            The Journey <span className="italic text-[var(--gold-light)]">So Far.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-base sm:text-lg leading-relaxed text-[var(--muted)] font-medium">
            An evolving narrative of pivotal milestones, defining chapters, and the continuous pursuit of purposeful work.
          </p>
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
                className="pointer-events-none absolute hidden lg:block"
                style={{ top: '0px', height: '100%', left: '50%' }}
              >
                {/* Background track line */}
                <div className="absolute left-0 top-0 h-full w-[2px] -translate-x-1/2 bg-[var(--brown)]/10" />

                {/* Ambient glow groove */}
                <div className="absolute left-0 top-0 h-full w-24 -translate-x-1/2 bg-gradient-to-r from-transparent via-[var(--gold)]/[0.04] to-transparent" />

                {/* Progress bar */}
                <div
                  ref={progressBarRef}
                  style={{ transformOrigin: 'top center' }}
                  className="absolute left-0 top-0 h-full w-[2.5px] -translate-x-1/2 origin-top bg-gradient-to-b from-[var(--gold)] via-[var(--gold-light)] to-[var(--gold)] drop-shadow-[0_0_8px_rgba(200,150,42,0.5)] will-change-transform"
                />

                {/* Traveling beacon (GPU animated) */}
                <div
                  ref={travelingDotRef}
                  className="absolute left-0 top-0 z-20 will-change-transform"
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
                  className="absolute left-0 top-0 h-full w-[2px] -translate-x-1/2 origin-top bg-gradient-to-b from-[var(--gold)] via-[var(--gold-light)] to-[var(--gold)] drop-shadow-[0_0_8px_rgba(200,150,42,0.5)] will-change-transform"
                />

                {/* Mobile traveling beacon (GPU animated) */}
                <div
                  ref={mobileDotRef}
                  className="absolute left-0 top-0 z-20 will-change-transform"
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

      {/* ===== UNIVERSAL REUSABLE LIGHTBOX MODAL WITH MOBILE TOUCH SWIPE ===== */}
      <LightboxModal
        isOpen={!!lightbox}
        images={lightbox?.images || []}
        currentIndex={lightbox?.index || 0}
        onClose={closeLightbox}
        onIndexChange={(newIndex) =>
          setLightbox((lb) => (lb ? { ...lb, index: newIndex } : null))
        }
      />
    </div>
  );
}