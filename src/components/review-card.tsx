"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FlagList } from "@/components/flag-list";
import { VerdictBadge } from "@/components/verdict-badge";
import { analyzeFit } from "@/lib/fit";
import type { FitResult, JobPosting, Profile } from "@/lib/types";

interface ReviewCardProps {
  posting: JobPosting;
  profile: Profile;
  onSave: (posting: JobPosting, fit: FitResult) => void;
  onDiscard: () => void;
}

type TextField = "company" | "role" | "seniority" | "location" | "salary";

const TEXT_FIELDS: Array<{ field: TextField; label: string }> = [
  { field: "company", label: "Company" },
  { field: "role", label: "Role" },
  { field: "seniority", label: "Seniority" },
  { field: "location", label: "Location" },
  { field: "salary", label: "Salary" },
];

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function ReviewCard({
  posting,
  profile,
  onSave,
  onDiscard,
}: ReviewCardProps) {
  const [draft, setDraft] = useState<JobPosting>(posting);
  // Human review in action: every edit re-runs the deterministic fit engine.
  const fit = useMemo(() => analyzeFit(draft, profile), [draft, profile]);

  const setField = (field: TextField, value: string) =>
    setDraft((prev) => ({ ...prev, [field]: value === "" ? null : value }));

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-base">Review extraction</CardTitle>
        <VerdictBadge verdict={fit.verdict} />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          {TEXT_FIELDS.map(({ field, label }) => (
            <div key={field} className="space-y-1">
              <Label htmlFor={field}>{label}</Label>
              <Input
                id={field}
                value={draft[field] ?? ""}
                placeholder="—"
                onChange={(event) => setField(field, event.target.value)}
              />
            </div>
          ))}
        </div>
        <SkillsInput
          label="Must-have skills (comma-separated)"
          value={draft.mustHaveSkills}
          onChange={(skills) =>
            setDraft((prev) => ({ ...prev, mustHaveSkills: skills }))
          }
        />
        <SkillsInput
          label="Nice to have (comma-separated)"
          value={draft.niceToHave}
          onChange={(skills) =>
            setDraft((prev) => ({ ...prev, niceToHave: skills }))
          }
        />
        <FlagList fit={fit} />
      </CardContent>
      <CardFooter className="gap-2">
        <Button onClick={() => onSave(draft, fit)}>Save</Button>
        <Button variant="outline" onClick={onDiscard}>
          Discard
        </Button>
      </CardFooter>
    </Card>
  );
}

function SkillsInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string[];
  onChange: (skills: string[]) => void;
}) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Input
        value={value.join(", ")}
        placeholder="—"
        onChange={(event) => onChange(splitList(event.target.value))}
      />
    </div>
  );
}
