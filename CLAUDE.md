# CLAUDE.md — Working Rules

Loaded by the AI coding agent (Claude Code) at the start of every session.
Two layers: **machine-enforced gates** (cannot be violated — tooling blocks it) and
**judgment rules** (procedural, verified by the human in review).

## Layer 1 — Machine-enforced gates (the law)

Enforced by tooling, not by goodwill. A commit that violates them is blocked.

| Rule | Enforced by |
|---|---|
| No `any`, no `@ts-ignore`, no disabled lint rules | `tsconfig strict: true` + ESLint (`no-explicit-any`, `ban-ts-comment` as **errors**) |
| Small functions, low complexity | ESLint `complexity: 10`, `max-lines-per-function: 60`, `max-lines: 300` |
| Formatting is mechanical, never discussed | Prettier via lint-staged |
| Every commit compiles, lints, and passes tests | `pnpm verify` (typecheck + lint + test) in a pre-commit hook |
| Every push re-verifies on the server | GitHub Actions runs `pnpm verify` — local hooks can be bypassed, **CI cannot** |
| LLM output never enters the app unvalidated | zod schema at the single LLM boundary; parse failure is a handled path with a test |
| Shipped behavior never regresses (ratchet) | a feature is "done" when a test locks it; refactors must keep all tests green |
| No large-scale deletion without explicit intent | pre-commit deletion guard: > 80 deleted lines blocked unless `ALLOW_BIG_DELETE=1` |

`pnpm verify` is the definition of green. Red = stop, fix, only then continue.
Tests are the agent's iteration harness: the agent runs them and reads the errors in a loop — they define "done".

## Layer 2 — Judgment rules (procedural, human-reviewed)

Written as actions whose execution is visible in the agent's output — not as style vibes.

1. **Plan before code.** For any non-trivial task the agent first states: what changes, which files, the approach. No plan, no code.
2. **Reuse check.** Before creating a component/util/type, list what already exists in the target folder and state why none fits. Creation without this check gets rejected in review.
3. **Minimal diff.** A change touches only the files named in its plan. Unrelated refactors are a separate task.
4. **One concern per commit.** Conventional messages (`feat:`, `fix:`, `test:`, `docs:`, `chore:`).
5. **Tests ship with the logic.** Core logic (extraction, fit analysis, parsing) lands in the same commit as its unit tests (Vitest). UI is not unit-tested — deliberate scope decision (see SPEC.md).
6. **Tests are a ratchet, not an obstacle.** A test may only change when its *requirement* changes — in a dedicated commit, stated in the plan. Never weaken a test to make it pass.

## Test rules — what counts as a real test

Architecture for testability: the LLM does **extraction only**, isolated behind zod.
Fit judgment is pure, deterministic TypeScript — testable without mocks.

Each rule below closes a known AI failure mode (trivial tests that verify nothing):

1. Every test must answer: **would it fail if the logic broke?** A test that can't fail is rejected in review.
2. Assert concrete values. Truthiness (`toBeDefined`) is never the sole assertion.
3. Minimum per unit: happy path + at least one unhappy path + boundary case where relevant.
4. Test behavior through the public API — never implementation details, never the mock itself.
5. LLM responses in tests are recorded fixtures (`tests/fixtures/`): one valid, one malformed, one partial. No live API calls in tests.
6. **No coverage % target — deliberately.** Coverage measures execution, not verification, and % targets incentivize exactly the trivial tests this section bans. Scenario checklists replace it.

## Rules for the human (not the agent)

- Read the diff. **Never commit code you don't understand.**
- The agent proposes; you decide. Approval is an act, not a default.

## Structure

- `src/lib/` — pure logic, no React imports.
- `src/components/` — UI.
- `src/app/` — routes and API handlers.
- A new file needs a clear owner-concern.

If any rule conflicts with speed, the rule wins.
