import { describe, expect, it } from "vitest";
import { analyzeFit } from "@/lib/fit";
import type { JobPosting, Profile } from "@/lib/types";

// Fixed test profile — deliberately NOT the app seed, so editing the seed never breaks tests.
const testProfile: Profile = {
  skills: ["TypeScript", "React", "Next.js", "Node.js", "PostgreSQL", "Vitest"],
  languages: { german: "B2", english: "fluent" },
  seniority: "career-changer",
  location: "Nürnberg, Germany",
  region: ["Nürnberg", "Nuremberg", "Fürth", "Erlangen"],
  remoteOk: true,
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

describe("analyzeFit — skills", () => {
  it("all must-haves matched, remote → good with only ok flags", () => {
    const fit = analyzeFit(basePosting, testProfile);

    expect(fit.verdict).toBe("good");
    expect(fit.flags.every((flag) => flag.status === "ok")).toBe(true);
  });

  it("missing must-have skill → warn naming the skill", () => {
    const fit = analyzeFit(
      makePosting({ mustHaveSkills: ["TypeScript", "Angular"] }),
      testProfile,
    );

    expect(fit.verdict).toBe("stretch");
    expect(fit.flags).toContainEqual({
      label: "Missing must-have skill: Angular",
      status: "warn",
    });
  });

  it("matching is case-insensitive and ignores .js suffix", () => {
    const fit = analyzeFit(
      makePosting({ mustHaveSkills: ["react.js", "NODE", "next"] }),
      testProfile,
    );

    expect(fit.verdict).toBe("good");
  });
});

describe("analyzeFit — language & seniority", () => {
  it("German C1 required vs B2 profile → warn", () => {
    const fit = analyzeFit(
      makePosting({ languageRequirement: { language: "german", level: "C1" } }),
      testProfile,
    );

    expect(fit.verdict).toBe("stretch");
    expect(fit.flags).toContainEqual({
      label: "German C1 required — profile is B2",
      status: "warn",
    });
  });

  it("required level equal to profile level → ok", () => {
    const fit = analyzeFit(
      makePosting({ languageRequirement: { language: "german", level: "B2" } }),
      testProfile,
    );

    expect(fit.verdict).toBe("good");
    expect(fit.flags).toContainEqual({
      label: "German B2 required — profile has B2",
      status: "ok",
    });
  });

  it("language absent from profile → warn", () => {
    const fit = analyzeFit(
      makePosting({ languageRequirement: { language: "french", level: "B1" } }),
      testProfile,
    );

    expect(fit.flags).toContainEqual({
      label: "French B1 required — not in profile",
      status: "warn",
    });
  });

  it("senior-only posting → warn; junior/mid posting → ok", () => {
    const senior = analyzeFit(
      makePosting({ seniority: "Senior" }),
      testProfile,
    );
    const junior = analyzeFit(
      makePosting({ seniority: "Junior/Mid" }),
      testProfile,
    );

    expect(senior.verdict).toBe("stretch");
    expect(
      senior.flags.some(
        (f) => f.status === "warn" && f.label.includes("Senior"),
      ),
    ).toBe(true);
    expect(junior.verdict).toBe("good");
  });
});

describe("analyzeFit — location", () => {
  it("onsite outside the region → relocation warn, not eliminatory", () => {
    const fit = analyzeFit(
      makePosting({ workMode: "onsite", location: "München, Germany" }),
      testProfile,
    );

    expect(fit.verdict).toBe("stretch");
    expect(fit.flags).toContainEqual({
      label: "Relocation/commute required (München, Germany)",
      status: "warn",
    });
  });

  it("hybrid within the region → ok", () => {
    const fit = analyzeFit(
      makePosting({ workMode: "hybrid", location: "Fürth, Bayern" }),
      testProfile,
    );

    expect(fit.verdict).toBe("good");
  });
});

describe("analyzeFit — verdict boundaries", () => {
  it("exactly 2 warns → stretch", () => {
    const fit = analyzeFit(
      makePosting({
        mustHaveSkills: ["TypeScript", "Angular"],
        languageRequirement: { language: "german", level: "C1" },
      }),
      testProfile,
    );

    expect(fit.flags.filter((f) => f.status === "warn")).toHaveLength(2);
    expect(fit.verdict).toBe("stretch");
  });

  it("exactly 3 warns → skip", () => {
    const fit = analyzeFit(
      makePosting({
        mustHaveSkills: ["TypeScript", "Angular"],
        languageRequirement: { language: "german", level: "C1" },
        workMode: "onsite",
        location: "München, Germany",
      }),
      testProfile,
    );

    expect(fit.flags.filter((f) => f.status === "warn")).toHaveLength(3);
    expect(fit.verdict).toBe("skip");
  });

  it("salary absent → no salary flag, no error", () => {
    const fit = analyzeFit(makePosting({ salary: null }), testProfile);

    expect(
      fit.flags.some((f) => f.label.toLowerCase().includes("salary")),
    ).toBe(false);
  });
});
