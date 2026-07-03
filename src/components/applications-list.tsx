"use client";

import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { useState } from "react";
import { FlagList } from "@/components/flag-list";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VerdictBadge } from "@/components/verdict-badge";
import type {
  ApplicationStatus,
  JobPosting,
  SavedApplication,
} from "@/lib/types";

const STATUSES: ApplicationStatus[] = [
  "saved",
  "applied",
  "waiting",
  "interview",
  "offer",
  "rejected",
];

interface ApplicationsListProps {
  applications: SavedApplication[];
  onStatusChange: (id: string, status: ApplicationStatus) => void;
  onDelete: (id: string) => void;
}

export function ApplicationsList({
  applications,
  onStatusChange,
  onDelete,
}: ApplicationsListProps) {
  if (applications.length === 0) {
    return (
      <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
        No saved applications yet — paste a posting on the left.
      </p>
    );
  }
  return (
    <ul className="space-y-3">
      {applications.map((application) => (
        <ApplicationRow
          key={application.id}
          application={application}
          onStatusChange={onStatusChange}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}

function ApplicationRow({
  application,
  onStatusChange,
  onDelete,
}: {
  application: SavedApplication;
  onStatusChange: (id: string, status: ApplicationStatus) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <li className="space-y-2 rounded-md border p-3">
      <RowHeader
        application={application}
        expanded={expanded}
        onToggle={() => setExpanded((current) => !current)}
      />
      {expanded && <SavedAnalysis application={application} />}
      <div className="flex items-center justify-between gap-2">
        <Select
          value={application.status}
          onValueChange={(status) =>
            onStatusChange(application.id, status as ApplicationStatus)
          }
        >
          <SelectTrigger className="h-8 w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={() => onDelete(application.id)}
        >
          Delete
        </Button>
      </div>
    </li>
  );
}

function RowHeader({
  application,
  expanded,
  onToggle,
}: {
  application: SavedApplication;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { posting } = application;
  return (
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">
          {posting.company ?? "Unknown company"}
        </p>
        <p className="truncate text-sm text-muted-foreground">{posting.role}</p>
      </div>
      <div className="flex items-center gap-1">
        <VerdictBadge verdict={application.fit.verdict} />
        <Button
          variant="ghost"
          size="icon"
          aria-label={expanded ? "Hide analysis" : "Show analysis"}
          onClick={onToggle}
        >
          {expanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
        </Button>
      </div>
    </div>
  );
}

/** Read-only snapshot of the analysis as it was at save time (DECISIONS #11). */
function SavedAnalysis({ application }: { application: SavedApplication }) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        {metaLine(application.posting)}
      </p>
      <FlagList fit={application.fit} />
    </div>
  );
}

function metaLine(posting: JobPosting): string {
  const language = posting.languageRequirement
    ? `${posting.languageRequirement.language} ${posting.languageRequirement.level}`
    : null;
  return [posting.location, posting.workMode, language, posting.salary]
    .filter(Boolean)
    .join(" · ");
}
