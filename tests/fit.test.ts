import { describe, expect, it } from "vitest";
import { analyzeFit } from "@/lib/fit";
import type { JobPosting, Profile } from "@/lib/types";

// Fixed test profile — deliberately NOT the app seed, so editing the seed never breaks tests.
const testProfile: Profile = {
  skills: ["TypeScript", "React", "Next.js", "Node.js", "PostgreSQL", "Vitest"],
  keySkills: ["TypeScript", "React"],
  languages: { german: "B2", english: "fluent" },
  seniority: "career-changer",
  location: "Nürnberg, Germany",
  region: ["Nürnberg", "Nuremberg", "Fürth", "Erlangen"],
  remoteOk: true,
  relocation: "maybe",
};

const basePosting: JobPosting = {
  company: "Acme",
  role: "Fullstack Developer",
  seniority: null,
  mustHaveSkills: ["TypeScript", "React"],
  niceToHave: [],
  languageRequirement: null,
  location: null,
  workMode: "remote",
  salary: null,
};

function makePosting(overrides: Partial<JobPosting>): JobPosting {
  return { ...basePosting, ...overrides };
}

// Hand-computed anchors: weights 55/20/12/13, bonus ≤10, caps 75 (language) / 78 (senior).
describe("score anchors", () => {
  it("full match on key skills, remote → 100 · apply", () => {
    const fit = analyzeFit(basePosting, testProfile);

    expect(fit.score).toBe(100);
    expect(fit.recommendation).toBe("apply");
    expect(fit.verdict).toBe("good");
    expect(fit.flags.every((flag) => flag.status === "ok")).toBe(true);
  });

  it("half the must-haves missing → 75 · stretch, flag names the skill", () => {
    const fit = analyzeFit(
      makePosting({ mustHaveSkills: ["TypeScript", "Angular"] }),
      testProfile,
    );

    // 55×0.5 + 20 + 12×0.8 + 13 + bonus 10×(1/2) = 75.1
    expect(fit.score).toBe(75);
    expect(fit.recommendation).toBe("stretch");
    expect(fit.flags).toContainEqual({
      label: "Missing must-have skill: Angular",
      status: "warn",
    });
  });

  it("missing skill + C1 gap + relocation stack up → 57 · skip", () => {
    const fit = analyzeFit(
      makePosting({
        mustHaveSkills: ["TypeScript", "Angular"],
        languageRequirement: { language: "german", level: "C1" },
        workMode: "onsite",
        location: "München, Germany",
      }),
      testProfile,
    );

    // 27.5 + 8 + 9.6 + 6.5 + 5 = 56.6
    expect(fit.score).toBe(57);
    expect(fit.recommendation).toBe("skip");
    expect(fit.verdict).toBe("skip");
  });
});

describe("language component and cap", () => {
  it("German C1 vs B2 profile → capped at 75, never apply", () => {
    const fit = analyzeFit(
      makePosting({ languageRequirement: { language: "german", level: "C1" } }),
      testProfile,
    );

    // Raw 95.6 but language-below cap wins.
    expect(fit.score).toBe(75);
    expect(fit.recommendation).toBe("stretch");
    expect(fit.flags).toContainEqual({
      label: "German C1 required — profile is B2",
      status: "warn",
    });
  });

  it("required level met → no cap, apply", () => {
    const fit = analyzeFit(
      makePosting({ languageRequirement: { language: "german", level: "B2" } }),
      testProfile,
    );

    expect(fit.score).toBe(100);
    expect(fit.recommendation).toBe("apply");
  });

  it("language absent from profile → factor 0 and cap", () => {
    const fit = analyzeFit(
      makePosting({ languageRequirement: { language: "french", level: "B1" } }),
      testProfile,
    );

    expect(fit.score).toBe(75);
    expect(fit.flags).toContainEqual({
      label: "French B1 required — not in profile",
      status: "warn",
    });
  });
});

describe("seniority and location components", () => {
  it("senior-only → capped at 78, never apply; junior/mid → apply", () => {
    const senior = analyzeFit(
      makePosting({ seniority: "Senior" }),
      testProfile,
    );
    const junior = analyzeFit(
      makePosting({ seniority: "Junior/Mid" }),
      testProfile,
    );

    expect(senior.score).toBe(78);
    expect(senior.recommendation).toBe("stretch");
    expect(junior.score).toBe(100);
    expect(junior.recommendation).toBe("apply");
  });

  it("relocation warns but does not eliminate — can still be apply", () => {
    const fit = analyzeFit(
      makePosting({ workMode: "onsite", location: "München, Germany" }),
      testProfile,
    );

    // 55 + 20 + 9.6 + 13×0.5 + 10 = 101.1 → 100
    expect(fit.score).toBe(100);
    expect(fit.recommendation).toBe("apply");
    expect(fit.flags).toContainEqual({
      label: "Relocation/commute required (München, Germany)",
      status: "warn",
    });
  });

  it("hybrid within the region scores full location weight", () => {
    const fit = analyzeFit(
      makePosting({ workMode: "hybrid", location: "Fürth, Bayern" }),
      testProfile,
    );

    expect(fit.score).toBe(100);
  });

  it("relocation ruled out → capped at 45, skip, explicit flag", () => {
    const noRelocation = { ...testProfile, relocation: "no" as const };

    const fit = analyzeFit(
      makePosting({ workMode: "onsite", location: "München, Germany" }),
      noRelocation,
    );

    expect(fit.score).toBe(45);
    expect(fit.recommendation).toBe("skip");
    expect(fit.flags).toContainEqual({
      label: "Requires relocation (München, Germany) — profile rules it out",
      status: "warn",
    });
  });

  it("willing to relocate scores out-of-region higher than 'maybe'", () => {
    const willing = { ...testProfile, relocation: "yes" as const };

    const fit = analyzeFit(
      makePosting({ workMode: "onsite", location: "Berlin, Germany" }),
      willing,
    );

    // 55 + 20 + 9.6 + 13×0.8 + 10 = 105 → 100, no cap
    expect(fit.score).toBe(100);
    expect(fit.recommendation).toBe("apply");
  });
});

describe("alignment bonus and matching", () => {
  it("matching is case-insensitive and ignores .js suffix", () => {
    const fit = analyzeFit(
      makePosting({ mustHaveSkills: ["react.js", "NODE", "next"] }),
      testProfile,
    );

    // Full coverage; only react is a key skill → bonus 10/3.
    expect(fit.score).toBe(100);
  });

  it("matched non-key skills earn no alignment bonus", () => {
    const fit = analyzeFit(
      makePosting({ mustHaveSkills: ["PostgreSQL", "Vitest"] }),
      testProfile,
    );

    // 55 + 20 + 9.6 + 13 + bonus 0 = 97.6 → 98 (vs 100 when key skills match)
    expect(fit.score).toBe(98);
  });

  it("posting with no skills listed → neutral factor, no crash", () => {
    const fit = analyzeFit(makePosting({ mustHaveSkills: [] }), testProfile);

    // 55×0.7 + 20 + 9.6 + 13 = 81.1 → 81
    expect(fit.score).toBe(81);
    expect(fit.recommendation).toBe("apply");
  });

  it("salary absent → no salary flag, no error", () => {
    const fit = analyzeFit(makePosting({ salary: null }), testProfile);

    expect(
      fit.flags.some((f) => f.label.toLowerCase().includes("salary")),
    ).toBe(false);
  });
});
