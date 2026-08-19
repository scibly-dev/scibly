# Behaviour spec: <subject>

**Subject**: `src/path/to/subject.ts` · **Signed off**: <user / pending>

> Upstream of both tests and implementation. Where the code disagrees, the code
> is the suspect — record under Findings, never edit the behaviour to match.

## Responsibility

One or two domain sentences: what this owns, and what it explicitly does not.

## Behaviours

Stable IDs — never reused or renumbered; retired behaviours struck through, not deleted.
Status: `agreed` (user confirmed) · `assumed` (needs sign-off) · `open` (no tests yet).

| ID | Behaviour | Why it matters | Status |
|----|-----------|----------------|--------|
| B1 | A learner cannot complete a scene whose predecessor is incomplete | Ordered lessons build on each other; skipping yields a certificate that misrepresents the learning | agreed |
| B2 | Completing an already-completed scene is idempotent | Double-submits from flaky mobile connections must not consume an attempt | agreed |
| B3 | A course with no scored scenes reports 0%, not null | Callers render straight into a percentage badge | assumed |

Domain language, not implementation: B1 survives a rename; "returns `PREVIOUS_SCENE_INCOMPLETE`" does not.

## Non-behaviours

Includes scope exclusions. An exclusion written down is one the user can overturn; an unwritten one looks like an oversight later.

| ID | Not a behaviour | Reason |
|----|-----------------|--------|
| N1 | Does not verify enrolment | Enforced by the router's auth guard; duplicating it lets the two drift |
| N2 | Does not test that the `where` filters | Prisma's behaviour — we assert the filter we build, not that the ORM honours it |
| N3 | `formatDuration` untested | One branch, no domain decision; types and call sites carry it |

## Open cases

Interview scratch space. Fold each into a `B` row once decided; empty by the time tests are written.

| Case | Decision | Status |
|------|----------|--------|
| Score exactly at the passing threshold | Passes — threshold inclusive | agreed |
| Two completions racing for one scene | ? | open |

## Findings

Phase 4. Type each: **implementation bug** (write the failing test, report) · **spec gap** (return to user, add ID) · **confirmed** (document with rationale).

| Finding | Type | Resolution |
|---------|------|------------|
| Threshold uses `>`, so a score exactly at the passing mark fails | implementation bug | Test written to spec, red pending fix |
