"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EXAMPLE_POSTING } from "@/lib/example-posting";
import type { JobPosting } from "@/lib/types";

interface AnalyzePanelProps {
  profileSkills: string[];
  onExtracted: (posting: JobPosting, demo: boolean) => void;
}

export function AnalyzePanel({
  profileSkills,
  onExtracted,
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

  return (
    <div className="space-y-3">
      <Textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Paste a job posting here (any language)…"
        className="min-h-48"
      />
      <div className="flex gap-2">
        <Button onClick={analyze} disabled={loading || text.trim().length < 30}>
          {loading ? "Analyzing…" : "Analyze"}
        </Button>
        <Button variant="outline" onClick={() => setText(EXAMPLE_POSTING)}>
          Load example
        </Button>
      </div>
      {error && (
        <p className="rounded-md border border-red-300 bg-red-50 p-2 text-sm text-red-800">
          {error}
        </p>
      )}
    </div>
  );
}
