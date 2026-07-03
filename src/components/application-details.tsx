"use client";

import { useState } from "react";
import { FlagList } from "@/components/flag-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  ApplicationChannel,
  JobPosting,
  SavedApplication,
  StatusEvent,
} from "@/lib/types";

const CHANNELS: ApplicationChannel[] = [
  "portal",
  "email",
  "easy_apply",
  "referral",
  "other",
];

export interface DetailsHandlers {
  onUpdateEvent: (
    eventIndex: number,
    patch: Partial<Pick<StatusEvent, "note" | "channel">>,
  ) => void;
  onUpdateDetails: (
    patch: Partial<Pick<SavedApplication, "url" | "contact">>,
  ) => void;
}

/** Expanded card: source/contact fields, timeline with notes, analysis snapshot. */
export function ApplicationDetails({
  application,
  handlers,
}: {
  application: SavedApplication;
  handlers: DetailsHandlers;
}) {
  return (
    <div className="space-y-3 border-t pt-3">
      <DetailsFields application={application} handlers={handlers} />
      <Timeline application={application} handlers={handlers} />
      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground">
          Analysis at save time
        </p>
        <p className="text-xs text-muted-foreground">
          {metaLine(application.posting)}
        </p>
        <FlagList fit={application.fit} />
      </div>
    </div>
  );
}

function DetailsFields({
  application,
  handlers,
}: {
  application: SavedApplication;
  handlers: DetailsHandlers;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <Input
        className="col-span-2 h-8"
        defaultValue={application.url ?? ""}
        placeholder="Posting URL…"
        onBlur={(event) =>
          handlers.onUpdateDetails({ url: event.target.value || undefined })
        }
      />
      <Input
        className="h-8"
        defaultValue={application.contact?.name ?? ""}
        placeholder="Contact name…"
        onBlur={(event) =>
          handlers.onUpdateDetails({
            contact: {
              name: event.target.value,
              via: application.contact?.via ?? "",
            },
          })
        }
      />
      <Input
        className="h-8"
        defaultValue={application.contact?.via ?? ""}
        placeholder="Via (e.g. LinkedIn InMail)…"
        onBlur={(event) =>
          handlers.onUpdateDetails({
            contact: {
              name: application.contact?.name ?? "",
              via: event.target.value,
            },
          })
        }
      />
    </div>
  );
}

function Timeline({
  application,
  handlers,
}: {
  application: SavedApplication;
  handlers: DetailsHandlers;
}) {
  return (
    <ol className="space-y-2">
      {application.history.map((event, index) => (
        <TimelineEvent
          key={`${event.at}-${index}`}
          event={event}
          onPatch={(patch) => handlers.onUpdateEvent(index, patch)}
        />
      ))}
    </ol>
  );
}

function TimelineEvent({
  event,
  onPatch,
}: {
  event: StatusEvent;
  onPatch: (patch: Partial<Pick<StatusEvent, "note" | "channel">>) => void;
}) {
  const date = new Date(event.at).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
  return (
    <li className="space-y-1 text-sm">
      <div className="flex items-center gap-2">
        <span className="size-1.5 shrink-0 rounded-full bg-primary" />
        <span className="font-medium">{event.status}</span>
        <span className="text-xs text-muted-foreground">{date}</span>
        {event.status === "applied" && (
          <ChannelSelect
            value={event.channel}
            onChange={(channel) => onPatch({ channel })}
          />
        )}
      </div>
      <NoteEditor value={event.note} onSave={(note) => onPatch({ note })} />
    </li>
  );
}

function ChannelSelect({
  value,
  onChange,
}: {
  value: ApplicationChannel | undefined;
  onChange: (channel: ApplicationChannel) => void;
}) {
  return (
    <Select
      value={value}
      onValueChange={(channel) =>
        channel && onChange(channel as ApplicationChannel)
      }
    >
      <SelectTrigger className="h-6 w-32 text-xs">
        <SelectValue placeholder="channel?" />
      </SelectTrigger>
      <SelectContent>
        {CHANNELS.map((channel) => (
          <SelectItem key={channel} value={channel}>
            {channel.replace("_", " ")}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function NoteEditor({
  value,
  onSave,
}: {
  value: string | undefined;
  onSave: (note: string) => void;
}) {
  // null = display mode; string = the draft being edited.
  const [draft, setDraft] = useState<string | null>(null);

  if (draft === null) {
    return (
      <div className="ml-3.5 flex items-start gap-2">
        {value && <p className="text-xs text-muted-foreground">{value}</p>}
        <button
          type="button"
          className="text-xs text-primary underline-offset-2 hover:underline"
          onClick={() => setDraft(value ?? "")}
        >
          {value ? "edit" : "+ note"}
        </button>
      </div>
    );
  }

  const commit = () => {
    onSave(draft);
    setDraft(null);
  };
  return (
    <div className="ml-3.5 flex items-center gap-2">
      <Input
        autoFocus
        className="h-7 text-xs"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => event.key === "Enter" && commit()}
      />
      <Button size="sm" variant="outline" className="h-7" onClick={commit}>
        Save
      </Button>
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
