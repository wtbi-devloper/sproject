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

  // Mobile timeline refs for traveling beacon & progress
  const mobileTimelineAreaRef = useRef<HTMLDivElement>(null);
  const mobileTrackRef = useRef<HTMLDivElement>(null);
  const mobileProgressRef = useRef<HTMLDivElement>(null);
  const mobileDotRef = useRef<HTMLDivElement>(null);

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
  // Mobile shows first 3 entries
  const mobileItems = items.slice(0, 3);

  useGSAP(() => {
    if (loading || items.length === 0) return;

    const mm = gsap.matchMedia();

    // DESKTOP PINNED CINEMATIC WALKTHROUGH (lg: 1024px+)
    mm.add("(min-width: 1024px)", () => {
      const totalItems = items.length;

      if (totalItems <= 1) {
        gsap.set('.desktop-text:not(.item-0)', { opacity: 0, zIndex: 0 });
        gsap.set('.desktop-img:not(.item-0)', { opacity: 0, zIndex: 0 });
        gsap.set('.desktop-text.item-0', { opacity: 1, zIndex: 10 });
        gsap.set('.desktop-img.item-0', { opacity: 1, zIndex: 10 });
        gsap.set('.progress-fill', { height: '100%' });
        return;
      }

      gsap.set('.desktop-text', { zIndex: 0 });
      gsap.set('.desktop-text:not(.item-0) .desktop-text-elem', { opacity: 0, y: 30 });
      gsap.set('.desktop-img:not(.item-0)', { opacity: 0, z: -100, rotateX: -10, y: 100, zIndex: 0 });
      gsap.set('.desktop-text.item-0', { zIndex: 10 });
      gsap.set('.desktop-text.item-0 .desktop-text-elem', { opacity: 1, y: 0 });
      gsap.set('.desktop-img.item-0', { opacity: 1, z: 0, rotateX: 0, y: 0, scale: 1, zIndex: 10 });
      gsap.set('.progress-fill', { height: '0%' });

      const SCROLL_PER_ITEM = 50;

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
          tl.to({}, { duration: 1 })
            .to(`.desktop-text.item-${i - 1} .desktop-text-elem`, { opacity: 0, y: -30, duration: 0.5, stagger: 0.1, ease: 'power2.in' })
            .to(`.desktop-img.item-${i - 1}`, { opacity: 0, z: -50, rotateX: 10, y: -50, zIndex: 0, duration: 0.8, ease: 'power2.inOut' }, '<')
            .set(`.desktop-text.item-${i}`, { zIndex: 10 }, '<0.4')
            .set(`.desktop-img.item-${i}`, { zIndex: 10 }, '<0.4')
            .to(`.desktop-text.item-${i} .desktop-text-elem`, { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out' }, '<0.2')
            .to(`.desktop-img.item-${i}`, { opacity: 1, z: 0, rotateX: 0, y: 0, duration: 1, ease: 'power3.out' }, '<');
        }
      });

      tl.to({}, { duration: 1 });
    });

    // MOBILE INTERACTIVE TIMELINE WITH TRAVELING BEACON (< 1024px)
    mm.add("(max-width: 1023px)", () => {
      const entries = gsap.utils.toArray<HTMLElement>('.mobile-story-entry');
      if (entries.length === 0) return;

      const firstEntry = entries[0];
      const lastEntry = entries[entries.length - 1];

      const track = mobileTrackRef.current;
      const progressLine = mobileProgressRef.current;
      const beacon = mobileDotRef.current;
      if (!track || !progressLine || !beacon || !mobileTimelineAreaRef.current) return;

      const firstNode = firstEntry.querySelector<HTMLElement>('.mobile-node');
      const lastNode = lastEntry.querySelector<HTMLElement>('.mobile-node');
      if (!firstNode || !lastNode) return;

      const areaRect = mobileTimelineAreaRef.current.getBoundingClientRect();
      const firstRect = firstNode.getBoundingClientRect();
      const lastRect = lastNode.getBoundingClientRect();

      const topOffset = firstRect.top + firstRect.height / 2 - areaRect.top;
      const leftOffset = firstRect.left + firstRect.width / 2 - areaRect.left;
      const initialTrackHeight = Math.max(lastRect.top - firstRect.top, 60);

      track.style.left = `${leftOffset}px`;
      track.style.top = `${topOffset}px`;
      track.style.height = `${initialTrackHeight}px`;

      gsap.set(beacon, { xPercent: -50, yPercent: -50, y: 0 });
      gsap.set(progressLine, { scaleY: 0, transformOrigin: 'top center' });

      const nodeThresholds: { node: HTMLElement; threshold: number }[] = [];
      const startY = firstRect.top + firstRect.height / 2;
      const totalSpan = Math.max(lastRect.top + lastRect.height / 2 - startY, 1);

      entries.forEach((entry) => {
        const node = entry.querySelector<HTMLElement>('.mobile-node');
        if (node) {
          const nodeCenterY = node.getBoundingClientRect().top + node.getBoundingClientRect().height / 2;
          const dist = nodeCenterY - startY;
          const threshold = totalSpan > 0 ? Math.max(0, Math.min(1, dist / totalSpan)) : 0;
          nodeThresholds.push({ node, threshold });
        }
      });

      const updateNodeStates = (p: number) => {
        nodeThresholds.forEach(({ node, threshold }, i) => {
          if (i === 0) {
            node.classList.remove('node-empty');
            node.classList.add('node-filled');
            return;
          }
          if (p >= threshold) {
            node.classList.remove('node-empty');
            node.classList.add('node-filled');
          } else {
            node.classList.remove('node-filled');
            node.classList.add('node-empty');
          }
        });
      };

      // 1. Progress line expansion
      gsap.fromTo(
        progressLine,
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: firstEntry,
            endTrigger: lastNode,
            start: 'top 35%',
            end: 'center 50%',
            scrub: true,
          },
        }
      );

      // 2. Traveling beacon locomotion along track
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
            start: 'top 35%',
            end: 'center 50%',
            scrub: true,
            invalidateOnRefresh: true,
            onUpdate: (self) => updateNodeStates(self.progress),
            onRefresh: (self) => updateNodeStates(self.progress),
          },
        }
      );
    });

    return () => { mm.revert(); };
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
          {/* ─────────────────────────────────────────────────────────
              MOBILE: Vertical card list with interactive traveling beacon.
              Mirrors Story page mobile luxury design & GSAP beacon locomotion.
              Hidden on lg+ (desktop uses GSAP pinned section below).
          ───────────────────────────────────────────────────────── */}
          <div className="lg:hidden bg-[var(--cream)] pt-20 pb-12">
            {/* Section header */}
            <div className="px-5 mb-8">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--gold)]">
                <span className="inline-block h-px w-6 bg-[var(--gold)]" />
                My Story
              </div>
              <h2 className="mt-2 font-['Playfair_Display'] text-3xl font-bold tracking-tight text-[var(--brown)]">
                The journey so far.
              </h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Pivotal milestones and defining chapters.
              </p>
            </div>

            {/* Timeline area container */}
            <div
              ref={mobileTimelineAreaRef}
              className="relative flex flex-col gap-6 pl-10 sm:pl-12 px-4 sm:px-5"
            >
              {/* MOBILE TIMELINE TRACK: Starts at first node, ends at last node */}
              <div
                ref={mobileTrackRef}
                className="pointer-events-none absolute left-4 sm:left-5"
                style={{ top: '32px', height: 'calc(100% - 64px)' }}
              >
                {/* Background track line */}
                <div className="absolute left-0 top-0 h-full w-[2px] -translate-x-1/2 bg-[var(--brown)]/10" />

                {/* Mobile progress bar line */}
                <div
                  ref={mobileProgressRef}
                  style={{ transformOrigin: 'top center' }}
                  className="absolute left-0 top-0 h-full w-[2.5px] -translate-x-1/2 origin-top bg-gradient-to-b from-[var(--gold)] via-[var(--gold-light)] to-[var(--gold)] drop-shadow-[0_0_8px_rgba(200,150,42,0.5)] will-change-transform"
                />

                {/* Mobile traveling beacon (GPU animated glowing dot) */}
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

              {/* Milestone entries */}
              {mobileItems.map((entry, i) => {
                const hasImage = entry.images && entry.images.length > 0;
                const isFirst = i === 0;
                return (
                  <article
                    key={entry._id}
                    onClick={() => navigate('/page/story')}
                    className="mobile-story-entry relative w-full rounded-3xl border border-[var(--gold)]/20 bg-white/80 p-5 shadow-[0_8px_30px_rgba(44,26,14,0.04)] backdrop-blur-md transition-all duration-300 sm:p-6 cursor-pointer hover:border-[var(--gold)]/40 hover:shadow-[0_12px_40px_rgba(200,150,42,0.1)]"
                  >
                    {/* Timeline node connector */}
                    <div className="absolute -left-6 sm:-left-7 top-8 z-10 -translate-y-1/2 flex items-center">
                      <div
                        className={`milestone-node mobile-node ${
                          isFirst ? 'node-filled' : 'node-empty'
                        } h-3 w-3 shrink-0 -translate-x-1/2 rounded-full border-2 border-[var(--gold)]/40 bg-[var(--warm-white)] transition-all duration-500`}
                      />
                      <div className="h-[1.5px] w-[18px] sm:w-[22px] bg-gradient-to-r from-[var(--gold)]/70 to-[var(--gold)]/20" />
                    </div>

                    {/* Year badge */}
                    <div className="mb-3">
                      <div className="inline-flex items-center gap-2 rounded-full border border-[var(--gold)]/30 bg-gradient-to-r from-[var(--gold)]/15 via-[var(--gold-light)]/20 to-[var(--gold)]/10 px-3.5 py-1 text-xs font-bold text-[var(--gold)] shadow-sm">
                        <span className="text-[10px]">✦</span>
                        <span>{entry.year}</span>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="font-['Playfair_Display'] text-xl font-bold leading-tight text-[var(--brown)] sm:text-2xl">
                      {entry.title}
                    </h3>

                    {/* Gold accent bar */}
                    <div className="mt-2.5 mb-4 h-0.5 w-10 rounded-full bg-gradient-to-r from-[var(--gold)] to-[var(--gold-light)]" />

                    {/* Image */}
                    {hasImage && (
                      <div className="mb-4 overflow-hidden rounded-2xl">
                        <div className="relative overflow-hidden rounded-xl border border-[var(--gold)]/20 bg-white/30 p-1">
                          <OptimizedImage
                            src={entry.images![0]}
                            blurSrc={entry.imageBlurUrls?.[0]}
                            alt={entry.title}
                            fit="cover"
                            loading={i === 0 ? "eager" : "lazy"}
                            imgClassName="aspect-[4/3] w-full object-cover rounded-lg"
                          />
                        </div>
                      </div>
                    )}

                    {/* Description */}
                    <p className="text-sm leading-[1.8] text-[var(--muted)] line-clamp-3">
                      {entry.description}
                    </p>

                    {/* Read more hint */}
                    <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-[var(--gold)]">
                      <span>Read full story</span>
                      <span>→</span>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Mobile CTA: Clean button with no "+2" card */}
            <div className="mt-8 flex justify-center px-5">
              <NavLink
                to="/page/story"
                className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[var(--gold)] to-[var(--gold-light)] px-7 py-3 text-sm font-bold text-white shadow-lg shadow-[var(--gold)]/20 transition-all duration-300 hover:scale-105"
              >
                View Full Story
                <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
              </NavLink>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────
              DESKTOP: GSAP Pinned Cinematic Composition (lg+)
          ───────────────────────────────────────────────────────── */}
          <div ref={desktopContainerRef} className="hidden lg:flex flex-col lg:flex-row h-[100dvh] w-full overflow-hidden bg-[var(--cream)] relative lg:pt-0 lg:pb-0 lg:justify-start">

            {/* Header */}
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
              {/* Progress Bar with dot markers */}
              <div className="absolute left-6 lg:left-[max(2.5rem,calc((100vw-80rem)/2+2.5rem))] top-2 lg:top-1/2 h-[130px] sm:h-[180px] lg:h-[300px] w-[2px] lg:-translate-y-1/2 bg-[var(--brown)]/10 rounded-full">
                <div className="progress-fill w-full bg-gradient-to-b from-[var(--gold)] to-[var(--gold-light)] h-0 relative rounded-full">
                  <div className="absolute -bottom-1.5 -left-[5px] h-[12px] w-[12px] rounded-full bg-white shadow-[0_0_15px_var(--gold)] border-[2px] border-[var(--gold)] z-10" />
                </div>
                {/* Item count dots */}
                {items.map((_, i) => (
                  <div
                    key={i}
                    className="absolute -left-[4px] h-[10px] w-[10px] rounded-full border-2 border-[var(--gold)]/40 bg-[var(--cream)]"
                    style={{ top: `${(i / Math.max(items.length - 1, 1)) * 100}%`, transform: 'translateY(-50%)' }}
                  />
                ))}
              </div>

              {/* Text Items */}
              <div className="relative ml-7 lg:ml-12 h-[130px] sm:h-[180px] lg:h-[300px] w-full">
                {items.map((entry, i) => (
                  <div
                    key={entry._id}
                    onClick={() => navigate('/page/story')}
                    className={`desktop-text item-${i} group absolute top-1/2 flex w-full -translate-y-1/2 flex-col cursor-pointer`}
                  >
                    <div className="desktop-text-elem text-xs lg:text-sm font-semibold uppercase tracking-widest text-[var(--gold)]">
                      {entry.year}
                    </div>
                    <h3 className="desktop-text-elem mt-1 sm:mt-2 lg:mt-4 font-['Playfair_Display'] text-xl sm:text-2xl lg:text-3xl font-bold leading-tight text-[var(--brown)] xl:text-4xl pr-4 transition-colors duration-200 group-hover:text-[var(--gold)]">
                      {entry.title}
                      <span className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-[var(--gold)]">→</span>
                    </h3>
                    <p className="desktop-text-elem mt-1 sm:mt-2 lg:mt-6 max-w-md text-xs sm:text-sm lg:text-base leading-relaxed text-[var(--muted)] xl:text-lg line-clamp-none pr-4">
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
                    <div
                      key={entry._id}
                      onClick={() => hasImage && navigate('/page/story')}
                      className={`desktop-img item-${i} absolute inset-0 overflow-hidden rounded-2xl ${hasImage ? 'cursor-pointer shadow-2xl shadow-[var(--brown)]/15 border border-[var(--gold)]/20 bg-white/30 backdrop-blur-sm p-2 lg:p-3' : 'pointer-events-none'}`}
                    >
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

            {/* Desktop CTA */}
            <div className="relative lg:absolute lg:bottom-12 lg:left-[max(1.5rem,calc((100vw-80rem)/2+1.5rem))] z-20 xl:bottom-16 flex justify-center lg:justify-start shrink-0">
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
