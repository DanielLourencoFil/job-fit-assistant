"use client";

import { ExternalLinkIcon } from "lucide-react";
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
    <div className="space-y-4 rounded-md border bg-muted/20 p-3">
      <Section title="Source & contact">
        <DetailsFields application={application} handlers={handlers} />
      </Section>
      <Section title="Timeline">
        <Timeline application={application} handlers={handlers} />
      </Section>
      <Section title="Analysis at save time">
        <p className="text-xs text-muted-foreground">
          {metaLine(application.posting)}
        </p>
        <FlagList fit={application.fit} />
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2 border-t pt-3 first:border-t-0 first:pt-0">
      <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h4>
      {children}
    </section>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`space-y-1 ${className ?? ""}`}>
      <span className="text-xs text-muted-foreground">{label}</span>
      {children}
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
  const { url, contact } = application;
  return (
    <div className="grid grid-cols-2 gap-2">
      <Field label="Posting URL" className="col-span-2">
        <div className="flex items-center gap-1">
          <Input
            className="h-8 text-xs"
            defaultValue={url ?? ""}
            placeholder="https://…"
            onBlur={(event) =>
              handlers.onUpdateDetails({ url: event.target.value || undefined })
            }
          />
          {url?.startsWith("http") && (
            <Button
              variant="ghost"
              size="icon"
              className="size-8 shrink-0"
              aria-label="Open posting"
              onClick={() => window.open(url, "_blank", "noopener")}
            >
              <ExternalLinkIcon className="size-3.5" />
            </Button>
          )}
        </div>
      </Field>
      <Field label="Contact">
        <Input
          className="h-8 text-xs"
          defaultValue={contact?.name ?? ""}
          placeholder="Name…"
          onBlur={(event) =>
            handlers.onUpdateDetails({
              contact: { name: event.target.value, via: contact?.via ?? "" },
            })
          }
        />
      </Field>
      <Field label="Via">
        <Input
          className="h-8 text-xs"
          defaultValue={contact?.via ?? ""}
          placeholder="e.g. LinkedIn InMail…"
          onBlur={(event) =>
            handlers.onUpdateDetails({
              contact: { name: contact?.name ?? "", via: event.target.value },
            })
          }
        />
      </Field>
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
  const lastIndex = application.history.length - 1;
  return (
    <ol className="ml-1 space-y-4 border-l border-border pl-4">
      {application.history.map((event, index) => (
        <TimelineEvent
          key={`${event.at}-${index}`}
          event={event}
          current={index === lastIndex}
          onPatch={(patch) => handlers.onUpdateEvent(index, patch)}
        />
      ))}
    </ol>
  );
}

function TimelineEvent({
  event,
  current,
  onPatch,
}: {
  event: StatusEvent;
  current: boolean;
  onPatch: (patch: Partial<Pick<StatusEvent, "note" | "channel">>) => void;
}) {
  const date = new Date(event.at).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const dot = current
    ? "bg-primary ring-2 ring-primary/25"
    : "border border-border bg-background";
  return (
    <li className="relative">
      <span
        className={`absolute -left-[21px] top-1 size-2 rounded-full ${dot}`}
      />
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-sm font-medium capitalize">{event.status}</span>
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
      <SelectTrigger className="ml-auto h-6 w-32 text-xs">
        <SelectValue placeholder="via channel…" />
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
      <div className="mt-1 flex items-baseline gap-2">
        {value && (
          <p className="rounded-sm bg-muted/60 px-2 py-1 text-xs text-muted-foreground">
            {value}
          </p>
        )}
        <button
          type="button"
          className="text-xs text-muted-foreground underline-offset-2 hover:text-primary hover:underline"
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
    <div className="mt-1 flex items-center gap-2">
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
  const req = posting.languageRequirement;
  const language = req
    ? req.items
        .map((item) => `${item.language} ${item.level}`)
        .join(req.mode === "any" ? " or " : " & ")
    : null;
  return [posting.location, posting.workMode, language, posting.salary]
    .filter(Boolean)
    .join(" · ");
}
