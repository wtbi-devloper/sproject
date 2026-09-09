import { useEffect, useState, useCallback } from 'react';
import { useParams, NavLink } from 'react-router-dom';
import apiClient from '../api/client';
import SectionPageShell from '../components/SectionPageShell';
import OptimizedImage from '../components/OptimizedImage';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface Achievement {
  _id: string;
  icon?: string;
  title: string;
  description: string;
  year: string;
  images?: string[];
  imageBlurUrls?: string[];
}

/* ── Image Carousel ── */
function ImageCarousel({ images, imageBlurUrls }: { images: string[]; imageBlurUrls?: string[] }) {
  const [current, setCurrent] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => setCurrent((p) => (p + 1) % images.length), [images.length]);
  const prev = useCallback(() => setCurrent((p) => (p - 1 + images.length) % images.length), [images.length]);

  useEffect(() => {
    if (images.length <= 1 || paused) return;
    const t = setInterval(next, 4000);
    return () => clearInterval(t);
  }, [images.length, paused, next]);

  if (images.length === 0) return null;

  if (images.length === 1) {
    return (
      <div className="relative group cursor-pointer" onClick={() => setLightbox(true)}>
        <div className="overflow-hidden rounded-2xl" style={{ backgroundColor: 'var(--warm-white)' }}>
          <OptimizedImage src={images[0]} blurSrc={imageBlurUrls?.[0]} alt="Achievement image" fit="contain" loading="eager" fetchPriority="high"
            imgClassName="w-full h-auto max-h-[320px] sm:max-h-[420px] lg:max-h-[480px] transition-transform duration-500 group-hover:scale-[1.02]" />
        </div>
        <div className="absolute bottom-3 right-3 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--brown)' }}>
          🔍 View full size
        </div>
        {lightbox && <Lightbox images={images} imageBlurUrls={imageBlurUrls} current={current} onClose={() => setLightbox(false)} onNext={next} onPrev={prev} />}
      </div>
    );
  }

  return (
    <div className="relative" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="relative overflow-hidden rounded-2xl shadow-lg" style={{ backgroundColor: 'var(--warm-white)' }}>
        <div className="relative cursor-pointer group" onClick={() => setLightbox(true)}>
          <OptimizedImage key={current} src={images[current]} blurSrc={imageBlurUrls?.[current]} alt={`Image ${current + 1} of ${images.length}`}
            fit="contain" loading="eager" fetchPriority="high" imgClassName="w-full h-auto max-h-[320px] sm:max-h-[420px] lg:max-h-[480px] transition-all duration-500" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <button onClick={(e) => { e.stopPropagation(); prev(); }}
          className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/95 p-2.5 shadow-xl hover:bg-white hover:scale-110 active:scale-95 transition-all z-10"
          style={{ color: 'var(--brown)' }}><ChevronLeft className="h-5 w-5" /></button>
        <button onClick={(e) => { e.stopPropagation(); next(); }}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/95 p-2.5 shadow-xl hover:bg-white hover:scale-110 active:scale-95 transition-all z-10"
          style={{ color: 'var(--brown)' }}><ChevronRight className="h-5 w-5" /></button>
        <div className="absolute top-3 right-3 rounded-full bg-white/95 px-3 py-1 text-sm font-bold shadow" style={{ color: 'var(--brown)' }}>
          {current + 1} / {images.length}
        </div>
      </div>
      <div className="mt-4 flex justify-center gap-2">
        {images.map((_, i) => (
          <button key={i} onClick={() => setCurrent(i)} className="h-2 rounded-full transition-all duration-300"
            style={{ width: i === current ? '2rem' : '0.5rem', backgroundColor: i === current ? 'var(--gold)' : 'rgba(44,26,14,0.2)' }} />
        ))}
      </div>
      <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
        {images.map((img, i) => (
          <button key={i} onClick={() => setCurrent(i)} className="flex-shrink-0 overflow-hidden rounded-xl transition-all duration-300"
            style={{ width: i === current ? '7rem' : '5.5rem', height: i === current ? '5rem' : '4rem', outline: i === current ? '2px solid var(--gold)' : 'none', outlineOffset: '2px', opacity: i === current ? 1 : 0.5 }}>
            <OptimizedImage src={img} blurSrc={imageBlurUrls?.[i]} alt={`Thumb ${i + 1}`} fit="cover" loading="lazy" imgClassName="h-full w-full" />
          </button>
        ))}
      </div>
      {lightbox && <Lightbox images={images} imageBlurUrls={imageBlurUrls} current={current} onClose={() => setLightbox(false)} onNext={next} onPrev={prev} />}
    </div>
  );
}

