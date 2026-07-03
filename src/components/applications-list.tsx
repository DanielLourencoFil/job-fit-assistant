"use client";

import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  ApplicationDetails,
  type DetailsHandlers,
} from "@/components/application-details";
import { Button } from "@/components/ui/button";
import { paginate } from "@/lib/paginate";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VerdictBadge } from "@/components/verdict-badge";
import { relativeDays } from "@/lib/dates";
import type { ApplicationStatus, SavedApplication } from "@/lib/types";

const STATUSES: ApplicationStatus[] = [
  "saved",
  "applied",
  "waiting",
  "interview",
  "offer",
  "rejected",
];

const PAGE_SIZE = 5;

/** Newest analysis first — createdAt, not last activity, so cards don't jump
 * when a status changes (docs/DECISIONS.md #12). */
function byNewest(a: SavedApplication, b: SavedApplication): number {
  return b.createdAt.localeCompare(a.createdAt);
}

interface ApplicationsListProps {
  applications: SavedApplication[];
  onStatusChange: (id: string, status: ApplicationStatus) => void;
  onDelete: (id: string) => void;
  handlersFor: (id: string) => DetailsHandlers;
}

export function ApplicationsList({
  applications,
  onStatusChange,
  onDelete,
  handlersFor,
}: ApplicationsListProps) {
  const [requestedPage, setRequestedPage] = useState(1);
  const sorted = useMemo(
    () => [...applications].sort(byNewest),
    [applications],
  );
  const { items, page, totalPages } = paginate(
    sorted,
    requestedPage,
    PAGE_SIZE,
  );

  if (applications.length === 0) {
    return (
      <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
        No saved applications yet — paste a posting on the left.
      </p>
    );
  }
  return (
    <div className="space-y-3">
      <ul className="space-y-3">
        {items.map((application) => (
          <ApplicationRow
            key={application.id}
            application={application}
            onStatusChange={onStatusChange}
            onDelete={onDelete}
            handlers={handlersFor(application.id)}
          />
        ))}
      </ul>
      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={setRequestedPage}
      />
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeftIcon /> Prev
      </Button>
      <span className="text-xs text-muted-foreground">
        Page {page} of {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Next <ChevronRightIcon />
      </Button>
    </div>
  );
}

function ApplicationRow({
  application,
  onStatusChange,
  onDelete,
  handlers,
}: {
  application: SavedApplication;
  onStatusChange: (id: string, status: ApplicationStatus) => void;
  onDelete: (id: string) => void;
  handlers: DetailsHandlers;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <li className="space-y-2 rounded-md border p-3">
      <RowHeader
        application={application}
        expanded={expanded}
        onToggle={() => setExpanded((current) => !current)}
      />
      {expanded && (
        <ApplicationDetails application={application} handlers={handlers} />
      )}
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
        <p className="text-xs text-muted-foreground">
          {application.status} · {relativeDays(lastActivityAt(application))}
        </p>
      </div>
      <div className="flex items-center gap-1">
        <VerdictBadge fit={application.fit} />
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

function lastActivityAt(application: SavedApplication): string {
  return application.history.at(-1)?.at ?? application.createdAt;
}
