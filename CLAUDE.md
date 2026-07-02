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
| Every commit compiles, lints, and passes tests | `pnpm verify` (typecheck + lint + test) in a pre-commit hook |
| LLM output never enters the app unvalidated | zod schema at the single LLM boundary; parse failure is a handled path with a test |

`pnpm verify` is the definition of green. Red = stop, fix, only then continue.

## Layer 2 — Judgment rules (procedural, human-reviewed)

Written as actions whose execution is visible in the agent's output — not as style vibes.

1. **Plan before code.** For any non-trivial task the agent first states: what changes, which files, the approach. No plan, no code.
2. **Reuse check.** Before creating a component/util/type, list what already exists in the target folder and state why none fits. Creation without this check gets rejected in review.
3. **Minimal diff.** A change touches only the files named in its plan. Unrelated refactors are a separate task.
4. **One concern per commit.** Conventional messages (`feat:`, `fix:`, `test:`, `docs:`, `chore:`).
5. **Tests ship with the logic.** Core logic (extraction, fit analysis, parsing) lands in the same commit as its unit tests (Vitest). UI is not unit-tested — deliberate scope decision (see SPEC.md).

## Rules for the human (not the agent)

- Read the diff. **Never commit code you don't understand.**
- The agent proposes; you decide. Approval is an act, not a default.

## Structure

- `src/lib/` — pure logic, no React imports.
- `src/components/` — UI.
- `src/app/` — routes and API handlers.
- A new file needs a clear owner-concern.

If any rule conflicts with speed, the rule wins.
