/**
 * Calculate estimated reading time based on an average reading speed of 200 words per minute.
 */
export function calculateReadingTime(text?: string | null): string {
  if (!text || !text.trim()) return '1 min read';
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}
