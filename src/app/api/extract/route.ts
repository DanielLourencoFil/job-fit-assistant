import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { z } from "zod";
import demoFixture from "@/lib/fixtures/german-posting.json";
import { createRateLimiter } from "@/lib/rate-limit";
import { jobPostingSchema, parseExtraction } from "@/lib/schema";

const requestSchema = z.object({
  text: z.string().min(30, "Posting text is too short to analyze"),
  profileSkills: z.array(z.string()).max(100).default([]),
});

const limiter = createRateLimiter(5, 60 * 60 * 1000);

function clientKey(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous"
  );
}

function jsonError(message: string, status: number): Response {
  return Response.json({ error: message }, { status });
}

function buildPrompt(text: string, profileSkills: string[]): string {
  const hints =
    profileSkills.length > 0
      ? `If a mentioned skill is equivalent to one of these, use this exact spelling: ${profileSkills.join(", ")}.`
      : "";
  return [
    "Extract structured data from the job posting below.",
    "Output ENGLISH CANONICAL values regardless of the posting's language:",
    '- skills as canonical tech names (e.g. "PostgreSQL", never "Datenbanken");',
    hints,
    '- languageRequirement: items with lowercase English names (e.g. "german") and a level; use the STATED level verbatim ("fluent"/"verhandlungssicher" = "fluent" — never downgrade it);',
    '- languages demanded together (and/und) → mode "all"; offered as alternatives (or/oder) → mode "any"; a single language → mode "all" with one item;',
    "- mustHaveSkills = explicitly required; niceToHave = optional extras;",
    "- anything the posting does not state → null.",
    "",
    "Posting:",
    '"""',
    text,
    '"""',
  ]
    .filter(Boolean)
    .join("\n");
}

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Request body must be JSON", 400);
  }
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid request", 400);
  }
  if (!limiter.check(clientKey(request))) {
    return jsonError(
      "Rate limit reached — 5 analyses per hour. Try later.",
      429,
    );
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return demoResponse();
  }
  try {
    const { object } = await generateObject({
      model: anthropic("claude-haiku-4-5"),
      schema: jobPostingSchema,
      prompt: buildPrompt(parsed.data.text, parsed.data.profileSkills),
    });
    return Response.json({ posting: object, demo: false });
  } catch {
    return jsonError(
      "Extraction failed — the model did not produce a valid posting.",
      502,
    );
  }
}

/** Demo mode: recorded extraction so the public deploy works without a key. */
function demoResponse(): Response {
  const demo = parseExtraction(demoFixture);
  if (!demo.ok) {
    return jsonError("Demo fixture is invalid", 500);
  }
  return Response.json({ posting: demo.posting, demo: true });
}
