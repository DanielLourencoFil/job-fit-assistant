import { describe, expect, it } from "vitest";
import { createRateLimiter } from "@/lib/rate-limit";

describe("createRateLimiter — sliding window", () => {
  it("allows up to the limit and blocks the next request", () => {
    const limiter = createRateLimiter(5, 60_000, () => 1_000);

    const results = Array.from({ length: 6 }, () => limiter.check("ip-1"));

    expect(results).toEqual([true, true, true, true, true, false]);
  });

  it("keys are independent — one client cannot exhaust another's quota", () => {
    const limiter = createRateLimiter(1, 60_000, () => 1_000);

    expect(limiter.check("ip-1")).toBe(true);
    expect(limiter.check("ip-2")).toBe(true);
    expect(limiter.check("ip-1")).toBe(false);
  });

  it("requests outside the window free the quota again", () => {
    let currentTime = 0;
    const limiter = createRateLimiter(2, 1_000, () => currentTime);

    expect(limiter.check("ip-1")).toBe(true);
    expect(limiter.check("ip-1")).toBe(true);
    expect(limiter.check("ip-1")).toBe(false);

    currentTime = 1_500; // both hits are now older than the 1s window
    expect(limiter.check("ip-1")).toBe(true);
  });
});
