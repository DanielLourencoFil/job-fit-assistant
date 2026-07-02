# SPEC.md — What this system is

One feature, one flow: paste a job posting → LLM extracts structured data →
deterministic fit analysis against my profile → editable review card → save with status → list.

## System decisions

| #   | Decision                                                                                         | Why                                                                                                                                  |
| --- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Single feature (paste → extract → fit → review → save → list)                                    | Showcase of workflow, not product breadth                                                                                            |
| 2   | **No auth, single-user by design**                                                               | Auth is commodity and shows nothing; personal tool                                                                                   |
| 3   | **No database — localStorage behind `src/lib/storage.ts`**                                       | The AI workflow is the point, not CRUD; recruiter uses the demo with zero setup. Kinous already proves Prisma/Postgres in production |
| 4   | React via Next.js App Router                                                                     | Deepest stack; matches target jobs (React/Next/TS)                                                                                   |
| 5   | Backend = Next.js route handler only                                                             | LLM key must stay server-side; separate API would be ceremony                                                                        |
| 6   | LLM = Anthropic via Vercel AI SDK; **demo mode** falls back to recorded fixtures when no API key | Deployed demo works without cost or exposed keys                                                                                     |
| 7   | Hosting: Vercel, one deploy                                                                      | Front+back together, free tier                                                                                                       |
| 8   | LLM extracts only; **fit verdict is pure TypeScript**                                            | See DECISIONS.md #1 — testability                                                                                                    |

## Data model

```ts
Profile          { skills: string[], languages: Record<string, string>,
                   seniority: string, location: string, remoteOk: boolean }
JobPosting       { company, role, seniority, mustHaveSkills[], niceToHave[],
                   languageRequirement, location, remote, salary? }        // LLM output, zod-validated
FitFlag          { label: string, status: "ok" | "warn" }
FitResult        { verdict: "good" | "stretch" | "skip", flags: FitFlag[] }  // pure TS
SavedApplication { id, posting, fit, status, createdAt }
Status           "saved" | "applied" | "waiting" | "interview" | "offer" | "rejected"
```

## Fit rules (deterministic)

- Must-have skill present in profile → ok flag; absent → warn.
- Language requirement above profile level (e.g. German C1 vs B2) → warn.
- Seniority "senior-only" vs career-changer profile → warn.
- Location: remote or within profile region → ok; relocation required → warn (not eliminatory).
- Verdict: 0 warns → `good` · 1–2 warns → `stretch` · 3+ warns or hard blocker → `skip`.

## Test scenario checklist (replaces coverage %)

**`schema.ts` (contract, fixtures):**

- [ ] valid LLM response → typed `JobPosting`
- [ ] malformed JSON → handled failure (no throw leaking to UI)
- [ ] partial response (missing required field) → handled failure
- [ ] hallucinated extra fields → stripped

**`fit.ts` (unit, pure):**

- [ ] all skills match, no warns → `good`
- [ ] missing must-have skill → warn flag with skill name
- [ ] German C1 required vs B2 profile → warn
- [ ] seniority senior-only → warn
- [ ] relocation required → warn, not eliminatory
- [ ] 1–2 warns → `stretch`; 3+ → `skip` (boundary: exactly 2 and exactly 3)
- [ ] salary absent → no flag, no error

**`storage.ts` (unit, storage stub):**

- [ ] save → list returns it; status update persists; corrupted stored JSON → empty list, no crash

**`/api/extract` (integration, mocked model):**

- [ ] happy path returns posting+fit; model failure returns handled error shape

**E2E smoke (stretch goal, demo mode):**

- [ ] paste → analyze → card renders → save → appears in list

## Out of scope (deliberate)

Auth, database, multi-user, photo/PDF input, drag-and-drop kanban, i18n, mobile polish.
