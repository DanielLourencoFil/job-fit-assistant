"use client";

import { useState } from "react";
import { AnalyzePanel } from "@/components/analyze-panel";
import { ReviewCard } from "@/components/review-card";
import { useApplications, useProfile } from "@/components/use-store";
import type { FitResult, JobPosting } from "@/lib/types";

interface Draft {
  posting: JobPosting;
  demo: boolean;
}

export default function Home() {
  const { profile } = useProfile();
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
      </header>
      <div className="grid gap-6 md:grid-cols-2">
        <section className="space-y-4">
          <AnalyzePanel
            profileSkills={profile.skills}
            onExtracted={(posting, demo) => setDraft({ posting, demo })}
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
        <section className="text-sm text-muted-foreground">
          {applications.applications.length === 0
            ? "No saved applications yet — paste a posting on the left."
            : `${applications.applications.length} saved — list arrives in step 7.`}
        </section>
      </div>
    </main>
  );
}
