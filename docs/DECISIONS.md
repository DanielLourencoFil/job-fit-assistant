# DECISIONS.md — one-line ADRs

Criterion for an entry: a fresh AI session would need it to avoid a wrong move.

1. **2026-07-02 — LLM does extraction only; fit judgment is pure TypeScript.** Keeps the non-deterministic surface minimal and the core logic testable without mocks.
2. **2026-07-02 — Rules split into machine-enforced gates vs judgment rules.** Prose doesn't bind an agent; tooling does. Poetic style advice was deleted in favor of ESLint limits + hooks + CI.
3. **2026-07-02 — No coverage % target, deliberately.** Coverage measures execution, not verification; % targets incentivize trivial tests. Scenario checklists (SPEC.md) replace it.
4. **2026-07-02 — Deletion guard in pre-commit (>80 lines, `ALLOW_BIG_DELETE=1` to override).** Ported from my production SaaS: brakes against destructive agent refactors. Lockfile excluded.
5. **2026-07-02 — Audits run in a fresh session.** The session that wrote code cannot audit it impartially — context isolation is the impartiality mechanism.
