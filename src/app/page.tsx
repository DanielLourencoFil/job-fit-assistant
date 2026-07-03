"use client";

import { useState } from "react";
import { AnalyzePanel } from "@/components/analyze-panel";
import { ApplicationsList } from "@/components/applications-list";
import { HowItWorksDialog } from "@/components/how-it-works";
import { ProfileDialog } from "@/components/profile-dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import { ReviewCard } from "@/components/review-card";
import { useApplications, useProfile } from "@/components/use-store";
import type { FitResult, JobPosting } from "@/lib/types";

interface Draft {
  posting: JobPosting;
  demo: boolean;
}

export default function Home() {
  const { profile, saveProfile } = useProfile();
  const applications = useApplications();
  const [draft, setDraft] = useState<Draft | null>(null);

  const handleSave = (posting: JobPosting, fit: FitResult) => {
    applications.save(posting, fit);
    setDraft(null);
  };

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Job-Fit Assistant</h1>
        <div className="flex items-center gap-1">
          <HowItWorksDialog />
          <ProfileDialog profile={profile} onSave={saveProfile} />
          <ThemeToggle />
        </div>
      </header>
      <div className="grid gap-6 md:grid-cols-2">
        <section className="space-y-4">
          <AnalyzePanel
            profileSkills={profile.skills}
            onExtracted={(posting, demo) => setDraft({ posting, demo })}
            collapsed={draft !== null}
            onExpand={() => setDraft(null)}
          />
          {draft?.demo && (
            <p className="text-sm text-muted-foreground">
              Demo mode — recorded response (no API key configured).
            </p>
          )}
          {draft && (
            <ReviewCard
              key={draft.posting.role + draft.posting.company}
              posting={draft.posting}
              profile={profile}
              onSave={handleSave}
              onDiscard={() => setDraft(null)}
            />
          )}
        </section>
        <section className="space-y-3">
          <h2 className="text-sm font-medium">
            My applications ({applications.applications.length})
          </h2>
          <ApplicationsList
            applications={applications.applications}
            onStatusChange={applications.setStatus}
            onDelete={applications.remove}
          />
        </section>
      </div>
    </main>
  );
}
