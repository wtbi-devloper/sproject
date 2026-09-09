import { useEffect, useState } from 'react';
import apiClient from '../api/client';
import SectionPageShell from '../components/SectionPageShell';
import OptimizedImage from '../components/OptimizedImage';
import { Newspaper } from 'lucide-react';

interface PressItem {
  _id: string;
  outlet: string;
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

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex flex-col h-full overflow-hidden rounded-3xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl"
      style={{
        backgroundColor: 'white',
        border: '1px solid rgba(44,26,14,0.07)',
        boxShadow: '0 2px 12px rgba(44,26,14,0.04)',
        animationDelay: `${index * 0.07}s`,
        textDecoration: 'none',
      }}
    >
      {/* Image Banner (with uniform height & fallback) */}
      <div className="relative h-48 w-full overflow-hidden shrink-0 bg-[var(--cream)]">
        {hasImage ? (
          <>
            <OptimizedImage
              src={item.images![0]}
              blurSrc={item.imageBlurUrls?.[0]}
              alt={item.title}
              fit="cover"
              loading="lazy"
              imgClassName="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div
              className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              style={{ background: 'linear-gradient(to top, rgba(200,150,42,0.15) 0%, transparent 60%)' }}
            />
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[var(--cream)] via-[var(--card-bg)] to-[var(--cream)]">
            <Newspaper className="h-12 w-12 text-[var(--gold)]/30" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-6 justify-between">
        <div>
          {/* Outlet + Year */}
          <div className="mb-3 flex items-center justify-between">
            <span
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em]"
              style={{
                backgroundColor: 'rgba(200,150,42,0.08)',
                color: 'var(--gold)',
                border: '1px solid rgba(200,150,42,0.2)',
              }}
            >
              <Newspaper className="h-3 w-3" />
              {item.outlet}
            </span>
            <span className="text-xs font-bold" style={{ color: 'var(--muted)' }}>
              {item.year}
            </span>
          </div>

          {/* Title */}
          <h3
            className="font-bold leading-snug transition-colors duration-200 group-hover:text-[var(--gold)] line-clamp-3"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: '1.05rem',
              color: 'var(--brown)',
            }}
          >
            {item.title}
          </h3>
        </div>

        {/* View Details hint */}
        <div
          className="mt-5 flex items-center gap-2 pt-4"
          style={{ borderTop: '1px solid rgba(44,26,14,0.05)' }}
        >
          <span
            className="text-xs font-bold transition-colors duration-200 group-hover:text-[var(--gold)]"
            style={{ color: 'var(--muted)' }}
          >
            Read Article ↗
          </span>
        </div>
      </div>

      <div
        className="absolute bottom-0 left-0 h-0.5 w-0 rounded-full transition-all duration-500 group-hover:w-full"
        style={{ background: 'linear-gradient(90deg, var(--gold), var(--gold-light))' }}
      />
    </a>
  );
}

export default function Press() {
  const [press, setPress] = useState<PressItem[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <SectionPageShell
      kicker="Press & Media"
      title="In the News"
      subtitle="Coverage, interviews, and media mentions from across the industry."
    >
      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton h-56 w-full rounded-3xl" />
          ))}
        </div>
      ) : press.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 animate-fade-up">
          {press.map((p, i) => (
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
            No press mentions yet.
          </p>
        </div>
      )}
    </SectionPageShell>
  );
}
