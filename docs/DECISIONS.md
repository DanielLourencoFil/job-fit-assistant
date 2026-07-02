# DECISIONS.md — one-line ADRs

Criterion for an entry: a fresh AI session would need it to avoid a wrong move.

1. **2026-07-02 — LLM does extraction only; fit judgment is pure TypeScript.** Keeps the non-deterministic surface minimal and the core logic testable without mocks.
2. **2026-07-02 — Rules split into machine-enforced gates vs judgment rules.** Prose doesn't bind an agent; tooling does. Poetic style advice was deleted in favor of ESLint limits + hooks + CI.
3. **2026-07-02 — No coverage % target, deliberately.** Coverage measures execution, not verification; % targets incentivize trivial tests. Scenario checklists (SPEC.md) replace it.
4. **2026-07-02 — Deletion guard in pre-commit (>80 lines, `ALLOW_BIG_DELETE=1` to override).** Ported from my production SaaS: brakes against destructive agent refactors. Lockfile excluded.
5. **2026-07-02 — Audits run in a fresh session.** The session that wrote code cannot audit it impartially — context isolation is the impartiality mechanism.
6. **2026-07-02 — Editable per-browser profile with canonical skill catalog.** Profile lives in localStorage (hardcoded profile = default seed; no auth — each browser is a private workspace). `SKILL_CATALOG` is the shared canonical vocabulary of the profile UI **and** the extraction prompt; custom skills are allowed and travel to the prompt as normalization hints, with tolerant matching (case-insensitive, ".js"-stripped) as the deterministic safety net. Residual synonym risk accepted.
7. **2026-07-02 — Deferred: auth + database (multi-user v2).** Storage sits behind `src/lib/storage.ts` and the profile enters the fit engine as a function argument — swapping localStorage for DB+auth later touches only those seams.
8. **2026-07-02 — Rate limit: 5 extractions/hour per IP, in-memory sliding window.** Protects the live API key on the public deploy. Best-effort on serverless (cold starts reset it) — accepted: demo mode is the default path; Redis would be disproportionate infra for a showcase.
9. **2026-07-02 — Fit is computed client-side; the route returns `{ posting }` only.** The fit engine is pure TS and browser-safe; the profile never leaves the browser (only skills travel as prompt hints). Route mirrors the boundary rule: extraction only.
10. **2026-07-02 — The agent cannot read `.env` files.** Harness deny rules (`Read` on `.env`, `.env.local`, `.env.*.local`) in global and repo settings; the human pastes the API key himself. `.env.example` stays readable.
11. **2026-07-02 — Saved fit verdicts are snapshots.** Editing the profile only affects new analyses; saved applications keep the verdict they were saved with (they record the decision taken at the time). No retroactive recompute in v1.
