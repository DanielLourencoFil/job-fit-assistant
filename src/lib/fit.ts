import type {
  FitFlag,
  FitResult,
  JobPosting,
  LanguageLevel,
  Profile,
  Recommendation,
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

/** Score weights and bands — the whole scoring policy lives here (docs/SPEC.md). */
const WEIGHTS = { skills: 55, language: 20, seniority: 12, location: 13 };
const ALIGNMENT_BONUS_MAX = 10;
const NICE_TO_HAVE_WEIGHT = 0.3;
const NO_SKILLS_LISTED_FACTOR = 0.7;
const NEUTRAL_FACTOR = 0.8;
/** Language below requirement can never be "apply" — lived reality of C1 gates. */
const LANGUAGE_BELOW_CAP = 75;
const SENIOR_ONLY_CAP = 78;
/** A role requiring relocation the user ruled out is effectively untakeable. */
const RELOCATION_REFUSED_CAP = 45;
const RELOCATION_FACTOR = { yes: 0.8, maybe: 0.5, no: 0 } as const;
export const APPLY_MIN = 80;
export const STRETCH_MIN = 60;

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

/** Coverage weighted by posting importance + alignment bonus for starred matches. */
function skillsComponent(
  posting: JobPosting,
  profile: Profile,
): { factor: number; bonus: number } {
  const owned = new Set(profile.skills.map(normalizeSkill));
  const key = new Set(profile.keySkills.map(normalizeSkill));
  const must = posting.mustHaveSkills;
  const nice = posting.niceToHave;
  const totalWeight = must.length + nice.length * NICE_TO_HAVE_WEIGHT;
  if (totalWeight === 0) return { factor: NO_SKILLS_LISTED_FACTOR, bonus: 0 };

  const matchedMust = must.filter((s) => owned.has(normalizeSkill(s)));
  const matchedNice = nice.filter((s) => owned.has(normalizeSkill(s)));
  const factor =
    (matchedMust.length + matchedNice.length * NICE_TO_HAVE_WEIGHT) /
    totalWeight;
  const keyMatched = matchedMust.filter((s) => key.has(normalizeSkill(s)));
  const bonus =
    must.length === 0
      ? 0
      : ALIGNMENT_BONUS_MAX * (keyMatched.length / must.length);
  return { factor, bonus };
}

/** Graded satisfaction of one language item: met = 1, one level short = 0.4, worse = 0. */
function levelFactor(
  owned: LanguageLevel | undefined,
  required: LanguageLevel,
): number {
  if (owned === undefined) return 0;
  const deficit = LEVEL_RANK[required] - LEVEL_RANK[owned];
  if (deficit <= 0) return 1;
  return deficit === 1 ? 0.4 : 0;
}

/**
 * Evaluates the connective (docs/DECISIONS.md #14): "all" aggregates with min
 * (weakest conjunct gates), "any" with max (best alternative wins) — the Gödel
 * t-norm/t-conorm over graded satisfaction.
 */
function languageComponent(
  posting: JobPosting,
  profile: Profile,
): { factor: number; below: boolean } {
  const req = posting.languageRequirement;
  if (!req || req.items.length === 0) return { factor: 1, below: false };
  const factors = req.items.map((item) =>
    levelFactor(profile.languages[item.language.toLowerCase()], item.level),
  );
  const factor =
    req.mode === "any" ? Math.max(...factors) : Math.min(...factors);
  return { factor, below: factor < 1 };
}

function seniorityComponent(posting: JobPosting): {
  factor: number;
  seniorOnly: boolean;
} {
  const seniority = posting.seniority;
  if (!seniority) return { factor: NEUTRAL_FACTOR, seniorOnly: false };
  if (ENTRY_PATTERN.test(seniority)) return { factor: 1, seniorOnly: false };
  if (SENIOR_PATTERN.test(seniority)) return { factor: 0.4, seniorOnly: true };
  return { factor: NEUTRAL_FACTOR, seniorOnly: false };
}

function locationComponent(
  posting: JobPosting,
  profile: Profile,
): { factor: number; refusedRelocation: boolean } {
  if (posting.workMode === "remote") {
    return { factor: profile.remoteOk ? 1 : 0.4, refusedRelocation: false };
  }
  if (!posting.location) {
    return { factor: NEUTRAL_FACTOR, refusedRelocation: false };
  }
  const location = posting.location.toLowerCase();
  const inRegion = profile.region.some((city) =>
    location.includes(city.toLowerCase()),
  );
  if (inRegion) return { factor: 1, refusedRelocation: false };
  return {
    factor: RELOCATION_FACTOR[profile.relocation],
    refusedRelocation: profile.relocation === "no",
  };
}

/** One flag per conjunct ("all") or a single combined flag ("any"). */
function languageFlags(posting: JobPosting, profile: Profile): FitFlag[] {
  const req = posting.languageRequirement;
  if (!req || req.items.length === 0) return [];
  if (req.mode === "all")
    return req.items.map((i) => singleLanguageFlag(i, profile));

  const label = req.items
    .map((i) => `${capitalize(i.language)} ${i.level}`)
    .join(" or ");
  const met = req.items.find(
    (i) =>
      levelFactor(profile.languages[i.language.toLowerCase()], i.level) === 1,
  );
  if (met) {
    const owned = profile.languages[met.language.toLowerCase()];
    return [
      {
        label: `${label} required — profile has ${capitalize(met.language)} (${owned})`,
        status: "ok",
      },
    ];
  }
  return [{ label: `${label} required — no alternative met`, status: "warn" }];
}

function singleLanguageFlag(
  item: { language: string; level: LanguageLevel },
  profile: Profile,
): FitFlag {
  const name = capitalize(item.language);
  const owned = profile.languages[item.language.toLowerCase()];
  if (owned === undefined) {
    return {
      label: `${name} ${item.level} required — not in profile`,
      status: "warn",
    };
  }
  if (LEVEL_RANK[owned] >= LEVEL_RANK[item.level]) {
    return {
      label: `${name} ${item.level} required — profile has ${owned}`,
      status: "ok",
    };
  }
  return {
    label: `${name} ${item.level} required — profile is ${owned}`,
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
  const { factor, refusedRelocation } = locationComponent(posting, profile);
  if (factor === 1) {
    return { label: `Within region (${posting.location})`, status: "ok" };
  }
  return {
    label: refusedRelocation
      ? `Requires relocation (${posting.location}) — profile rules it out`
      : `Relocation/commute required (${posting.location})`,
    status: "warn",
  };
}

function computeScore(posting: JobPosting, profile: Profile): number {
  const skills = skillsComponent(posting, profile);
  const language = languageComponent(posting, profile);
  const seniority = seniorityComponent(posting);
  const location = locationComponent(posting, profile);

  let score =
    WEIGHTS.skills * skills.factor +
    WEIGHTS.language * language.factor +
    WEIGHTS.seniority * seniority.factor +
    WEIGHTS.location * location.factor +
    skills.bonus;
  if (language.below) score = Math.min(score, LANGUAGE_BELOW_CAP);
  if (seniority.seniorOnly) score = Math.min(score, SENIOR_ONLY_CAP);
  if (location.refusedRelocation)
    score = Math.min(score, RELOCATION_REFUSED_CAP);
  return Math.round(Math.min(100, Math.max(0, score)));
}

function recommendationFrom(score: number): Recommendation {
  if (score >= APPLY_MIN) return "apply";
  if (score >= STRETCH_MIN) return "stretch";
  return "skip";
}

const VERDICT_BY_RECOMMENDATION: Record<Recommendation, Verdict> = {
  apply: "good",
  stretch: "stretch",
  skip: "skip",
};

/** Pure and deterministic — the LLM never judges fit (docs/DECISIONS.md #1). */
export function analyzeFit(posting: JobPosting, profile: Profile): FitResult {
  const singleFlags = [
    seniorityFlag(posting),
    locationFlag(posting, profile),
  ].filter((flag): flag is FitFlag => flag !== null);
  const flags = [
    ...skillFlags(posting, profile),
    ...languageFlags(posting, profile),
    ...singleFlags,
  ];
  const score = computeScore(posting, profile);
  const recommendation = recommendationFrom(score);
  return {
    verdict: VERDICT_BY_RECOMMENDATION[recommendation],
    flags,
    score,
    recommendation,
  };
}
