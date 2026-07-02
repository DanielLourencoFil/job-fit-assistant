import { z } from "zod";
import type { JobPosting } from "./types";

const languageLevelSchema = z.enum([
  "A1",
  "A2",
  "B1",
  "B2",
  "C1",
  "C2",
  "fluent",
  "native",
]);

/**
 * The single LLM boundary (docs/DECISIONS.md #1): nothing the model produces
 * enters the app without passing this schema. Unknown keys are stripped.
 * `satisfies` binds it to the domain type — if they diverge, compilation fails.
 */
export const jobPostingSchema = z.object({
  company: z.string().nullable(),
  role: z.string().min(1),
  seniority: z.string().nullable(),
  mustHaveSkills: z.array(z.string()),
  niceToHave: z.array(z.string()),
  languageRequirement: z
    .object({ language: z.string().min(1), level: languageLevelSchema })
    .nullable(),
  location: z.string().nullable(),
  workMode: z.enum(["remote", "hybrid", "onsite"]).nullable(),
  salary: z.string().nullable(),
}) satisfies z.ZodType<JobPosting>;

export type ParseResult =
  { ok: true; posting: JobPosting } | { ok: false; error: string };

/** Validate an already-parsed value (e.g. SDK output). Never throws. */
export function parseExtraction(raw: unknown): ParseResult {
  const result = jobPostingSchema.safeParse(raw);
  if (result.success) {
    return { ok: true, posting: result.data };
  }
  const issues = result.error.issues
    .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("; ");
  return { ok: false, error: `Extraction failed validation — ${issues}` };
}

/** Validate a raw JSON string (e.g. recorded fixtures). Never throws. */
export function parseExtractionJson(text: string): ParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: "Extraction is not valid JSON" };
  }
  return parseExtraction(raw);
}
