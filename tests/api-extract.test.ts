import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/extract/route";

// The model boundary is faked (non-determinism isolated); it only fires when a
// key is present, so demo-mode tests below never reach it.
vi.mock("ai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("ai")>();
  return {
    ...actual,
    generateObject: vi.fn(async () => {
      throw new Error("model unavailable");
    }),
  };
});

// Long enough to pass the request schema's minimum length.
const postingText =
  "Fullstack Developer (m/w/d) — TypeScript, React, Node.js. Remote in Germany.";

function makeRequest(body: unknown, ip: string): Request {
  return new Request("http://localhost/api/extract", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("POST /api/extract", () => {
  it("demo mode (no API key): returns the recorded posting with demo flag", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");

    const response = await POST(makeRequest({ text: postingText }, "ip-demo"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.demo).toBe(true);
    expect(payload.posting.company).toBe("zollsoft GmbH");
    expect(payload.posting.languageRequirement).toEqual({
      mode: "all",
      items: [{ language: "german", level: "C1" }],
    });
  });

  it("invalid body (text too short) → 400 with an error message", async () => {
    const response = await POST(makeRequest({ text: "short" }, "ip-invalid"));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toContain("too short");
  });

  it("non-JSON body → 400, never a crash", async () => {
    const request = new Request("http://localhost/api/extract", {
      method: "POST",
      headers: { "x-forwarded-for": "ip-broken" },
      body: "not json at all",
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it("model failure with a live key → handled 502 error shape", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");

    const response = await POST(makeRequest({ text: postingText }, "ip-fail"));
    const payload = await response.json();

    expect(response.status).toBe(502);
    expect(payload.error).toContain("Extraction failed");
  });

  it("6th request within the hour from the same IP → 429", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    const requests = Array.from({ length: 6 }, () =>
      POST(makeRequest({ text: postingText }, "ip-limited")),
    );

    const statuses = (await Promise.all(requests)).map((r) => r.status);

    expect(statuses.slice(0, 5)).toEqual([200, 200, 200, 200, 200]);
    expect(statuses[5]).toBe(429);
  });
});
