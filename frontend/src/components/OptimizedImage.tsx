import { useState } from 'react';
import { resolveBlurPlaceholder } from '../utils/imageBlur';

type OptimizedImageProps = {
  src: string;
  /** Optional; if omitted, derived from `src` when it is an optimized main.webp URL. */
  blurSrc?: string | null;
  alt?: string;
  className?: string;
  /** Classes for the main image (layout, max-height, etc.). */
  imgClassName?: string;
  fit?: 'cover' | 'contain';
  loading?: 'lazy' | 'eager';
  fetchPriority?: 'high' | 'low' | 'auto';
  sizes?: string;
};

/**
 * Blur-up / LQIP: shows tiny WebP placeholder immediately, fades in full image when loaded.
 * Falls back to a normal <img> when no blur URL is available.
 */
export default function OptimizedImage({
  src,
  blurSrc,
  alt = '',
  className = '',
  imgClassName = '',
  fit = 'cover',
  loading = 'lazy',
  fetchPriority,
  sizes,
}: OptimizedImageProps) {
  const [loaded, setLoaded] = useState(false);
  const effectiveBlur = resolveBlurPlaceholder(src, blurSrc);
  const fitClass = fit === 'cover' ? 'object-cover' : 'object-contain';

  const commonImgProps = {
    decoding: 'async' as const,
    sizes,
    ...(fetchPriority ? { fetchPriority } : {}),
  };

  if (!effectiveBlur) {
    return (
      <img
        src={src}
        alt={alt}
        className={`block ${imgClassName} ${fitClass}`.trim()}
        loading={loading}
        {...commonImgProps}
      />
    );
  }

  return (
    <div className={`relative w-full overflow-hidden ${className}`.trim()}>
      <img
        src={effectiveBlur}
        alt=""
        aria-hidden
        className={`pointer-events-none absolute inset-0 z-0 h-full w-full ${fitClass} ${
          fit === 'cover' ? 'scale-110' : ''
        }`}
        loading={loading}
        {...commonImgProps}
      />
      <img
        src={src}
        alt={alt}
        className={`relative z-[1] block w-full ${fitClass} transition-opacity duration-500 ease-out motion-reduce:transition-none ${
          loaded ? 'opacity-100' : 'opacity-0'
        } ${imgClassName}`.trim()}
        loading={loading}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
        {...commonImgProps}
      />
    </div>
  );
}
