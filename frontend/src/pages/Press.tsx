import { useEffect, useState, useMemo } from 'react';
import apiClient from '../api/client';
import SectionPageShell from '../components/SectionPageShell';
import OptimizedImage from '../components/OptimizedImage';
import { Newspaper, ArrowUpRight, Filter } from 'lucide-react';
import { DEMO_PRESS } from '../constants/placeholders';

export interface PressItem {
  _id: string;
  outlet: string;
  outletLogo?: string;
  outletLogoBlurUrl?: string;
  mediaType?: string;
  title: string;
  year: string;
  link?: string;
  url?: string;
  images?: string[];
  imageBlurUrls?: string[];
}

function PressCard({ item, index }: { item: PressItem; index: number }) {
  const hasImage = item.images && item.images.length > 0;
  const href = item.link || item.url || '#';
  const mediaType = item.mediaType || 'Newspaper';

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex flex-col h-full overflow-hidden rounded-[26px] transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid rgba(200,150,42,0.18)',
        boxShadow: '0 4px 20px -4px rgba(44,26,14,0.06)',
        animationDelay: `${index * 0.06}s`,
        textDecoration: 'none',
      }}
    >
      {/* 1. Masthead Header: Top-Left Year + Media Format, Top-Right Logo/Badge, and Full Outlet Title */}
      <div className="flex flex-col gap-2 px-5 py-3.5 sm:px-6 sm:py-4 bg-[#FAF8F5] border-b border-[var(--brown)]/8">
        {/* Top row: Format pill on left, Logo or 'Press Coverage' on top right */}
        <div className="flex items-center justify-between gap-3 min-h-[44px]">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-black uppercase tracking-wider shrink-0"
            style={{
              backgroundColor: 'rgba(200,150,42,0.12)',
              color: 'var(--gold)',
              border: '1px solid rgba(200,150,42,0.25)',
            }}
          >
            <Newspaper className="h-3 w-3 shrink-0" />
            <span>{item.year} · {mediaType}</span>
          </span>

          {/* Top-Right: Logo if available, else 'Press Coverage' text */}
          {item.outletLogo ? (
            <div className="h-10 sm:h-12 max-w-[150px] sm:max-w-[180px] flex items-center justify-end shrink-0">
              <img
                src={item.outletLogo}
                alt={item.outlet}
                className="max-h-10 sm:max-h-12 max-w-full object-contain object-right pointer-events-none drop-shadow-xs"
              />
            </div>
          ) : (
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]/60 shrink-0">
              Press Coverage
            </span>
          )}
        </div>

        {/* Outlet Title row: Always visible, full text with no clipping */}
        <div className="flex items-center min-h-[26px]">
          <h4
            className="font-['Playfair_Display'] font-black text-sm sm:text-base tracking-wide uppercase text-[var(--brown)] leading-snug break-words"
            title={item.outlet}
          >
            {item.outlet}
          </h4>
        </div>
      </div>

      {/* 2. Newspaper Clipping Preview Frame */}
      <div className="relative w-full aspect-[16/10] overflow-hidden shrink-0 bg-[#F5F2EA] border-b border-[var(--brown)]/6">
        {hasImage ? (
          <>
            <OptimizedImage
              src={item.images![0]}
              blurSrc={item.imageBlurUrls?.[0]}
              alt={`${item.outlet} — ${item.title}`}
              fit="cover"
              loading="lazy"
              className="block h-full w-full"
              imgClassName="block h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
            {/* Subtle newsprint inner shadow vignette */}
            <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_16px_rgba(44,26,14,0.14)]" />
          </>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-[#F5F2EA] via-[#EFECE3] to-[#F5F2EA]">
            <Newspaper className="h-10 w-10 text-[var(--gold)]/40 mb-2" />
            <span className="text-xs font-bold uppercase tracking-widest text-[var(--brown)]/50">
              Editorial Feature
            </span>
          </div>
        )}
      </div>

      {/* 3. Headline & Story Content */}
      <div className="flex flex-1 flex-col justify-between p-5 sm:p-6 bg-white gap-4">
        <div>
          <h3
            className="font-bold leading-snug transition-colors duration-200 group-hover:text-[var(--gold)] line-clamp-3"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: '1.1rem',
              color: 'var(--brown)',
            }}
          >
            {item.title}
          </h3>
        </div>

        {/* 4. Action Footer */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-[var(--brown)]/6 text-xs">
          <span
            className="flex-1 min-w-0 text-[11.5px] font-semibold text-[var(--muted)] truncate"
            title={item.outlet}
          >
            {item.outlet}
          </span>
          <span className="inline-flex items-center gap-1 font-bold text-[var(--gold)] group-hover:translate-x-1 transition-transform shrink-0">
            Read Article
            <ArrowUpRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>

      {/* Gold hover underline indicator */}
      <div
        className="absolute bottom-0 left-0 h-1 w-0 rounded-full transition-all duration-500 group-hover:w-full"
        style={{ background: 'linear-gradient(90deg, var(--gold), var(--gold-light))' }}
      />
    </a>
  );
}

