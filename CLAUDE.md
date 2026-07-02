# CLAUDE.md — Working Rules

This file is loaded by the AI coding agent (Claude Code) at the start of every session.
These are not suggestions — they are binding rules for how code gets written in this repo.

## Workflow — every task goes through four phases

1. **Plan** — for anything non-trivial: state what will change, which files, and the approach — *before* writing code. No plan, no code.
2. **Execute** — smallest useful step. One concern per change.
3. **Verify** — run `pnpm typecheck && pnpm lint && pnpm test` after every change. Never continue on red.
4. **Review** — the human reads the diff and must understand it before commit. Code the human doesn't understand does not get committed.

## Engineering principles

- Single responsibility: small functions, small modules.
- Reuse before creating: check existing components/utils first. No duplication.
- Explicit over clever. Boring code is good code.
- Edit minimally: don't rewrite unrelated code; preserve existing conventions.

## TypeScript & quality

- `strict: true`. No `any`, no `@ts-ignore`, no disabled lint rules.
- All external input — **LLM output included** — is schema-validated (zod) before entering the app.

## Tests

- Core logic (extraction, fit analysis, parsing) ships with unit tests (Vitest) **in the same commit** — not later.
- UI is not unit-tested in this project (deliberate scope decision, see SPEC.md).

## Structure

- `src/lib/` — pure logic, no React imports.
- `src/components/` — UI components.
- `src/app/` — routes and API handlers.
- A new file needs a clear owner-concern. No `utils.ts` dumping ground.

## Commits

- Small, atomic, conventional: `feat:`, `fix:`, `test:`, `docs:`, `chore:`.
- Every commit compiles and passes tests.

## AI rules

- The agent proposes; the human decides.
- LLM output is untrusted input: validate with a schema, handle the failure path.
- Never ship code the human doesn't understand.
- If a rule here conflicts with speed, the rule wins.
