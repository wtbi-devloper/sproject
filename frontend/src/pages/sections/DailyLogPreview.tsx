import { useEffect, useState, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import apiClient from '../../api/client';
import LogEntry from '../../components/LogEntry';
import { DEMO_LOGS, LOG_IMAGES } from '../../constants/placeholders';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
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

export default function DailyLogPreview() {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    apiClient
      .get('/log')
      .then((res) => {
        const data = res.data?.data || res.data || [];
        setLogs(Array.isArray(data) ? data : []);
      })
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, []);

  const items: LogItem[] =
    logs.length > 0
      ? logs.slice(0, 10).map((log, i) => ({
        ...log,
        images: log.images && log.images.length > 0 ? log.images : [LOG_IMAGES[i % LOG_IMAGES.length]],
      }))
      : (DEMO_LOGS as LogItem[]).slice(0, 10);

  useGSAP(() => {
    if (loading || items.length === 0) return;

    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;

    // Calculate scroll amount so the track aligns with the right edge of the screen
    const getScrollAmount = () => track.scrollWidth - window.innerWidth + 80;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: () => `+=${getScrollAmount()}`,
        pin: true,
        scrub: 1,
        refreshPriority: 0,
        invalidateOnRefresh: true,
      },
    });

    tl.to(track, {
      x: () => -getScrollAmount(),
      ease: 'none',
    });

    // Slight scale effect on cards as they scroll into view
    gsap.utils.toArray<HTMLElement>('.log-card-wrapper').forEach((card) => {
      gsap.fromTo(
        card,
        { scale: 0.9, opacity: 0.5 },
        {
          scale: 1,
          opacity: 1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: card,
            containerAnimation: tl,
            start: 'left 80%',
            end: 'left 20%',
            scrub: true,
          },
        },
      );
    });
  }, [loading, items.length]);

  return (
    <section ref={sectionRef} id="daily-log" className="relative overflow-hidden bg-[var(--warm-white)] pt-18 pb-20 lg:pt-22 lg:pb-32 min-h-[100vh] flex flex-col justify-center">
      <div className="mx-auto w-full max-w-7xl px-6 lg:mb-12">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--gold)]">
              <span className="inline-block h-px w-6 bg-[var(--gold)]" />
              Daily Log
            </div>
            <h2 className="mt-3 font-['Playfair_Display'] text-3xl font-bold tracking-tight text-[var(--brown)] sm:text-4xl lg:text-5xl">
              What's Happening
            </h2>
          </div>
          <NavLink
            to="/page/daily-log"
            className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[var(--gold)] to-[var(--gold-light)] px-5 py-2 sm:px-6 sm:py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-[var(--gold)]/20 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[var(--gold)]/30 shrink-0 self-start sm:self-auto"
          >
            View All Entries
            <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
          </NavLink>
        </div>
      </div>

      {loading ? (
        <div className="mx-auto max-w-7xl px-6 mt-8 flex flex-row items-stretch gap-6 lg:gap-8 lg:mt-8 w-max">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-[450px] sm:h-[500px] w-[84vw] max-w-[360px] sm:w-[400px] sm:max-w-none rounded-[2rem]" />
          ))}
        </div>
      ) : (
        <div className="relative mt-8 lg:mt-0 pl-6 lg:pl-[max(1.5rem,calc((100vw-80rem)/2))] pr-8">
          <div ref={trackRef} className="flex flex-row items-stretch gap-6 lg:gap-8 px-0 w-max">
            {items.map((log) => (
              <div key={log._id} className="log-card-wrapper shrink-0">
                <LogEntry
                  id={log._id}
                  date={new Date(log.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                  title={log.title}
                  body={log.body}
                  tags={log.tags}
                  images={log.images}
                  imageBlurUrls={log.imageBlurUrls}
                  variant="card"
                />
              </div>
            ))}

            {/* View All Card at the end of scroll */}
            <div className="log-card-wrapper flex h-[450px] sm:h-[500px] w-[84vw] max-w-[360px] sm:w-[400px] sm:max-w-none shrink-0 flex-col items-center justify-center rounded-[2rem] border-2 border-dashed border-[var(--gold)]/30 bg-[var(--gold)]/5 p-8 text-center transition-all duration-500 hover:border-[var(--gold)] hover:bg-[var(--gold)]/10 hover:-translate-y-1">
              <div className="mb-6 rounded-full bg-[var(--gold)] p-5 text-white shadow-xl shadow-[var(--gold)]/20">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>
              <h3 className="mb-3 font-['Playfair_Display'] text-3xl font-bold text-[var(--brown)]">View All Logs</h3>
              <p className="mb-8 text-base text-[var(--muted)]">Explore the complete archive of logs and announcements.</p>
              <NavLink
                to="/page/daily-log"
                className="rounded-full bg-[var(--brown)] px-8 py-3.5 text-sm font-bold text-white transition-colors hover:bg-[var(--brown-light)] shadow-lg"
              >
                View All Logs
              </NavLink>
            </div>
          </div>

        </div>
      )}
    </section>
  );
}
