# Job Fit Assistant

**Paste a job posting → an LLM extracts it into structured data → a deterministic engine scores how well it fits your profile → you get an explainable verdict you can save and track.**

Built as a focused showcase: not of feature breadth, but of how a single AI-powered feature is engineered when correctness, testability, and discipline are non-negotiable.

<p>
  <a href="https://job-fit-assistant.vercel.app/"><strong>▶ Live demo</strong></a> ·
  <a href="docs/SPEC.md">Spec</a> ·
  <a href="docs/DECISIONS.md">Decisions (ADRs)</a> ·
  <a href="CLAUDE.md">Engineering rules</a>
</p>

[![CI](https://github.com/DanielLourencoFil/job-fit-assistant/actions/workflows/ci.yml/badge.svg)](https://github.com/DanielLourencoFil/job-fit-assistant/actions/workflows/ci.yml)
![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-149eca?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript)
![Tests](https://img.shields.io/badge/tests-52%20passing-3fb950?logo=vitest)

> **Try it with zero setup.** The live deploy runs in **demo mode** — no API key, no login. Paste any posting (German ones work; extraction returns English canonical output) or hit _Load example_.

<!-- Drop a screenshot/GIF at docs/demo.png and uncomment:
![Job Fit Assistant](docs/demo.png)
-->

---

## The idea in one screen

One page, one flow:

```
paste posting → LLM extraction → deterministic fit score → editable review card → save with status → tracked list
```

- **Analyze** a posting in any language. The LLM reads it and returns a clean, typed `JobPosting`.
- **See a verdict** — 🟢 apply · 🟡 stretch · 🔴 skip — backed by a 0–100 score and a list of **explainable flags** ("Missing must-have skill: Kubernetes", "German C1 required — profile is B2").
- **Edit anything** on the review card; the fit **recomputes live** on every keystroke.
- **Save** applications and move them through a pipeline (saved → applied → interview → offer → rejected). The saved verdict is a **snapshot** — editing your profile later never rewrites past decisions.

Your profile is editable in the UI and lives in **your browser only** — it never touches the server. Only the skill names travel to the LLM, as spelling hints.

---

## The interesting part: where the AI stops

The central architectural decision is a hard boundary:

> **The LLM extracts. It never judges.**

```
┌─────────────┐   generateObject + zod   ┌──────────────┐   pure TS, client-side   ┌────────────┐
│ raw posting │ ───────────────────────▶ │  JobPosting  │ ───────────────────────▶ │ FitResult  │
│  (any lang) │   non-deterministic      │ (validated)  │   deterministic          │ score+flags│
└─────────────┘                          └──────────────┘                          └────────────┘
        server route handler  ·  key stays server-side          runs in the browser · profile never leaves it
```

Why it matters:

| Decision                                                              | Payoff                                                                                                 |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| LLM output is validated by a **single zod schema** at one boundary    | Malformed / partial / hallucinated responses are a _handled path with a test_, never a crash in the UI |
| Fit judgment is **pure, deterministic TypeScript**                    | The core logic is unit-tested **without mocks** — the scoring is reproducible and auditable            |
| Fit runs **client-side**; the route returns `{ posting }` only        | The profile stays private; the non-deterministic surface is kept as small as possible                  |
| **Demo mode** falls back to a recorded fixture when no API key is set | The public deploy works for free, with no exposed key                                                  |

The scoring policy is small, explicit, and lives in [`src/lib/fit.ts`](src/lib/fit.ts):

```
score = 55·skills + 20·language + 12·seniority + 13·location + alignment bonus (≤10)
```

…with caps that encode lived reality, not just arithmetic:

- **Below the required language level caps the score at 75** — never "apply" (the C1-gate lesson).
- **Senior-only roles cap at 78** for a career-changer.
- **A role requiring relocation you ruled out caps at 45** — effectively untakeable.
- Skills matching your _starred key skills_ earn an alignment bonus, so postings aligned with your strengths outrank shallow keyword coverage.

Every one of those rules is pinned by a hand-computed test anchor (e.g. _"stacked gaps → 57 · skip"_).

---

## Tech stack

| Layer       | Choice                                                                      |
| ----------- | --------------------------------------------------------------------------- |
| Framework   | **Next.js 16** (App Router) · **React 19**                                  |
| Language    | **TypeScript**, `strict: true`, zero `any` (lint-enforced)                  |
| LLM         | **Anthropic Claude Haiku** via the **Vercel AI SDK** (`generateObject`)     |
| Validation  | **Zod 4** — the one and only LLM↔app boundary                               |
| UI          | **Tailwind CSS 4** · shadcn/ui · Base UI · Lucide · next-themes (dark mode) |
| Persistence | **localStorage** behind a `storage.ts` seam (no DB by design)               |
| Testing     | **Vitest** — 52 tests, fixtures over live calls                             |
| Tooling     | Prettier · ESLint (complexity gates) · Husky · lint-staged · GitHub Actions |
| Hosting     | **Vercel** — front + back in one deploy                                     |

No database, no auth — deliberately. The AI workflow is the point, and every visitor's browser is their own private workspace. The storage and profile seams are designed so a DB + auth swap in v2 touches only those files ([DECISIONS #7](docs/DECISIONS.md)).

---

## Engineering discipline (the real showcase)

This repo was built with an AI coding agent under **machine-enforced rules** — the kind that tooling blocks, not the kind that rely on goodwill. See [`CLAUDE.md`](CLAUDE.md) for the full contract. Highlights:

- **Every commit compiles, lints, and passes tests** — `pnpm verify` runs in a pre-commit hook _and_ re-runs in CI (local hooks can be bypassed; CI cannot).
- **No `any`, no `@ts-ignore`, no disabled lint rules** — as ESLint _errors_, plus complexity/function-length caps.
- **LLM output never enters the app unvalidated** — zod at the boundary; parse failure is a tested path.
- **Tests are a ratchet** — a feature is "done" when a test locks it; a test may only change when its _requirement_ changes.
- **Deletion guard** — a commit removing >80 lines is blocked unless explicitly intended.
- **Audits run in a fresh session** — the context that wrote the code can't impartially review it.

### Testing philosophy — no coverage theater

There is **no coverage % target, on purpose** — coverage measures execution, not verification, and % goals incentivize trivial tests. Instead, each unit has a **scenario checklist** ([SPEC.md](docs/SPEC.md)) and every test must answer one question: _would it fail if the logic broke?_

```
tests/fit.test.ts        15  scoring anchors: full match → 100, stacked gaps → 57 · skip, C1 vs B2 cap …
tests/storage.test.ts    13  save/list/status roundtrip, corrupted JSON → empty (no crash)
tests/schema.test.ts      7  valid / malformed / partial / hallucinated / German→English canonical
tests/api-extract.test.ts 5  demo happy path, model failure shape, 400 invalid body, 429 rate limit
tests/paginate.test.ts    6  slicing, boundaries, out-of-range page clamps to last/first
tests/rate-limit.test.ts  3  sliding-window limiter
tests/dates.test.ts       3  formatting helpers
                         ──
                         52  all green in CI
```

LLM responses in tests are **recorded fixtures** — one valid, one malformed, one partial. No live API calls in the test suite.

---

## Run it locally

```bash
pnpm install
cp .env.example .env.local     # optional — leave the key empty to run in demo mode
pnpm dev                        # http://localhost:3000
```

To use live extraction instead of the recorded fixture, drop an Anthropic key into `.env.local`:

```bash
ANTHROPIC_API_KEY=sk-ant-...    # get one at https://console.anthropic.com
```

Quality gates:

```bash
pnpm verify      # typecheck + lint + test — the definition of "green"
pnpm test        # Vitest
pnpm typecheck   # tsc --noEmit
```

---

## Project structure

```
src/
├── app/
│   ├── api/extract/route.ts   # the only server code: LLM call + zod + rate limit + demo fallback
│   ├── page.tsx               # the single page
│   └── layout.tsx
├── components/                # UI — analyze panel, review card, applications list, profile dialog
│   └── ui/                    # shadcn primitives
└── lib/                       # pure logic, no React imports
    ├── fit.ts                 # ★ deterministic scoring engine
    ├── schema.ts              # ★ zod boundary — parseExtraction()
    ├── profile.ts             # default profile seed
    ├── storage.ts             # localStorage seam (DB-swappable)
    └── rate-limit.ts          # in-memory sliding window
docs/  SPEC.md · PLAN.md · DECISIONS.md    # what · how · one-line ADRs
```

`src/lib/` is pure and framework-free; `src/components/` is UI; `src/app/` is routes. A new file needs a clear owner-concern.

---

## Deliberately out of scope

Auth · database · multi-user · PDF/photo input · drag-and-drop kanban · i18n. Each was a conscious cut in favor of doing one flow well — documented, not forgotten ([SPEC.md](docs/SPEC.md)).

---

<sub>Built by Daniel Lourenço · [Live demo](https://job-fit-assistant.vercel.app/)</sub>
