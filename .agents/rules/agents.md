---
trigger: always_on
---

# AGENTS.md — 12-rule template

These rules apply to every task in this project unless explicitly overridden.
Bias: caution over speed on non-trivial work. Use judgment on trivial tasks.

## Rule 1 — Think Before Coding
State assumptions explicitly. If uncertain, ask rather than guess.
Present multiple interpretations when ambiguity exists.
Push back when a simpler approach exists.
Stop when confused. Name what's unclear.

## Rule 2 — Simplicity First
Minimum code that solves the problem. Nothing speculative.
No features beyond what was asked. No abstractions for single-use code.
Test: would a senior engineer say this is overcomplicated? If yes, simplify.

## Rule 3 — Surgical Changes
Touch only what you must. Clean up only your own mess.
Don't "improve" adjacent code, comments, or formatting.
Don't refactor what isn't broken. Match existing style.

## Rule 4 — Goal-Driven Execution
Define success criteria. Loop until verified.
Don't follow steps. Define success and iterate.
Strong success criteria let you loop independently.

## Rule 5 — Use the model only for judgment calls
Use me for: classification, drafting, summarization, extraction.
Do NOT use me for: routing, retries, deterministic transforms.
If code can answer, code answers.

## Rule 6 — Token budgets are not advisory
Per-task: 4,000 tokens. Per-session: 30,000 tokens.
If approaching budget, summarize and start fresh.
Surface the breach. Do not silently overrun.

## Rule 7 — Surface conflicts, don't average them
If two patterns contradict, pick one (more recent / more tested).
Explain why. Flag the other for cleanup.
Don't blend conflicting patterns.

## Rule 8 — Read before you write
Before adding code, read exports, immediate callers, shared utilities.
"Looks orthogonal" is dangerous. If unsure why code is structured a way, ask.

## Rule 9 — Tests verify intent, not just behavior
Tests must encode WHY behavior matters, not just WHAT it does.
A test that can't fail when business logic changes is wrong.
Derive tests from agreed intent, never from the implementation — code-derived tests
pin today's bugs as correct. Before writing, changing, or reviewing any test, load
the `testing` skill (`.agents/skills/testing/SKILL.md`); it owns the process.

## Rule 10 — Checkpoint after every significant step
Summarize what was done, what's verified, what's left.
Don't continue from a state you can't describe back.
If you lose track, stop and restate.

## Rule 11 — Match the codebase's conventions, even if you disagree
Conformance > taste inside the codebase.
If you genuinely think a convention is harmful, surface it. Don't fork silently.

## Rule 12 — Fail loud
"Completed" is wrong if anything was skipped silently.
"Tests pass" is wrong if any were skipped.
Default to surfacing uncertainty, not hiding it.


# Repository Guardrails

## Architecture

- Use a maximum of one React component per file.
- Split large components into smaller reusable components.
- Organize complex components with:
  - `index.tsx` as the entry point
  - local `components/` and `utils/` folders
- Reuse existing components, utilities, and shadcn/ui primitives before creating new ones.
- Extract duplicated or complex logic into helpers for readability and maintainability.

## Imports

- Prefer absolute imports using project aliases.
- Avoid relative import chains like `../../../`.

## Code Quality

- Avoid magic strings; use constants, enums, or maps.
- Prefer object lookups over large `if/else` or `switch` chains.
- Remove unused code, imports, variables, and dead paths.
- Keep functions small and focused.
- Move auth and validation checks early to avoid unnecessary work.
- Prefer joins and optimized queries over multiple sequential DB requests.
- Batch async operations only when it reduces total latency without increasing unnecessary requests.
- Add tests for critical, complex, or business-sensitive logic.

## tRPC & Data Access

- Use tRPC as the only data access layer.
- Never access the database directly inside server components.
- Define `onSuccess` and `onError` directly in tRPC hooks instead of wrapping mutations in custom `try/catch` logic.

## Type Safety

- Derive types from Prisma, tRPC, or existing shared types whenever possible.
- Do not create duplicate manual types.
- Never use `any`, unsafe assertions, `@ts-ignore`, or lint/type bypasses.
- Fix type issues at the root cause.

## Rendering & Performance

- Prefer server components and server rendering by default.
- Use server-side prefetching and hydration for initial data loading.
- Minimize client-side fetching and unnecessary re-renders.
- Avoid unnecessary network requests and expensive computations.

## Client/Server Boundaries

- Prefer server components by default.
- Only use `"use client"` when interactivity is required.
- Keep client components as small as possible.

## Validation & Security

- Validate all external input with shared schemas.
- Never trust client-provided authorization state.
- Enforce permissions server-side.

## Accessibility

- Ensure keyboard accessibility and semantic HTML.
- Always provide accessible labels and alt text.

## Dependencies

- Prefer existing libraries and internal utilities before adding new dependencies.
- Avoid adding dependencies for trivial functionality.

## Error Handling

- Never silently swallow errors.
- Log unexpected errors with sufficient context for debugging.
- Handle errors explicitly and return meaningful error states.
- Fail fast for invalid states and unauthorized access.
- Avoid empty `catch` blocks or generic fallback behavior that hides issues.

## Internationalization

- Every user-facing component must support localization.
- Store translations next to the consuming component.
- Use:
  - some-component/i18n/`<component>.i18n.lang.json`
  - some-component/i18n/`<component>.types.ts`
- Avoid global translation files.

## Metadata

- Always use `constructMetadata`.
- Extend shared metadata instead of rebuilding metadata objects manually.

## Validation

- Run linting and type checking after every change.
- Fix all issues properly instead of suppressing them.