function Lightbox({ images, imageBlurUrls, current, onClose, onNext, onPrev }: {
  images: string[]; imageBlurUrls?: string[]; current: number;
  onClose: () => void; onNext: () => void; onPrev: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4" onClick={onClose}>
      <button className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors z-10" onClick={onClose}>
        <X className="h-6 w-6" />
      </button>
      {images.length > 1 && (
        <>
          <button className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 transition-colors z-10"
            onClick={(e) => { e.stopPropagation(); onPrev(); }}><ChevronLeft className="h-6 w-6" /></button>
          <button className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 transition-colors z-10"
            onClick={(e) => { e.stopPropagation(); onNext(); }}><ChevronRight className="h-6 w-6" /></button>
        </>
      )}
      <div onClick={(e) => e.stopPropagation()} className="max-h-[90vh] max-w-[90vw]">
        <OptimizedImage key={`lb-${current}`} src={images[current]} blurSrc={imageBlurUrls?.[current]} alt="" fit="contain" loading="eager" fetchPriority="high"
          imgClassName="max-h-[90vh] max-w-[90vw] rounded-lg" />
      </div>
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {images.map((_, i) => (
            <div key={i} className={`h-2 w-2 rounded-full transition-colors ${i === current ? 'bg-white' : 'bg-white/40'}`} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Main Page ── */
export default function AchievementDetail() {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<Achievement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) { queueMicrotask(() => { setError(true); setLoading(false); }); return; }
    apiClient
      .get(`/achievements/${id}`)
      .then((res) => setItem(res.data?.data || res.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <SectionPageShell kicker="Achievements" title="Loading…" subtitle="">
        <div className="skeleton h-64 w-full rounded-2xl" />
      </SectionPageShell>
    );
  }

  if (error || !item) {
    return (
      <SectionPageShell kicker="Achievements" title="Not Found" subtitle="This achievement could not be found.">
        <NavLink to="/page/achievements" className="inline-flex items-center gap-2 text-sm font-semibold transition-colors" style={{ color: 'var(--gold)' }}>
          ← Back to Achievements
        </NavLink>
      </SectionPageShell>
    );
  }

  return (
    <SectionPageShell kicker="Achievements" title={item.title} subtitle={`Honors & Recognition Archive · ${item.year}`}>
      <div className="w-full space-y-8">
        {/* Back */}
        <NavLink to="/page/achievements" className="inline-flex items-center gap-2 text-sm font-semibold transition-colors hover:opacity-80" style={{ color: 'var(--gold)' }}>
          ← Back to Achievements
        </NavLink>

        {/* Milestone Recognition Bar */}
        <div
          className="flex items-center gap-5 rounded-3xl p-6"
          style={{ backgroundColor: 'white', border: '1px solid rgba(44,26,14,0.08)', boxShadow: '0 2px 12px rgba(44,26,14,0.04)' }}
        >
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl text-3xl shadow-inner shrink-0"
            style={{
              background: 'linear-gradient(135deg, rgba(200,150,42,0.08) 0%, rgba(232,184,75,0.15) 100%)',
              border: '1px solid rgba(200,150,42,0.25)',
              boxShadow: '0 4px 20px rgba(200,150,42,0.12)',
            }}
          >
            {item.icon || '🏆'}
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--gold)]">
              Conferred in {item.year}
            </p>
            <p className="mt-0.5 text-base sm:text-lg font-bold text-[var(--brown)]">
              Official Milestone Achievement
            </p>
          </div>
        </div>

        {/* Images */}
        {item.images && item.images.length > 0 && (
          <div className="w-full max-w-4xl">
            <ImageCarousel images={item.images} imageBlurUrls={item.imageBlurUrls} />
          </div>
        )}

        {/* Description */}
        <article
          className="rounded-3xl p-8 shadow-sm"
          style={{ backgroundColor: 'white', border: '1px solid rgba(44,26,14,0.08)' }}
        >
          {item.description.split('\n').filter(Boolean).map((para, i) => (
            <p key={i} className="mt-4 text-base leading-relaxed first:mt-0" style={{ color: 'var(--muted)' }}>
              {para}
            </p>
          ))}
        </article>
      </div>
    </SectionPageShell>
  );
}
