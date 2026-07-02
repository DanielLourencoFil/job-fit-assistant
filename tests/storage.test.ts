import { describe, expect, it } from "vitest";
import { profile as seedProfile } from "@/lib/profile";
import {
  createApplication,
  deleteApplication,
  loadApplications,
  loadProfile,
  saveApplication,
  saveProfile,
  updateApplicationStatus,
  type StorageLike,
} from "@/lib/storage";
import type { FitResult, JobPosting } from "@/lib/types";
import validPosting from "./fixtures/valid-posting.json";

function makeStub(initial: Record<string, string> = {}): StorageLike {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
  };
}

const posting = validPosting as JobPosting;
const fit: FitResult = { verdict: "good", flags: [] };

describe("applications persistence", () => {
  it("saved application comes back from the same storage", () => {
    const stub = makeStub();
    const application = createApplication(posting, fit);

    saveApplication(application, stub);
    const loaded = loadApplications(stub);

    expect(loaded).toHaveLength(1);
    expect(loaded[0].id).toBe(application.id);
    expect(loaded[0].posting.company).toBe("Ingentis");
    expect(loaded[0].status).toBe("saved");
  });

  it("status update persists across reads", () => {
    const stub = makeStub();
    const application = createApplication(posting, fit);
    saveApplication(application, stub);

    updateApplicationStatus(application.id, "applied", stub);

    expect(loadApplications(stub)[0].status).toBe("applied");
  });

  it("delete removes only the targeted application", () => {
    const stub = makeStub();
    const keep = createApplication(posting, fit);
    const drop = createApplication(posting, fit);
    saveApplication(keep, stub);
    saveApplication(drop, stub);

    deleteApplication(drop.id, stub);
    const loaded = loadApplications(stub);

    expect(loaded).toHaveLength(1);
    expect(loaded[0].id).toBe(keep.id);
  });

  it("corrupted stored JSON → empty list, no crash", () => {
    const stub = makeStub({ "jfa.applications": "{not json[" });

    expect(loadApplications(stub)).toEqual([]);
  });
});

describe("profile persistence", () => {
  it("no stored profile → seed default", () => {
    expect(loadProfile(makeStub())).toEqual(seedProfile);
  });

  it("saved profile roundtrips with edits intact", () => {
    const stub = makeStub();
    const edited = { ...seedProfile, skills: ["Svelte", "Go"] };

    saveProfile(edited, stub);
    const loaded = loadProfile(stub);

    expect(loaded.skills).toEqual(["Svelte", "Go"]);
    expect(loaded.languages).toEqual(seedProfile.languages);
  });

  it("corrupted stored profile → seed default, no crash", () => {
    const stub = makeStub({ "jfa.profile": '["broken"' });

    expect(loadProfile(stub)).toEqual(seedProfile);
  });

  it("createApplication produces unique ids and ISO timestamps", () => {
    const first = createApplication(posting, fit);
    const second = createApplication(posting, fit);

    expect(first.id).not.toBe(second.id);
    expect(new Date(first.createdAt).toISOString()).toBe(first.createdAt);
  });
});
