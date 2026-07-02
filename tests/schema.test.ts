import { describe, expect, it } from "vitest";
import { parseExtraction, parseExtractionJson } from "@/lib/schema";
import validPosting from "./fixtures/valid-posting.json";
import germanPosting from "@/lib/fixtures/german-posting.json";

describe("parseExtraction — LLM boundary contract", () => {
  it("accepts a valid extraction and returns a typed posting", () => {
    const result = parseExtraction(validPosting);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.posting.company).toBe("Ingentis");
    expect(result.posting.role).toBe("Frontend Developer");
    expect(result.posting.mustHaveSkills).toEqual([
      "Vue",
      "TypeScript",
      "Clean Code",
    ]);
    expect(result.posting.languageRequirement).toEqual({
      language: "english",
      level: "fluent",
    });
    expect(result.posting.workMode).toBe("hybrid");
  });

  it("strips hallucinated fields the schema does not know", () => {
    const withHallucinations = {
      ...validPosting,
      applyUrl: "https://example.com/apply",
      recruiterMood: "optimistic",
    };

    const result = parseExtraction(withHallucinations);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.posting).not.toHaveProperty("applyUrl");
    expect(result.posting).not.toHaveProperty("recruiterMood");
  });

  it("German posting extracts to English canonical vocabulary (recorded fixture)", () => {
    const result = parseExtraction(germanPosting);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // Skills must be canonical English tech names, not "Datenbanken"/"agiles Arbeiten".
    expect(result.posting.mustHaveSkills).toContain("SQL");
    expect(result.posting.mustHaveSkills).toContain("Scrum");
    expect(result.posting.mustHaveSkills).not.toContain("Datenbanken");
    // Language requirement is structured and lowercase-English, not "Deutsch C1".
    expect(result.posting.languageRequirement).toEqual({
      language: "german",
      level: "C1",
    });
  });
});

describe("parseExtraction — rejections at the boundary", () => {
  it("rejects a partial extraction (missing required role) without throwing", () => {
    const partial: Record<string, unknown> = { ...validPosting };
    delete partial.role;

    const result = parseExtraction(partial);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain("role");
  });

  it("rejects an invalid language level instead of letting it into the app", () => {
    const badLevel = {
      ...validPosting,
      languageRequirement: { language: "german", level: "B2+" },
    };

    const result = parseExtraction(badLevel);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain("languageRequirement.level");
  });
});

describe("parseExtractionJson — raw text boundary", () => {
  it("rejects malformed JSON with a handled error, never a throw", () => {
    const result = parseExtractionJson('{"role": "Dev", "company": ');

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe("Extraction is not valid JSON");
  });

  it("parses a valid JSON string end to end", () => {
    const result = parseExtractionJson(JSON.stringify(germanPosting));

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.posting.company).toBe("zollsoft GmbH");
  });
});
