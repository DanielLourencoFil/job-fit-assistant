import { profile as defaultProfile } from "./profile";
import type {
  ApplicationStatus,
  FitResult,
  JobPosting,
  Profile,
  SavedApplication,
} from "./types";

const APPLICATIONS_KEY = "jfa.applications";
const PROFILE_KEY = "jfa.profile";

/** Injectable backend — tests pass an in-memory stub; the app uses localStorage. */
export type StorageLike = Pick<Storage, "getItem" | "setItem">;

function browserStorage(): StorageLike | null {
  // Guard: this module is imported by server code paths during SSR.
  return typeof window === "undefined" ? null : window.localStorage;
}

function readJson(key: string, storage: StorageLike | null): unknown {
  if (!storage) return null;
  const raw = storage.getItem(key);
  if (raw === null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    // Corrupted data is treated as absent — never crashes the app.
    return null;
  }
}

export function loadApplications(
  storage: StorageLike | null = browserStorage(),
): SavedApplication[] {
  const data = readJson(APPLICATIONS_KEY, storage);
  return Array.isArray(data) ? (data as SavedApplication[]) : [];
}

function persistApplications(
  applications: SavedApplication[],
  storage: StorageLike | null,
): SavedApplication[] {
  storage?.setItem(APPLICATIONS_KEY, JSON.stringify(applications));
  return applications;
}

/** Pure factory — id + timestamp; persistence is a separate concern. */
export function createApplication(
  posting: JobPosting,
  fit: FitResult,
): SavedApplication {
  return {
    id: crypto.randomUUID(),
    posting,
    fit,
    status: "saved",
    createdAt: new Date().toISOString(),
  };
}

export function saveApplication(
  application: SavedApplication,
  storage: StorageLike | null = browserStorage(),
): SavedApplication[] {
  const applications = [application, ...loadApplications(storage)];
  return persistApplications(applications, storage);
}

export function updateApplicationStatus(
  id: string,
  status: ApplicationStatus,
  storage: StorageLike | null = browserStorage(),
): SavedApplication[] {
  const applications = loadApplications(storage).map((application) =>
    application.id === id ? { ...application, status } : application,
  );
  return persistApplications(applications, storage);
}

export function deleteApplication(
  id: string,
  storage: StorageLike | null = browserStorage(),
): SavedApplication[] {
  const applications = loadApplications(storage).filter(
    (application) => application.id !== id,
  );
  return persistApplications(applications, storage);
}

export function loadProfile(
  storage: StorageLike | null = browserStorage(),
): Profile {
  const data = readJson(PROFILE_KEY, storage);
  if (data === null || typeof data !== "object" || Array.isArray(data)) {
    return defaultProfile;
  }
  // Merge over the seed so a profile saved by an older version stays complete.
  return { ...defaultProfile, ...(data as Partial<Profile>) };
}

export function saveProfile(
  profile: Profile,
  storage: StorageLike | null = browserStorage(),
): void {
  storage?.setItem(PROFILE_KEY, JSON.stringify(profile));
}
