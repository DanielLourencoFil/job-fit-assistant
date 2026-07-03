/** Pure pagination — slices a list into a page and clamps the requested page
 * into range, so callers never render an out-of-bounds (empty) page after the
 * list shrinks. See docs/DECISIONS.md #12. */
export interface Page<T> {
  items: T[];
  /** Requested page clamped into [1, totalPages]. */
  page: number;
  totalPages: number;
  total: number;
}

export function paginate<T>(items: T[], page: number, size: number): Page<T> {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / size));
  const current = Math.min(Math.max(1, Math.floor(page)), totalPages);
  const start = (current - 1) * size;
  return {
    items: items.slice(start, start + size),
    page: current,
    totalPages,
    total,
  };
}