export default function Press() {
  const [press, setPress] = useState<PressItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFormat, setSelectedFormat] = useState<string>('All');

  useEffect(() => {
    apiClient
      .get('/press')
      .then((res) => {
        const data = res.data?.data || res.data || [];
        setPress(Array.isArray(data) ? data : []);
      })
      .catch(() => setPress([]))
      .finally(() => setLoading(false));
  }, []);

  const displayItems = press.length > 0 ? press : (DEMO_PRESS as PressItem[]);

  const formats = useMemo(() => {
    const set = new Set<string>();
    displayItems.forEach((p) => {
      if (p.mediaType) set.add(p.mediaType);
    });
    return ['All', ...Array.from(set)];
  }, [displayItems]);

  const filteredItems = useMemo(() => {
    if (selectedFormat === 'All') return displayItems;
    return displayItems.filter((p) => (p.mediaType || 'Newspaper') === selectedFormat);
  }, [displayItems, selectedFormat]);

  return (
    <SectionPageShell
      kicker="Press & Media"
      title="In the News"
      subtitle="Newspaper features, publication spreads, and broadcast media coverage."
    >
      {/* Format Filter Bar */}
      {formats.length > 2 && (
        <div className="mb-10 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--muted)] mr-2">
            <Filter className="h-3.5 w-3.5 text-[var(--gold)]" />
            Filter Format:
          </span>
          {formats.map((fmt) => (
            <button
              key={fmt}
              type="button"
              onClick={() => setSelectedFormat(fmt)}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all duration-200 cursor-pointer ${
                selectedFormat === fmt
                  ? 'bg-[var(--gold)] text-white shadow-md shadow-[var(--gold)]/20 scale-105'
                  : 'bg-white border border-[var(--brown)]/10 text-[var(--brown)] hover:bg-[var(--warm-white)]'
              }`}
            >
              {fmt}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton h-80 w-full rounded-3xl" />
          ))}
        </div>
      ) : filteredItems.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 animate-fade-up">
          {filteredItems.map((p, i) => (
            <PressCard key={p._id} item={p} index={i} />
          ))}
        </div>
      ) : (
        <div
          className="flex flex-col items-center justify-center rounded-3xl py-24 text-center"
          style={{
            backgroundColor: 'var(--card-bg)',
            border: '2px dashed rgba(200,150,42,0.2)',
          }}
        >
          <Newspaper className="mb-4 h-12 w-12" style={{ color: 'rgba(200,150,42,0.3)' }} />
          <p className="font-bold" style={{ color: 'var(--muted)' }}>
            No media mentions match the selected filter.
          </p>
        </div>
      )}
    </SectionPageShell>
  );
}
