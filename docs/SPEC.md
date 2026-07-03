# SPEC.md — What this system is

One feature, one flow: paste a job posting → LLM extracts structured data →
deterministic fit analysis against my profile → editable review card → save with status → list.

## System decisions

| #   | Decision                                                                                                                                                                                                                                                     | Why                                                                                                                                          |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Single feature (paste → extract → fit → review → save → list)                                                                                                                                                                                                | Showcase of workflow, not product breadth                                                                                                    |
| 2   | **No auth — per-browser user.** Profile is editable in the UI and persisted in localStorage; the hardcoded profile is the default seed. Skills are picked from a canonical `SKILL_CATALOG` (custom skills allowed — normalized via extraction-prompt hints). | Each visitor's browser is their private workspace; auth adds nothing. The catalog gives profile and extraction a shared canonical vocabulary |
| 3   | **No database — localStorage behind `src/lib/storage.ts`**                                                                                                                                                                                                   | The AI workflow is the point, not CRUD; recruiter uses the demo with zero setup. Kinous already proves Prisma/Postgres in production         |
| 4   | React via Next.js App Router                                                                                                                                                                                                                                 | Deepest stack; matches target jobs (React/Next/TS)                                                                                           |
| 5   | Backend = Next.js route handler only                                                                                                                                                                                                                         | LLM key must stay server-side; separate API would be ceremony                                                                                |
| 6   | LLM = Anthropic via Vercel AI SDK; **demo mode** falls back to recorded fixtures when no API key; **rate limit 5 requests/hour per IP** (in-memory, best-effort on serverless)                                                                               | Deployed demo works without cost or exposed keys                                                                                             |
| 7   | Hosting: Vercel, one deploy                                                                                                                                                                                                                                  | Front+back together, free tier                                                                                                               |
| 8   | LLM extracts only; **fit verdict is pure TypeScript, computed client-side** — the route returns `{ posting }`; the profile never leaves the browser (only skills travel, as prompt hints)                                                                    | See DECISIONS.md #1 (same folder) — testability                                                                                              |

## Data model

```ts
Profile          { skills: string[], keySkills: string[], languages: Record<string, string>, seniority: string,
                   location: string, region: string[], remoteOk: boolean, relocation: "no"|"maybe"|"yes" }
JobPosting       { company, role, seniority, mustHaveSkills[], niceToHave[],
                   languageRequirement: { language, level } | null,
                   location, workMode, salary }                           // LLM output, zod-validated
// Postings may be in any language (German is common). The extraction contract
// requires English canonical output (tech names, language levels) — locked by
// a German-posting fixture in the contract tests.
FitFlag          { label: string, status: "ok" | "warn" }
FitResult        { verdict, flags, score?: 0–100, recommendation?: "apply"|"stretch"|"skip" }  // pure TS; score/recommendation absent on legacy snapshots
SavedApplication { id, posting, fit, status, createdAt }
Status           "saved" | "applied" | "waiting" | "interview" | "offer" | "rejected"
```

## Fit rules (deterministic, weighted score)

Flags (explainability) are unchanged; the verdict now derives from a 0–100 score:

- **score = 55×skills + 20×language + 12×seniority + 13×location + alignment bonus (≤10)**
- Skills: coverage weighted by posting importance (must-have 1.0, nice-to-have 0.3); no skills listed → neutral 0.7.
- Alignment bonus: 10 × (matched must-haves that are starred key skills / total must-haves) — postings aligned with your strengths outrank mere coverage.
- Language: meets → 1 · one CEFR level below → 0.4 · further below/absent → 0. **Below requirement caps the score at 75 — never "apply"** (the C1-gate lesson).
- Seniority: entry/mid → 1 · senior-only → 0.4 **+ cap 78** · unknown → 0.8.
- Location: remote(+ok)/region → 1 · unknown → 0.8 · out of region by relocation preference: willing 0.8 · maybe 0.5 · **refused 0 + cap 45 (skip)**.
- Recommendation: **≥80 apply · 60–79 stretch · <60 skip** (named constants); verdict derived (apply→good). Saved snapshots keep their stored values (DECISIONS #11); legacy snapshots without a score render the old verdict.

## Test scenario checklist (replaces coverage %)

**`schema.ts` (contract, fixtures):**

- [x] valid LLM response → typed `JobPosting`
- [x] malformed JSON → handled failure (no throw leaking to UI)
- [x] partial response (missing required field) → handled failure
- [x] hallucinated extra fields → stripped
- [x] German-language posting fixture → English canonical output (skills, language level)

**`fit.ts` (unit, pure — hand-computed score anchors):**

- [x] full match on key skills → 100 · apply, all flags ok
- [x] half must-haves missing → 75 · stretch, flag names the skill
- [x] stacked gaps (skill + C1 + relocation) → 57 · skip
- [x] German C1 vs B2 → capped at 75, never apply (+ warn flag)
- [x] required language level met → apply; language absent → cap
- [x] senior-only → capped at 78; junior/mid → apply
- [x] relocation warns but can still be apply; hybrid in region → full weight
- [x] normalization (.js/case) matches; non-key matches earn no bonus (98 vs 100)
- [x] no skills listed → neutral 0.7, no crash; salary absent → no flag

**`storage.ts` (unit, storage stub):**

- [x] save → list returns it; status update persists; corrupted stored JSON → empty list, no crash
- [x] profile roundtrip (edits persist); corrupted/missing profile → seed default

**`/api/extract` (integration, mocked model):**

- [x] happy path (demo mode) returns posting; model failure returns handled error shape; invalid body → 400; 6th request in the hour window → 429

**E2E smoke (stretch goal, demo mode):**

- [ ] paste → analyze → card renders → save → appears in list

## UI plan (approved)

One page, two columns (stacked on mobile). shadcn/ui on Tailwind.

- **Header:** title + "My Profile" button (opens ProfileDialog — step 7b).
- **Left — AnalyzePanel:** textarea, "Load example", "Analyze" (loading state);
  errors from the route (400/429/502) render as friendly inline messages;
  discreet banner when the response is demo mode.
- **Left — ReviewCard (after analyze):** editable fields (strings as inputs,
  skills as comma lists, workMode/level as selects); **every edit re-runs
  analyzeFit live**; verdict badge (good 🟢 / stretch 🟡 / skip 🔴); Save/Discard.
- **Right — ApplicationsList:** rows with verdict badge, company — role,
  status select (saved/applied/waiting/interview/offer/rejected), delete;
  empty state pointing at the left panel.
- **Fit is a snapshot at save time** — editing the profile later does not
  rewrite saved verdicts; new analyses use the new profile (DECISIONS #11).
- Components live in `src/components/`; state via two small hooks
  (applications, profile) backed by `storage.ts`; localStorage touched only
  after mount (SSR-safe).

## Out of scope (deliberate)

Auth, database, multi-user, photo/PDF input, drag-and-drop kanban, i18n, mobile polish.
