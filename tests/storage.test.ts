import { describe, expect, it } from "vitest";
import { profile as seedProfile } from "@/lib/profile";
import {
  createApplication,
  deleteApplication,
  loadApplications,
  loadProfile,
  saveApplication,
  saveProfile,
  updateApplicationDetails,
  updateApplicationEvent,
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

describe("timeline history", () => {
  it("a new application starts with a single 'saved' event at createdAt", () => {
    const application = createApplication(posting, fit);

    expect(application.history).toEqual([
      { status: "saved", at: application.createdAt },
    ]);
  });

  it("status change appends a timestamped event", () => {
    const stub = makeStub();
    const application = createApplication(posting, fit);
    saveApplication(application, stub);

    const [updated] = updateApplicationStatus(application.id, "applied", stub);

    expect(updated.history).toHaveLength(2);
    expect(updated.history[1].status).toBe("applied");
    expect(new Date(updated.history[1].at).toISOString()).toBe(
      updated.history[1].at,
    );
  });
});

describe("timeline notes, details & migration", () => {
  it("event note and channel edits persist", () => {
    const stub = makeStub();
    const application = createApplication(posting, fit);
    saveApplication(application, stub);
    updateApplicationStatus(application.id, "applied", stub);

    updateApplicationEvent(
      application.id,
      1,
      { note: "Sent tailored CV", channel: "email" },
      stub,
    );
    const [loaded] = loadApplications(stub);

    expect(loaded.history[1].note).toBe("Sent tailored CV");
    expect(loaded.history[1].channel).toBe("email");
    expect(loaded.history[0].note).toBeUndefined();
  });

  it("url and contact persist via details update", () => {
    const stub = makeStub();
    const application = createApplication(posting, fit);
    saveApplication(application, stub);

    updateApplicationDetails(
      application.id,
      {
        url: "https://example.com/job",
        contact: { name: "Florian", via: "LinkedIn InMail" },
      },
      stub,
    );
    const [loaded] = loadApplications(stub);

    expect(loaded.url).toBe("https://example.com/job");
    expect(loaded.contact).toEqual({ name: "Florian", via: "LinkedIn InMail" });
  });
});

describe("legacy snapshot migration", () => {
  it("legacy single-object language snapshots migrate to a one-item 'all'", () => {
    const legacyPosting = {
      ...posting,
      languageRequirement: { language: "german", level: "C1" },
    };
    const legacy = {
      id: "old-lang",
      posting: legacyPosting,
      fit,
      status: "saved",
      createdAt: "2026-06-01T10:00:00.000Z",
    };
    const stub = makeStub({ "jfa.applications": JSON.stringify([legacy]) });

    const [migrated] = loadApplications(stub);

    expect(migrated.posting.languageRequirement).toEqual({
      mode: "all",
      items: [{ language: "german", level: "C1" }],
    });
  });

  it("legacy records without history migrate to a derived event", () => {
    const legacy = {
      id: "old-1",
      posting,
      fit,
      status: "applied",
      createdAt: "2026-06-01T10:00:00.000Z",
    };
    const stub = makeStub({ "jfa.applications": JSON.stringify([legacy]) });

    const [migrated] = loadApplications(stub);

    expect(migrated.history).toEqual([
      { status: "applied", at: "2026-06-01T10:00:00.000Z" },
    ]);
  });
});
