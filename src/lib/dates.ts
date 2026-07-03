type Clock = () => number;

const DAY_MS = 86_400_000;

/** Whole days elapsed since the ISO timestamp (never negative). */
export function daysSince(iso: string, now: Clock = Date.now): number {
  return Math.max(0, Math.floor((now() - new Date(iso).getTime()) / DAY_MS));
}

export function relativeDays(iso: string, now: Clock = Date.now): string {
  const days = daysSince(iso, now);
  if (days === 0) return "today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}
