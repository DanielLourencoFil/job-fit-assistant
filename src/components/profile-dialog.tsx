"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SKILL_CATALOG } from "@/lib/skill-catalog";
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
// v1 edits the two languages relevant to the target market; other profile
// languages are preserved untouched (proportionality — no add-language UI).
const EDITABLE_LANGUAGES = ["german", "english"] as const;

interface ProfileDialogProps {
  profile: Profile;
  onSave: (profile: Profile) => void;
}

export function ProfileDialog({ profile, onSave }: ProfileDialogProps) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        My Profile
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        {open && (
          <ProfileForm
            profile={profile}
            onSave={(next) => {
              onSave(next);
              setOpen(false);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ProfileForm({ profile, onSave }: ProfileDialogProps) {
  const [draft, setDraft] = useState<Profile>(profile);
  return (
    <>
      <DialogHeader>
        <DialogTitle>My Profile</DialogTitle>
      </DialogHeader>
      <div className="space-y-5">
        <SkillsSection draft={draft} setDraft={setDraft} />
        <LanguagesSection draft={draft} setDraft={setDraft} />
        <LocationSection draft={draft} setDraft={setDraft} />
      </div>
      <DialogFooter>
        <Button onClick={() => onSave(draft)}>Save profile</Button>
      </DialogFooter>
    </>
  );
}

interface SectionProps {
  draft: Profile;
  setDraft: React.Dispatch<React.SetStateAction<Profile>>;
}

function SkillsSection({ draft, setDraft }: SectionProps) {
  const [custom, setCustom] = useState("");
  const toggle = (skill: string) =>
    setDraft((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill],
    }));
  const addCustom = () => {
    const skill = custom.trim();
    if (skill && !draft.skills.includes(skill)) toggle(skill);
    setCustom("");
  };
  const customSkills = draft.skills.filter((s) => !SKILL_CATALOG.includes(s));
  return (
    <section className="space-y-2">
      <Label>Skills</Label>
      <div className="flex flex-wrap gap-1.5">
        {SKILL_CATALOG.map((skill) => (
          <SkillChip
            key={skill}
            skill={skill}
            selected={draft.skills.includes(skill)}
            onClick={() => toggle(skill)}
          />
        ))}
        {customSkills.map((skill) => (
          <SkillChip
            key={skill}
            skill={`${skill} ✕`}
            selected
            onClick={() => toggle(skill)}
          />
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={custom}
          placeholder="Add a custom skill…"
          onChange={(event) => setCustom(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && addCustom()}
        />
        <Button type="button" variant="outline" onClick={addCustom}>
          Add
        </Button>
      </div>
    </section>
  );
}

function SkillChip({
  skill,
  selected,
  onClick,
}: {
  skill: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors ${
        selected
          ? "border-primary bg-primary text-primary-foreground"
          : "bg-background text-muted-foreground hover:border-primary"
      }`}
    >
      {skill}
    </button>
  );
}

function LanguagesSection({ draft, setDraft }: SectionProps) {
  const setLevel = (language: string, level: string) =>
    setDraft((prev) => {
      const languages = { ...prev.languages };
      if (level === "none") delete languages[language];
      else languages[language] = level as LanguageLevel;
      return { ...prev, languages };
    });
  return (
    <section className="space-y-2">
      <Label>Languages</Label>
      {EDITABLE_LANGUAGES.map((language) => (
        <div key={language} className="flex items-center justify-between gap-2">
          <span className="text-sm capitalize">{language}</span>
          <Select
            value={draft.languages[language] ?? "none"}
            onValueChange={(level) => setLevel(language, level ?? "none")}
          >
            <SelectTrigger className="h-8 w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">none</SelectItem>
              {LEVELS.map((level) => (
                <SelectItem key={level} value={level}>
                  {level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ))}
    </section>
  );
}

function LocationSection({ draft, setDraft }: SectionProps) {
  return (
    <section className="space-y-2">
      <div className="space-y-1">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          value={draft.location}
          onChange={(event) =>
            setDraft((prev) => ({ ...prev, location: event.target.value }))
          }
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="region">Commutable region (comma-separated)</Label>
        <Input
          id="region"
          value={draft.region.join(", ")}
          onChange={(event) =>
            setDraft((prev) => ({
              ...prev,
              region: event.target.value
                .split(",")
                .map((c) => c.trim())
                .filter(Boolean),
            }))
          }
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={draft.remoteOk}
          onChange={(event) =>
            setDraft((prev) => ({ ...prev, remoteOk: event.target.checked }))
          }
        />
        Open to remote work
      </label>
    </section>
  );
}
