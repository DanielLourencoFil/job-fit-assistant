import { describe, expect, it } from "vitest";
import { paginate } from "@/lib/paginate";

const nums = (n: number) => Array.from({ length: n }, (_, i) => i + 1);

describe("paginate — slicing", () => {
  it("returns the first page of 5 and the correct tail on page 2", () => {
    const items = nums(12);

    expect(paginate(items, 1, 5).items).toEqual([1, 2, 3, 4, 5]);
    expect(paginate(items, 2, 5).items).toEqual([6, 7, 8, 9, 10]);
    const last = paginate(items, 3, 5);
    expect(last.items).toEqual([11, 12]); // partial last page
    expect(last.totalPages).toBe(3);
  });

  it("exactly one full page is a single page (boundary)", () => {
    const page = paginate(nums(5), 1, 5);

    expect(page.items).toEqual([1, 2, 3, 4, 5]);
    expect(page.totalPages).toBe(1);
  });

  it("fewer items than the page size fit on one page", () => {
    expect(paginate(nums(3), 1, 5).totalPages).toBe(1);
  });
});

describe("paginate — clamping keeps the page in range", () => {
  it("empty list yields page 1 of 1 with no items", () => {
    const page = paginate([], 1, 5);

    expect(page).toEqual({ items: [], page: 1, totalPages: 1, total: 0 });
  });

  it("page above the last is clamped to the last page", () => {
    const page = paginate(nums(12), 99, 5);

    expect(page.page).toBe(3);
    expect(page.items).toEqual([11, 12]);
  });

  it("page below 1 (0 or negative) is clamped to 1", () => {
    expect(paginate(nums(12), 0, 5).page).toBe(1);
    expect(paginate(nums(12), -4, 5).page).toBe(1);
  });
});
