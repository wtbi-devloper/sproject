import { useEffect, useState, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import apiClient from '../api/client';
import LogEntry from '../components/LogEntry';
import CalendarWidget from '../components/CalendarWidget';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { LOG_IMAGES } from '../constants/placeholders';
import { X } from 'lucide-react';

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

export default function DailyLog() {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [allLogs, setAllLogs] = useState<LogItem[]>([]); // All logs for calendar & tag extraction
  const [loading, setLoading] = useState(true);
  const logRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const mainRef = useRef<HTMLDivElement>(null);

  // URL-driven tag filtering (?tag=...)
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTag = searchParams.get('tag') || 'All';

  // Filter logs by activeTag
  const filteredLogs = useMemo(() => {
    if (!activeTag || activeTag === 'All') return logs;
    return logs.filter((log) => log.tags && log.tags.includes(activeTag));
  }, [logs, activeTag]);

  const handleTagSelect = (tag: string) => {
    if (tag === 'All' || tag === activeTag) {
      searchParams.delete('tag');
      setSearchParams(searchParams, { replace: true });
    } else {
      searchParams.set('tag', tag);
      setSearchParams(searchParams, { replace: true });
    }
  };

  const handleDateSelect = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const matchingLog = allLogs.find((log) => {
      const logDate = new Date(log.date).toISOString().split('T')[0];
      return logDate === dateStr;
    });

    if (matchingLog) {
      // If currently filtered and the selected log is hidden, clear tag filter to reveal it
      if (activeTag !== 'All' && (!matchingLog.tags || !matchingLog.tags.includes(activeTag))) {
        searchParams.delete('tag');
        setSearchParams(searchParams, { replace: true });
      }

      setTimeout(() => {
        const element = logRefs.current.get(matchingLog._id);
        if (element) {
          const y = element.getBoundingClientRect().top + window.scrollY - 100;
          window.scrollTo({ top: y, behavior: 'smooth' });
          
          gsap.fromTo(element, 
            { boxShadow: "0 0 0 4px var(--gold)" }, 
            { boxShadow: "0 0 0 0px var(--gold)", duration: 2, ease: "power2.out" }
          );
        }
      }, 60);
    }
  };

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

  // Fetch all logs for calendar and tag counts
  useEffect(() => {
    apiClient
      .get('/log')
      .then((res) => {
        const data = res.data?.data || res.data || [];
        setAllLogs(Array.isArray(data) ? data : []);
      })
      .catch(() => setAllLogs([]));
  }, []);

  // Use all logs for calendar dates
  const entryDates = useMemo(() => allLogs.map((l) => l.date), [allLogs]);

  useGSAP(
    () => {
      if (loading || filteredLogs.length === 0) return;
      
      // Animate cards on scroll
      gsap.utils.toArray<HTMLElement>('.log-card-reveal').forEach((card, i) => {
        gsap.fromTo(
          card,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: "power3.out",
            scrollTrigger: {
              trigger: card,
              start: "top bottom-=50",
              toggleActions: "play none none none",
            },
            delay: i < 4 ? i * 0.12 : 0,
          }
        );
      });
    },
    { scope: mainRef, dependencies: [loading, filteredLogs.length, activeTag] }
  );

  return (
    <div ref={mainRef} className="min-h-screen bg-[var(--warm-white)] pt-24 lg:pt-32 pb-24">
      {/* Bespoke Hero Section */}
      <section className="relative px-6 pb-12 lg:pb-16 max-w-7xl mx-auto">
        <div className="relative z-10 flex flex-col items-start text-left max-w-3xl">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--gold)]">
            <span className="inline-block h-px w-6 bg-[var(--gold)]" />
            Journal
          </div>
          <h1 className="mt-4 font-['Playfair_Display'] text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[var(--brown)]">
            Daily Log
          </h1>
          <p className="mt-4 max-w-2xl text-base sm:text-lg leading-relaxed text-[var(--muted)] font-medium">
            A running archive of day-to-day activities, sudden inspirations, progress, and continuous growth.
          </p>
          <div className="mt-6 h-1 w-20 rounded-full bg-gradient-to-r from-[var(--gold)] via-[var(--gold-light)] to-transparent" />
        </div>
      </section>

      {/* Active Filter Notice (only appears when arrived via tag link) */}
      {activeTag !== 'All' && (
        <section className="px-6 max-w-7xl mx-auto mb-8 relative z-20">
          <div className="inline-flex items-center gap-3 rounded-full bg-white/90 px-4 py-2 text-xs font-semibold text-[var(--brown)] border border-[var(--gold)]/30 shadow-xs backdrop-blur-md">
            <span>Filtered by <strong className="text-[var(--gold)]">#{activeTag}</strong></span>
            <button
              onClick={() => handleTagSelect('All')}
              className="inline-flex items-center gap-1 text-[var(--muted)] hover:text-[var(--brown)] transition-colors cursor-pointer pl-2 border-l border-[var(--brown)]/15"
              aria-label="Clear filter"
            >
              <X className="h-3.5 w-3.5" />
              <span>Clear</span>
            </button>
          </div>
        </section>
      )}

      {/* Main Content Area */}
      <section className="px-6 max-w-7xl mx-auto relative z-10">
        {loading && logs.length === 0 ? (
          <div className="grid gap-10 lg:grid-cols-[320px_1fr] items-start">
            <div className="skeleton h-[400px] w-full rounded-[2rem]" />
            <div className="columns-1 md:columns-2 gap-8 space-y-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="skeleton h-[460px] w-full rounded-[2rem] break-inside-avoid" />
              ))}
            </div>
          </div>
        ) : (
          <div className="grid gap-12 lg:grid-cols-[320px_1fr] items-start">
            {/* Sticky Sidebar */}
            <div className="hidden lg:block lg:sticky lg:top-32 space-y-8">
              <CalendarWidget entryDates={entryDates} onDateSelect={handleDateSelect} />
              
              <div className="hidden lg:block rounded-[2rem] border-2 border-dashed border-[var(--gold)]/20 bg-gradient-to-b from-white/40 to-transparent p-8 text-center backdrop-blur-xl">
                 <h3 className="font-['Playfair_Display'] text-2xl font-bold text-[var(--brown)] mb-3">
                   {activeTag !== 'All' ? 'Filtered Logs' : 'Total Logs'}
                 </h3>
                 <div className="text-5xl font-black text-[var(--gold)] drop-shadow-sm">
                   {filteredLogs.length}
                 </div>
                 <div className="mt-4 text-xs font-bold uppercase tracking-widest text-[var(--muted)]">
                   {activeTag !== 'All' ? `Tagged #${activeTag}` : 'Entries Archived'}
                 </div>
              </div>
            </div>

            {/* Premium Masonry Feed */}
            <div className="columns-1 md:columns-2 gap-8 space-y-8">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log, i) => {
                  const fallbackImage = LOG_IMAGES[i % LOG_IMAGES.length];
                  return (
                    <div 
                      key={log._id} 
                      ref={(el) => { if (el) logRefs.current.set(log._id, el); }}
                      className="log-card-reveal break-inside-avoid inline-block w-full rounded-[2rem]"
                    >
                      {/* Forcing style updates to the card variant so it spans 100% width of the masonry column */}
                      <div className="[&>article]:!w-full [&>article]:!h-auto [&>a]:!w-full [&>a]:!h-auto">
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
                          images={log.images && log.images.length > 0 ? log.images : [fallbackImage]}
                          imageBlurUrls={log.imageBlurUrls}
                          variant="card"
                          showReadingTime={true}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-2 rounded-[2rem] border-2 border-dashed border-[var(--brown)]/10 bg-white/50 p-16 text-center text-[var(--muted)] backdrop-blur-md">
                  <h3 className="font-['Playfair_Display'] text-2xl font-bold text-[var(--brown)] mb-2">
                    {activeTag !== 'All' ? `No entries tagged #${activeTag}` : "It's Quiet Here"}
                  </h3>
                  <p className="mb-6">
                    {activeTag !== 'All' 
                      ? "There are currently no log entries matching this tag filter."
                      : "No log entries have been published yet."}
                  </p>
                  {activeTag !== 'All' && (
                    <button
                      onClick={() => handleTagSelect('All')}
                      className="inline-flex items-center gap-2 rounded-full bg-[var(--gold)] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-[var(--gold)]/20 hover:scale-105 transition-all cursor-pointer"
                    >
                      Show all logs
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
