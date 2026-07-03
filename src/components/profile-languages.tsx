"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { LanguageLevel, Profile } from "@/lib/types";

const LEVELS: LanguageLevel[] = [
  "A1",
  "A2",
  "B1",
  "B2",
  "C1",
  "C2",
  "fluent",
  "native",
];
/** Level a freshly added language starts at — the user adjusts it right after. */
const NEW_LANGUAGE_LEVEL: LanguageLevel = "B1";

interface LanguagesSectionProps {
  draft: Profile;
  setDraft: React.Dispatch<React.SetStateAction<Profile>>;
}

/** Free-form language editor: the profile keeps an open map, so any language a
 * posting can require is expressible (docs/DECISIONS.md #13). */
export function LanguagesSection({ draft, setDraft }: LanguagesSectionProps) {
  const [custom, setCustom] = useState("");
  const setLevel = (language: string, level: string) =>
    setDraft((prev) => {
      const languages = { ...prev.languages };
      if (level === "none") delete languages[language];
      else languages[language] = level as LanguageLevel;
      return { ...prev, languages };
    });
  const addLanguage = () => {
    // Lowercase to match the extraction contract (postings emit lowercase names).
    const language = custom.trim().toLowerCase();
    if (language && draft.languages[language] === undefined) {
      setLevel(language, NEW_LANGUAGE_LEVEL);
    }
    setCustom("");
  };
  const languages = Object.keys(draft.languages).sort();
  return (
    <section className="space-y-2">
      <Label>Languages</Label>
      <p className="text-xs text-muted-foreground">
        Add the languages you speak and set your level. A posting requiring a
        language not in your list is scored as not met.
      </p>
      {languages.length === 0 && (
        <p className="text-xs text-muted-foreground">No languages added yet.</p>
      )}
      {languages.map((language) => (
        <LanguageRow
          key={language}
          language={language}
          level={draft.languages[language] ?? "none"}
          onLevelChange={(level) => setLevel(language, level)}
        />
      ))}
      <div className="flex gap-2">
        <Input
          value={custom}
          placeholder="Add a language…"
          onChange={(event) => setCustom(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && addLanguage()}
        />
        <Button type="button" variant="outline" onClick={addLanguage}>
          Add
        </Button>
      </div>
    </section>
  );
}

function LanguageRow({
  language,
  level,
  onLevelChange,
}: {
  language: string;
  level: string;
  onLevelChange: (level: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-sm capitalize">{language}</span>
      <Select
        value={level}
        onValueChange={(next) => onLevelChange(next ?? "none")}
      >
        <SelectTrigger className="h-8 w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {LEVELS.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
          <SelectItem value="none">remove</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
