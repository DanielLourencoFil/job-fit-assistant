import type {
  FitFlag,
  FitResult,
  JobPosting,
  LanguageLevel,
  Profile,
  Verdict,
} from "./types";

const LEVEL_RANK: Record<LanguageLevel, number> = {
  A1: 1,
  A2: 2,
  B1: 3,
  B2: 4,
  C1: 5,
  C2: 6,
  fluent: 6,
  native: 7,
};

const SENIOR_PATTERN = /senior|lead|principal|staff/i;
const ENTRY_PATTERN =
  /junior|entry|mid|quereinstieg|career.?changer|berufseinsteiger/i;

/** Tolerant, deterministic skill equality: case-insensitive, ".js" suffix ignored (docs/DECISIONS.md #6). */
function normalizeSkill(skill: string): string {
  return skill.toLowerCase().trim().replace(/\.js$/, "");
}

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function skillFlags(posting: JobPosting, profile: Profile): FitFlag[] {
  const owned = new Set(profile.skills.map(normalizeSkill));
  return posting.mustHaveSkills.map((skill) => {
    const has = owned.has(normalizeSkill(skill));
    return {
      label: has ? `Skill: ${skill}` : `Missing must-have skill: ${skill}`,
      status: has ? "ok" : "warn",
    } satisfies FitFlag;
  });
}

function languageFlag(posting: JobPosting, profile: Profile): FitFlag | null {
  const req = posting.languageRequirement;
  if (!req) return null;
  const name = capitalize(req.language);
  const owned = profile.languages[req.language.toLowerCase()];
  if (owned === undefined) {
    return {
      label: `${name} ${req.level} required — not in profile`,
      status: "warn",
    };
  }
  if (LEVEL_RANK[owned] >= LEVEL_RANK[req.level]) {
    return {
      label: `${name} ${req.level} required — profile has ${owned}`,
      status: "ok",
    };
  }
  return {
    label: `${name} ${req.level} required — profile is ${owned}`,
    status: "warn",
  };
}

function seniorityFlag(posting: JobPosting): FitFlag | null {
  const seniority = posting.seniority;
  if (!seniority) return null;
  if (ENTRY_PATTERN.test(seniority)) {
    return { label: `Seniority: ${seniority}`, status: "ok" };
  }
  if (SENIOR_PATTERN.test(seniority)) {
    return {
      label: `Senior-level role (${seniority}) — stretch for a career-changer`,
      status: "warn",
    };
  }
  return null;
}

function locationFlag(posting: JobPosting, profile: Profile): FitFlag | null {
  if (posting.workMode === "remote") {
    return profile.remoteOk
      ? { label: "Remote — compatible", status: "ok" }
      : { label: "Remote-only — profile prefers on-site", status: "warn" };
  }
  if (!posting.location) return null;
  const location = posting.location.toLowerCase();
  const inRegion = profile.region.some((city) =>
    location.includes(city.toLowerCase()),
  );
  return inRegion
    ? { label: `Within region (${posting.location})`, status: "ok" }
    : {
        label: `Relocation/commute required (${posting.location})`,
        status: "warn",
      };
}

function verdictFrom(flags: FitFlag[]): Verdict {
  const warns = flags.filter((flag) => flag.status === "warn").length;
  if (warns === 0) return "good";
  if (warns <= 2) return "stretch";
  return "skip";
}

/** Pure and deterministic — the LLM never judges fit (docs/DECISIONS.md #1). */
export function analyzeFit(posting: JobPosting, profile: Profile): FitResult {
  const singleFlags = [
    languageFlag(posting, profile),
    seniorityFlag(posting),
    locationFlag(posting, profile),
  ].filter((flag): flag is FitFlag => flag !== null);
  const flags = [...skillFlags(posting, profile), ...singleFlags];
  return { verdict: verdictFrom(flags), flags };
}
