# PLAN.md — Implementation plan (followed strictly, checked off as we go)

Rules of execution: one step at a time, in order. Each step ends with
`pnpm verify` green and one commit. Definition of done is per step.
Deviations from this plan require updating this file first (plan is the contract).

- [x] **1. Types + profile seed** — `src/lib/types.ts`, `src/lib/profile.ts`. ✅ 6802d02
      DoD: types compile; profile seed reviewed by the human. Commit: `feat: core types + profile seed`.
- [x] **2. LLM boundary schema** — `src/lib/schema.ts` + `tests/fixtures/` (valid, malformed, partial, German) + contract tests. ✅
      DoD: 5 schema scenarios green. Commit: `feat: zod schema for LLM extraction + contract tests`.
- [x] **3. Fit engine** — `src/lib/fit.ts` + unit tests (all SPEC scenarios incl. boundaries). ✅
      DoD: all fit scenarios green. Commit: `feat: deterministic fit engine + tests`.
- [x] **4. Storage** — `src/lib/storage.ts` + unit tests (stubbed Storage). Applications **and profile** (load/save; hardcoded profile = default seed). `src/lib/skill-catalog.ts` (canonical `SKILL_CATALOG`).
      DoD: save/list/update/corrupted-data + profile roundtrip scenarios green. Commit: `feat: localStorage persistence + tests`.
- [x] **5. API route** — `src/app/api/extract/route.ts` via ai-sdk; request carries profile skills as normalization hints; demo mode (no key → fixture); **rate limit 5/h per IP** (`src/lib/rate-limit.ts` + tests); route returns `{ posting }` only (fit is client-side). `.env.local` placeholder + agent read-deny in harness settings.
      DoD: demo happy + failure shape + 400 + 429 green; no key never crashes. Commit: `feat: extract API with demo mode + rate limit`.
- [ ] **6. UI: analyze flow** — paste box → analyze → review card (posting fields + fit flags, editable) → save.
      DoD: manual check in dev; no unit tests (rule). Commit: `feat: analyze + review card UI`.
- [ ] **7. UI: applications list** — saved list, status dropdown, delete.
      DoD: manual check. Commit: `feat: applications list`.
- [ ] **7b. UI: profile editor** — skills multi-select from `SKILL_CATALOG` + custom-skill input + languages + location/remote; persisted via storage; used by fit + sent to extraction.
      DoD: edited profile changes fit verdicts; persists across reload. Commit: `feat: editable profile`.
- [ ] **8. States & errors** — loading, empty, parse-failure message surfaced to user.
      DoD: demo-mode failure fixture renders friendly error. Commit: `feat: loading/empty/error states`.
- [ ] **9. Deploy** — Vercel, demo mode default; `ANTHROPIC_API_KEY` only as local/env opt-in.
      DoD: public URL works with zero setup. Commit: `chore: deploy config`.
- [ ] **10. README** — story, architecture sketch, how rules are enforced, link to CLAUDE.md/DECISIONS.md, demo URL.
      DoD: a recruiter understands the repo in 3 minutes. Commit: `docs: README`.
- [ ] **11. Final audit — fresh session** — rule compliance, dead code, orphan imports, risks.
      DoD: findings fixed or recorded. Commit: `audit: final review`.
- [ ] **12. (Stretch) E2E smoke** — Playwright, demo mode, paste→card→save→list.
      Commit: `test: e2e smoke`.
