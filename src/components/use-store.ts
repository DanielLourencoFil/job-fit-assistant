"use client";

import { useSyncExternalStore } from "react";
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
} from "@/lib/storage";
import type {
  ApplicationStatus,
  FitResult,
  JobPosting,
  Profile,
  SavedApplication,
  StatusEvent,
} from "@/lib/types";

/**
 * localStorage as a proper external store (useSyncExternalStore): the server
 * snapshot is the seed/empty, the client snapshot lazy-loads storage — no
 * hydration mismatch and no setState-in-effect.
 */
const EMPTY_APPLICATIONS: SavedApplication[] = [];
let profileCache: Profile | null = null;
let applicationsCache: SavedApplication[] | null = null;
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emit(): void {
  listeners.forEach((listener) => listener());
}

function profileSnapshot(): Profile {
  profileCache ??= loadProfile();
  return profileCache;
}

function applicationsSnapshot(): SavedApplication[] {
  applicationsCache ??= loadApplications();
  return applicationsCache;
}

export function useProfile() {
  const profile = useSyncExternalStore(
    subscribe,
    profileSnapshot,
    () => seedProfile,
  );
  const save = (next: Profile) => {
    saveProfile(next);
    profileCache = next;
    emit();
  };
  return { profile, saveProfile: save };
}

export function useApplications() {
  const applications = useSyncExternalStore(
    subscribe,
    applicationsSnapshot,
    () => EMPTY_APPLICATIONS,
  );
  const save = (posting: JobPosting, fit: FitResult) => {
    applicationsCache = saveApplication(createApplication(posting, fit));
    emit();
  };
  const setStatus = (id: string, status: ApplicationStatus) => {
    applicationsCache = updateApplicationStatus(id, status);
    emit();
  };
  const updateEvent = (
    id: string,
    eventIndex: number,
    patch: Partial<Pick<StatusEvent, "note" | "channel">>,
  ) => {
    applicationsCache = updateApplicationEvent(id, eventIndex, patch);
    emit();
  };
  const updateDetails = (
    id: string,
    patch: Partial<Pick<SavedApplication, "url" | "contact">>,
  ) => {
    applicationsCache = updateApplicationDetails(id, patch);
    emit();
  };
  const remove = (id: string) => {
    applicationsCache = deleteApplication(id);
    emit();
  };
  return { applications, save, setStatus, updateEvent, updateDetails, remove };
}
