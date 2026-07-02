# PLAN.md — Implementation plan (followed strictly, checked off as we go)

Rules of execution: one step at a time, in order. Each step ends with
`pnpm verify` green and one commit. Definition of done is per step.
Deviations from this plan require updating this file first (plan is the contract).

- [ ] **1. Types + profile seed** — `src/lib/types.ts`, `src/lib/profile.ts`.
      DoD: types compile; profile seed reviewed by the human. Commit: `feat: core types + profile seed`.
- [ ] **2. LLM boundary schema** — `src/lib/schema.ts` + `tests/fixtures/` (valid, malformed, partial) + contract tests.
      DoD: 4 schema scenarios green. Commit: `feat: zod schema for LLM extraction + contract tests`.
- [ ] **3. Fit engine** — `src/lib/fit.ts` + unit tests (all SPEC scenarios incl. boundaries).
      DoD: all fit scenarios green. Commit: `feat: deterministic fit engine + tests`.
- [ ] **4. Storage** — `src/lib/storage.ts` + unit tests (stubbed Storage).
      DoD: save/list/update/corrupted-data scenarios green. Commit: `feat: localStorage persistence + tests`.
- [ ] **5. API route** — `src/app/api/extract/route.ts` via ai-sdk; demo mode (no key → fixture). Integration test with mocked model.
      DoD: happy + failure shape green; no key never crashes. Commit: `feat: extract API with demo mode`.
- [ ] **6. UI: analyze flow** — paste box → analyze → review card (posting fields + fit flags, editable) → save.
      DoD: manual check in dev; no unit tests (rule). Commit: `feat: analyze + review card UI`.
- [ ] **7. UI: applications list** — saved list, status dropdown, delete.
      DoD: manual check. Commit: `feat: applications list`.
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
