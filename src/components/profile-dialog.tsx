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
import { LanguagesSection } from "@/components/profile-languages";
import { SKILL_CATALOG } from "@/lib/skill-catalog";
import type { Profile, Relocation } from "@/lib/types";

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

/** Chip cycle: off → selected → starred (key skill, weighs more) → off. */
function cycleSkill(profile: Profile, skill: string): Profile {
  const selected = profile.skills.includes(skill);
  const starred = profile.keySkills.includes(skill);
  if (!selected) return { ...profile, skills: [...profile.skills, skill] };
  if (!starred) return { ...profile, keySkills: [...profile.keySkills, skill] };
  return {
    ...profile,
    skills: profile.skills.filter((s) => s !== skill),
    keySkills: profile.keySkills.filter((s) => s !== skill),
  };
}

function SkillsSection({ draft, setDraft }: SectionProps) {
  const [custom, setCustom] = useState("");
  const cycle = (skill: string) => setDraft((prev) => cycleSkill(prev, skill));
  const addCustom = () => {
    const skill = custom.trim();
    if (skill && !draft.skills.includes(skill)) cycle(skill);
    setCustom("");
  };
  const customSkills = draft.skills.filter((s) => !SKILL_CATALOG.includes(s));
  const chipProps = (skill: string) => ({
    skill,
    selected: draft.skills.includes(skill),
    starred: draft.skills.includes(skill) && draft.keySkills.includes(skill),
    onClick: () => cycle(skill),
  });
  return (
    <section className="space-y-2">
      <Label>Skills</Label>
      <p className="text-xs text-muted-foreground">
        Click to select · click again to star a key skill (★ weighs more) ·
        third click removes.
      </p>
      <div className="flex flex-wrap gap-1.5">
        {SKILL_CATALOG.map((skill) => (
          <SkillChip key={skill} {...chipProps(skill)} />
        ))}
        {customSkills.map((skill) => (
          <SkillChip key={skill} {...chipProps(skill)} />
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
  starred,
  onClick,
}: {
  skill: string;
  selected: boolean;
  starred: boolean;
  onClick: () => void;
}) {
  const style = starred
    ? "border-primary bg-primary font-semibold text-primary-foreground ring-2 ring-primary/40"
    : selected
      ? "border-primary bg-primary text-primary-foreground"
      : "bg-background text-muted-foreground hover:border-primary";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors ${style}`}
    >
      {starred ? `★ ${skill}` : skill}
    </button>
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
      <RelocationSelect
        value={draft.relocation}
        onChange={(relocation) => setDraft((prev) => ({ ...prev, relocation }))}
      />
    </section>
  );
}

function RelocationSelect({
  value,
  onChange,
}: {
  value: Relocation;
  onChange: (relocation: Relocation) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-sm">Relocation</span>
      <Select
        value={value}
        onValueChange={(next) => next && onChange(next as Relocation)}
      >
        <SelectTrigger className="h-8 w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="no">not willing</SelectItem>
          <SelectItem value="maybe">for the right role</SelectItem>
          <SelectItem value="yes">willing</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
