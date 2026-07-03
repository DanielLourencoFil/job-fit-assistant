"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const STEPS = [
  {
    title: "1. Paste a posting",
    text: "Any language — German postings are the main use case. The text is sent to the extraction API (rate-limited; demo mode uses a recorded response).",
  },
  {
    title: "2. The LLM extracts — and only extracts",
    text: "Claude turns the messy text into structured data (company, skills, language requirement) validated against a strict schema. Output is English canonical, whatever the posting's language.",
  },
  {
    title: "3. Deterministic fit verdict",
    text: "The verdict is not the LLM's opinion. Pure TypeScript rules in your browser compare the posting against your profile: skills, language level (e.g. C1 required vs your B2), seniority, location. Edit any field and the verdict recomputes instantly.",
  },
  {
    title: "4. Your data stays with you",
    text: "Your profile and saved applications live in your browser (localStorage). Nothing is stored on a server; only skill names travel with a request, as spelling hints.",
  },
];

export function HowItWorksDialog() {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="ghost" />}>
        How it works
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>How it works</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {STEPS.map((step) => (
            <div key={step.title}>
              <p className="text-sm font-medium">{step.title}</p>
              <p className="text-sm text-muted-foreground">{step.text}</p>
            </div>
          ))}
          <p className="border-t pt-3 text-xs text-muted-foreground">
            Built with a disciplined AI-assisted workflow — binding rules,
            machine-enforced gates and tests. See CLAUDE.md in the repository.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
