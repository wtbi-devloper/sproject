import { NavLink } from 'react-router-dom';
import OptimizedImage from './OptimizedImage';
import { calculateReadingTime } from '../utils/readingTime';
import { Clock } from 'lucide-react';

interface LogEntryProps {
  id?: string;
  date: string;
  title: string;
  body: string;
  tags?: string[];
  images?: string[];
  /** Parallel blur / LQIP URLs (same order as `images`). */
  imageBlurUrls?: string[];
  readMoreLink?: string;
  variant?: 'list' | 'card';
  showReadingTime?: boolean;
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

    // Check for markdown-style headlines (# ## ###)
    const h1Match = line.match(/^#\s+(.+)$/);
    const h2Match = line.match(/^##\s+(.+)$/);
    const h3Match = line.match(/^###\s+(.+)$/);

    if (h1Match) {
      elements.push(
        <h4 key={key++} className="mt-4 mb-2 text-lg font-bold text-[var(--brown)] first:mt-0">
          {h1Match[1]}
        </h4>
      );
    } else if (h2Match) {
      elements.push(
        <h5 key={key++} className="mt-3 mb-2 text-base font-bold text-[var(--brown)] first:mt-0">
          {h2Match[1]}
        </h5>
      );
    } else if (h3Match) {
      elements.push(
        <h6 key={key++} className="mt-3 mb-1.5 text-sm font-bold text-[var(--brown-light)] first:mt-0">
          {h3Match[1]}
        </h6>
      );
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      // Bullet points
      elements.push(
        <li key={key++} className="ml-4 text-sm leading-relaxed text-[var(--muted)] list-disc">
          {line.slice(2)}
        </li>
      );
    } else if (/^\d+\.\s/.test(line)) {
      // Numbered list
      const content = line.replace(/^\d+\.\s/, '');
      elements.push(
        <li key={key++} className="ml-4 text-sm leading-relaxed text-[var(--muted)] list-decimal">
          {content}
        </li>
      );
    } else {
      // Regular paragraph - format with proper punctuation spacing
      const formattedLine = line
        .replace(/\s+/g, ' ') // Normalize whitespace
        .replace(/\s*,\s*/g, ', ') // Proper comma spacing
        .replace(/\s*\.\s*/g, '. ') // Proper period spacing
        .replace(/\s*:\s*/g, ': ') // Proper colon spacing
        .replace(/\s*;\s*/g, '; ') // Proper semicolon spacing
        .replace(/\s*\?\s*/g, '? ') // Proper question mark spacing
        .replace(/\s*!\s*/g, '! ') // Proper exclamation spacing
        .replace(/\s+$/, ''); // Trim trailing space

      elements.push(
        <p key={key++} className="mt-2 text-sm leading-relaxed text-[var(--muted)] first:mt-0">
          {formattedLine}
        </p>
      );
    }
  }

  return elements;
}

export default function LogEntry({
  id,
  date,
  title,
  body,
  tags,
  images,
  imageBlurUrls,
  readMoreLink,
  variant = 'list',
  showReadingTime = false,
}: LogEntryProps) {
  const isLong = body.length > 200;
  const displayBody = isLong ? body.slice(0, 200) + '...' : body;
  
  // Link to detail page if id is provided, otherwise use readMoreLink
  const detailLink = id ? `/page/daily-log/${id}` : readMoreLink;

  const readingTime = calculateReadingTime(body);

  if (variant === 'card') {
    const cardContent = (
      <div className="flex h-full flex-col">
        {images && images.length > 0 ? (
          <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-t-[2rem]">
            <OptimizedImage
              src={images[0]}
              blurSrc={imageBlurUrls?.[0]}
              alt=""
              fit="cover"
              loading="lazy"
              imgClassName="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />

            {/* Reading Time Badge */}
            {showReadingTime && (
              <div className="absolute top-4 right-4 z-10 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white/95 backdrop-blur-md ring-1 ring-white/15 shadow-md">
                <Clock className="h-3 w-3 text-[var(--gold)]" />
                <span>{readingTime}</span>
              </div>
            )}

            {/* Category / Tag Pill */}
            {tags && tags.length > 0 && (
              <div className="absolute top-4 left-4 z-10 inline-flex items-center rounded-full bg-black/60 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[var(--gold-light)] backdrop-blur-md ring-1 ring-white/15 shadow-md">
                #{tags[0]}
              </div>
            )}
          </div>
        ) : (
          <div className="relative aspect-[4/3] w-full shrink-0 rounded-t-[2rem] bg-[var(--cream)] overflow-hidden">
            {showReadingTime && (
              <div className="absolute top-4 right-4 z-10 inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-[var(--brown-light)] shadow-xs ring-1 ring-black/5">
                <Clock className="h-3 w-3 text-[var(--gold)]" />
                <span>{readingTime}</span>
              </div>
            )}
            {tags && tags.length > 0 && (
              <div className="absolute top-4 left-4 z-10 inline-flex items-center rounded-full bg-white/80 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[var(--gold)] shadow-xs ring-1 ring-black/5">
                #{tags[0]}
              </div>
            )}
          </div>
        )}
        
        <div className="flex flex-grow flex-col justify-center p-6 sm:p-8">
          <div className="mb-3 text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] text-[var(--gold)]">
            {date}
          </div>
          <h3 className="font-['Playfair_Display'] text-xl sm:text-2xl font-bold leading-snug text-[var(--brown)] line-clamp-3" title={title}>
            {title}
          </h3>
        </div>
      </div>
    );

    const cardClasses = "group relative block h-[460px] sm:h-[500px] w-[340px] sm:w-[400px] shrink-0 overflow-hidden rounded-[2rem] bg-white/90 shadow-xl shadow-[var(--brown)]/5 backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-[var(--brown)]/10";

    if (detailLink) {
      return (
        <NavLink to={detailLink} className={cardClasses}>
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          {cardContent}
        </NavLink>
      );
    }
    return <article className={cardClasses}>{cardContent}</article>;
  }

  const content = (
    <>
      {/* Gold accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[var(--gold)] to-[var(--gold-light)] rounded-l-2xl opacity-60 group-hover:opacity-100 transition-opacity" />

      <div className="pl-3">
        {/* Single preview image - reasonable size */}
        {images && images.length > 0 && (
          <div className="mx-auto mb-4 w-full max-w-xs overflow-hidden rounded-xl border border-[var(--brown)]/8 sm:float-right sm:ml-4 sm:mb-3 sm:w-48 lg:w-56">
            <OptimizedImage
              src={images[0]}
              blurSrc={imageBlurUrls?.[0]}
              alt=""
              fit="cover"
              loading="lazy"
              sizes="(max-width: 640px) 192px, 224px"
              imgClassName="w-full h-auto max-h-40 transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        )}
        
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
          {date}
        </div>
        <h3 className="mt-2 text-base font-bold text-[var(--brown)] transition-colors group-hover:text-[var(--brown-light)]">{title}</h3>
        
        {/* Formatted body text - truncated */}
        <div className="mt-3 prose-sm">
          {formatBody(displayBody)}
        </div>
        
        {detailLink && (
          <span className="mt-3 inline-block text-xs font-semibold text-[var(--gold)] group-hover:text-[var(--gold-light)] transition-colors">
            View Full Entry →
          </span>
        )}
        
        {tags && tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-[var(--cream)] px-3 py-1 text-xs font-medium text-[var(--brown-light)] transition-colors hover:bg-[var(--gold)]/10 hover:text-[var(--gold)]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        <div className="clear-both" />
      </div>
    </>
  );

  // Make entire card clickable if we have a detail link
  if (detailLink) {
    return (
      <NavLink 
        to={detailLink}
        className="group block rounded-2xl border border-[var(--brown)]/8 bg-white p-6 shadow-sm transition-all duration-300 hover:border-[var(--gold)]/30 hover:shadow-md relative overflow-hidden cursor-pointer"
      >
        {content}
      </NavLink>
    );
  }

  return (
    <article className="group rounded-2xl border border-[var(--brown)]/8 bg-white p-6 shadow-sm transition-all duration-300 hover:border-[var(--gold)]/30 hover:shadow-md relative overflow-hidden">
      {content}
    </article>
  );
}
