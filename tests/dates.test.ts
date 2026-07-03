import { describe, expect, it } from "vitest";
import { daysSince, relativeDays } from "@/lib/dates";

const T0 = new Date("2026-07-01T12:00:00Z").getTime();
const iso = (offsetMs: number) => new Date(T0 - offsetMs).toISOString();
const HOUR = 3_600_000;

describe("daysSince — injectable clock, whole-day boundaries", () => {
  it("same moment → 0; 23h ago → 0; 25h ago → 1", () => {
    const now = () => T0;

    expect(daysSince(iso(0), now)).toBe(0);
    expect(daysSince(iso(23 * HOUR), now)).toBe(0);
    expect(daysSince(iso(25 * HOUR), now)).toBe(1);
  });

  it("future timestamp clamps to 0, never negative", () => {
    expect(daysSince(iso(-5 * HOUR), () => T0)).toBe(0);
  });
});

describe("relativeDays", () => {
  it("formats today / singular / plural", () => {
    const now = () => T0;

    expect(relativeDays(iso(0), now)).toBe("today");
    expect(relativeDays(iso(30 * HOUR), now)).toBe("1 day ago");
    expect(relativeDays(iso(6 * 24 * HOUR), now)).toBe("6 days ago");
  });
});
