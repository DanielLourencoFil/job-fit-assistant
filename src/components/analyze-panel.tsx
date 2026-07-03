"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EXAMPLE_POSTING } from "@/lib/example-posting";
import type { JobPosting } from "@/lib/types";

interface AnalyzePanelProps {
  profileSkills: string[];
  onExtracted: (posting: JobPosting, demo: boolean) => void;
  /** When a result is being reviewed, the input collapses to a thin bar. */
  collapsed: boolean;
  onExpand: () => void;
}

// Mirrors what the pipeline actually does (extraction contract → fit engine).
const LOADER_STAGES = [
  "Reading the posting…",
  "Extracting requirements and skills…",
  "Normalizing to canonical vocabulary…",
  "Comparing against your profile…",
];

export function AnalyzePanel({
  profileSkills,
  onExtracted,
  collapsed,
  onExpand,
}: AnalyzePanelProps) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function analyze() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/extract", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text, profileSkills }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? "Something went wrong");
        return;
      }
      onExtracted(payload.posting, payload.demo);
    } catch {
      setError("Network error — is the server running?");
    } finally {
      setLoading(false);
    }
  }

  if (collapsed) {
    return <CollapsedBar characters={text.length} onExpand={onExpand} />;
  }

  return (
    <div className="space-y-3">
      <Textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Paste a job posting here (any language)…"
        className="h-48 resize-none overflow-y-auto"
      />
      <div className="flex gap-2">
        <Button onClick={analyze} disabled={loading || text.trim().length < 30}>
          {loading ? "Analyzing…" : "Analyze"}
        </Button>
        <Button
          variant="outline"
          disabled={loading}
          onClick={() => setText(EXAMPLE_POSTING)}
        >
          Load example
        </Button>
      </div>
      {loading && <NarratedLoader />}
      {error && <ErrorNote message={error} />}
    </div>
  );
}

function ErrorNote({ message }: { message: string }) {
  return (
    <p className="rounded-md border border-red-300 bg-red-50 p-2 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
      {message}
    </p>
  );
}

function CollapsedBar({
  characters,
  onExpand,
}: {
  characters: number;
  onExpand: () => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
      <span>Posting loaded · {characters.toLocaleString()} characters</span>
      <Button variant="ghost" size="sm" onClick={onExpand}>
        Edit posting
      </Button>
    </div>
  );
}

function NarratedLoader() {
  const [stage, setStage] = useState(0);
  useEffect(() => {
    const id = setInterval(
      () =>
        setStage((current) => Math.min(current + 1, LOADER_STAGES.length - 1)),
      1400,
    );
    return () => clearInterval(id);
  }, []);
  return (
    <div className="flex items-center gap-3 rounded-md border p-3 text-sm text-muted-foreground">
      <span className="size-4 shrink-0 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <span aria-live="polite">{LOADER_STAGES[stage]}</span>
    </div>
  );
}
