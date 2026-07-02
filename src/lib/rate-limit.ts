type Clock = () => number;

export interface RateLimiter {
  /** Returns true when the request is allowed and records it. */
  check(key: string): boolean;
}

/**
 * In-memory sliding window. Best-effort on serverless — cold starts reset it
 * (docs/DECISIONS.md #8); demo mode is the default path, so this only guards
 * the opt-in live API key against bursts.
 */
export function createRateLimiter(
  limit: number,
  windowMs: number,
  now: Clock = Date.now,
): RateLimiter {
  const hits = new Map<string, number[]>();
  return {
    check(key: string): boolean {
      const cutoff = now() - windowMs;
      const recent = (hits.get(key) ?? []).filter((stamp) => stamp > cutoff);
      if (recent.length >= limit) {
        hits.set(key, recent);
        return false;
      }
      recent.push(now());
      hits.set(key, recent);
      return true;
    },
  };
}
