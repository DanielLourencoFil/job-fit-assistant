/** Domain contract — single source of truth for all shapes (see docs/SPEC.md). */

/** CEFR level or fluency label, e.g. "B2", "C1", "fluent", "native". */
export type LanguageLevel =
  "A1" | "A2" | "B1" | "B2" | "C1" | "C2" | "fluent" | "native";

export type Relocation = "no" | "maybe" | "yes";

export interface Profile {
  skills: string[];
  /** Subset of skills marked as core strengths (starred) — they weigh more. */
  keySkills: string[];
  /** language name (lowercase english, e.g. "german") → level */
  languages: Record<string, LanguageLevel>;
  seniority: string;
  location: string;
  /** cities/areas that count as commutable for hybrid/onsite roles */
  region: string[];
  remoteOk: boolean;
  /** Willingness to relocate for an out-of-region role. */
  relocation: Relocation;
}

export type WorkMode = "remote" | "hybrid" | "onsite";

/** Structured so the fit engine compares levels on an ordered scale — never parses free text. */
export interface LanguageRequirement {
  /** lowercase English language name, e.g. "german" — regardless of the posting's language */
  language: string;
  level: LanguageLevel;
}

/**
 * Extracted from a job posting by the LLM. Fields the posting doesn't state are null.
 * Extraction contract: output is English canonical (tech names, levels) even for
 * German/other-language postings — locked by a fixture test (docs/SPEC.md).
 */
export interface JobPosting {
  company: string | null;
  role: string;
  seniority: string | null;
  mustHaveSkills: string[];
  niceToHave: string[];
  languageRequirement: LanguageRequirement | null;
  location: string | null;
  workMode: WorkMode | null;
  salary: string | null;
}

export type FlagStatus = "ok" | "warn";

export interface FitFlag {
  label: string;
  status: FlagStatus;
}

export type Verdict = "good" | "stretch" | "skip";

export type Recommendation = "apply" | "stretch" | "skip";

/** Computed deterministically in pure TS — never by the LLM (docs/DECISIONS.md #1). */
export interface FitResult {
  verdict: Verdict;
  flags: FitFlag[];
  /** 0–100 weighted score. Optional: snapshots saved before scoring existed lack it. */
  score?: number;
  recommendation?: Recommendation;
}

export type ApplicationStatus =
  "saved" | "applied" | "waiting" | "interview" | "offer" | "rejected";

export type ApplicationChannel =
  "portal" | "email" | "easy_apply" | "referral" | "other";

/** One step in the application's real-world timeline. */
export interface StatusEvent {
  status: ApplicationStatus;
  /** ISO timestamp */
  at: string;
  note?: string;
  /** How the application was sent — meaningful on "applied" events. */
  channel?: ApplicationChannel;
}

/** The person reached directly for this posting (the differentiator move). */
export interface Contact {
  name: string;
  /** e.g. "LinkedIn InMail", "email" */
  via: string;
}

export interface SavedApplication {
  id: string;
  posting: JobPosting;
  fit: FitResult;
  status: ApplicationStatus;
  /** ISO timestamp — string so the whole object is JSON/localStorage-safe */
  createdAt: string;
  /** Append-only status history; first entry is the initial "saved". */
  history: StatusEvent[];
  /** Source URL of the posting. */
  url?: string;
  contact?: Contact;
}
