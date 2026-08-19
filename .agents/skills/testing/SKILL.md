---
name: testing
description: Spec-first testing for this Next.js and vitest monorepo. Use when building a feature or fixing a bug test-first (TDD, red → green), when authoring or replacing a vitest suite over existing code, when a test is failing, or when judging whether coverage is real.
---

# Spec-First Testing

## Premise

Tests written from the implementation are **characterization tests** — they pin current behaviour, bugs included, and cannot detect that the behaviour is wrong. They stay green through the change that breaks the product.

This skill produces **specification tests**. Direction of authority:

```
intent → spec → tests → implementation
```

Never right-to-left. That direction is what makes TDD work, and what a retrofit has to recover.

## Gate

**No test code until the behaviour is agreed and written down.** Three ways through:

1. Interrogation + signed-off spec (Phases 2–3).
2. User-supplied spec/ticket/acceptance criteria that answers the checklist. Name the document; list the gaps you are assuming.
3. User waives the interview. Write the spec yourself, mark every behaviour `assumed`, lead the report with them.

**Contamination is one-way.** Reading the SUT before the spec is agreed makes every expected value the value the code already returns. That is why Phase 1 stops at the signature.

**Prior tests are not a source of intent** — characterization at best. Expected values come from the user, not from other test files.

## Two modes

**TDD** — the behaviour does not exist yet. **Retrofit** — the code is already there.

Phases 1–3 and 7 run the same either way. Phases 4–6 differ, marked where they do.

---

## Seams

A **seam** is a boundary where behaviour is observable and dependencies are substitutable. Test at a seam, double past it, never reach inside one.

A test bound to internals goes red on a refactor that changed no behaviour — a red suite over a working product, which teaches people to update tests without reading them.

Which seams are under test is agreed with the user before any test is written; Phase 1's scoped list is that agreement.

---

## What earns a test

Applied while scoping, before the spec is written. Every test is read and maintained forever; one that cannot fail is a permanent tax.

### Ours, not theirs

Test the decisions this repo makes. That Prisma applies a `where`, Zod rejects a malformed payload, React re-renders, or `date-fns` crosses a DST boundary is **not our behaviour** — a failure there is an upgrade problem, not a regression you can fix.

Test our *use* of the library:

| ✗ Theirs | ✓ Ours |
|---|---|
| The `where` clause filters rows | The query we build carries the tenant filter |
| `z.string().min(1)` rejects `""` | Our `refine` rejects an end date before its start |
| Tiptap inserts a node | Our extension strips solutions before a learner sees the document |

A wrapper adds no behaviour until it adds a decision. Passthrough with no branch of ours is not a subject.

### Critical, complex, or asked for

| Earns a test | |
|---|---|
| **Critical** | Authorisation, tenant isolation, grades, money, data integrity, destructive or irreversible operations. Wrong here is damage, not a bug report. |
| **Complex** | Branches, thresholds, ordering, state machines, non-obvious edges — where you would hesitate to refactor without a test. |
| **Requested** | The user named it. Outranks this table; don't relitigate. |

Getters, one-line delegation, and constants are carried by the type system and their call sites.

### One case per equivalence partition

Enumerate the input classes the SUT treats **differently**, then one case each plus the boundaries between them.

`add(1,6)`, `add(4,1)`, `add(2,3)` is one partition tested three times — same branch, same arithmetic, no additional bug reachable. Genuinely distinct partitions for `add`: negatives, zero, non-integer, `MAX_SAFE_INTEGER` overflow, `NaN`.

**If you cannot name the bug a case catches that its neighbour does not, delete it.** Volume reads as thoroughness and measures as coverage; it is neither.

---

## Workflow

### 1. Contract surface

**Read:** exported signatures, types, domain enums, call sites, the nearest `CONTEXT.md` (or `CONTEXT-MAP.md`), `apps/app/src/ARCHITECTURE.md`, and any ADR governing the area.
**Skip:** SUT bodies.
**Output:** every subject either scoped in with its seam, or excluded in one line — plus the unknowns, which are the interrogation agenda.

Domain docs earn their read here: test names and interface vocabulary should match the project's language, not invent a parallel one.

Filter through **What earns a test** before interrogating — trivia wastes the attention the critical behaviours need, and a one-line exclusion is cheap for the user to overturn.

### 2. Interrogate

Use the `grill-me` skill if available; otherwise the same protocol.

- **One question at a time.** Batched questions get one answer covering a third of them.
- **Always propose a default** with its rationale. Open-ended questions get shrugs; a proposal gets a yes or a correction, both useful.
- **Codebase answers facts, user answers intent.** Look up enum values and call sites. Never settle an intent question by reading the SUT.
- **Domain framing.** "What does a learner see?" outperforms "what does this return?"

Track each behaviour `agreed` / `assumed` / `open`. Question bank: `references/interrogation.md`. Done when nothing material is `open`.

**Negative space** is the high-value region — happy paths are already in everyone's head.

### 3. Spec artifact

Write `<subject>.spec.md` beside the subject from `assets/spec-template.md`. Stable IDs `B1..Bn`, domain language, one-line rationale, status.

**Scratch, not a deliverable.** It exists to get sign-off before the tests do, and to hold the IDs while Phases 4–6 amend them. Phase 7 deletes it — the tests are what ships.

Domain language survives renames: *"a learner cannot complete a scene whose predecessor is incomplete"*, not *"returns PREVIOUS_SCENE_INCOMPLETE"*. A behaviour with no rationale is a behaviour not worth testing — writing the rationale is how you find those.

Get sign-off before writing tests.

### 4. Read the implementation — retrofit only

TDD has nothing to read: the spec is the design. Go to Phase 5.

Otherwise open the bodies now. **Spec wins.** Classify each divergence:

| Type | Action |
|---|---|
| Implementation bug | Write the test to spec, let it fail, report it. Do not `.skip` it. |
| Spec gap | Return to the user, then add a new ID. |
| Confirmed behaviour | Add to the spec with rationale. |

Editing the spec to match the code reverts this to characterization testing. Report all divergences before writing the suite — they often change what the tests should say.

### 5. Write

**Seam:** the highest seam at which the behaviour is observable with real collaborators. One behaviour, one seam.

**Double only past a seam:** network, DB, clock, randomness, filesystem. Everything else real.

**Shape:** table-driven (`it.each`) for pure and data-driven logic — rows read as a spec and gaps are visible. AAA + `beforeEach` for stateful SUTs (editors, state machines, hooks) where setup is multi-step.

**Traceability:** prefix names with the behaviour ID. Every `B` has a test; every test carries a `B`.

**No type escapes** — `as any`, `as unknown`, `@ts-expect-error`. A cast means the test stopped knowing what it inspects, and hides the signature drift that should have been a compile error — usually a finding about production types.

Read `references/patterns.md` before writing — seams, doubles policy, and a worked example per SUT type. First test in a package: `references/repo-setup.md` for the harness stubs and the `fetch` / jest-dom gotchas.

#### TDD — one vertical slice at a time

One seam, one test, one minimal implementation, then repeat.

- **Red before green.** The failing test comes first, then only enough implementation to pass the test in front of you.
- Each slice is a **tracer bullet**: what it teaches redirects the next one. Order the `B` IDs so the earliest slices resolve the most uncertainty.
- Writing all the tests and then all the implementation is **horizontal slicing**. Bulk tests pin the *shape* you imagined rather than behaviour anyone observes, and they commit you to that shape before the first slice has taught you anything.
- **Refactoring is not part of the loop** — it belongs to review (`code-review` skill), once the slice is green.

#### Retrofit

Write the suite from the spec, behaviour by behaviour, findings from Phase 4 reported first.

### 6. Prove the tests can fail

**TDD:** **red** already proved it. Each test failed against the strongest mutant there is — no implementation at all. Behaviours built this cycle need nothing further.

**Retrofit:** mutation-test. Per critical behaviour:

1. Inject one **mutant** — flip a comparison, delete a guard, swap arguments, return a constant, drop an `await`, remove a `where` clause.
2. `pnpm exec vitest run <path>`
3. Confirm the behaviour's tests **kill** it.
4. Revert. Verify with `git diff`.

| Result | Diagnosis | Action |
|---|---|---|
| Expected tests red | Behaviour guarded | Record |
| **Survived** | Untested despite appearances | Fix or delete the test |
| All red | Coupled to shared setup, not to behaviours | Split |
| Unrelated red | Cross-test coupling | Isolate |

Cover the 3–5 highest-stakes behaviours — authorisation, data integrity, thresholds. A surviving mutant is a false guarantee.

### 7. Report

Audit the suite for **slop** — tests that are green and worthless — against `references/anti-slop.md`. Then `pnpm exec vitest run <path>` and `pnpm typecheck`.

```markdown
## Spec coverage      | ID | Behaviour | Status | Tests |
## Mutation results   | Behaviour | Mutant | Killed? |   (retrofit; TDD reports red-first instead)
## Findings           divergences, typed per Phase 4
## Assumptions        everything still `assumed`
```

Lead with findings and assumptions. Coverage reassures; findings change what happens next.

Then **delete `<subject>.spec.md`**. Everything durable in it now lives in code: the `B` IDs in the test names, the rationale in the tests' own comments, the report above in the conversation. What is left is a second copy that nothing runs and nothing keeps honest.

Two things do not survive the file, so move them before deleting:

- **N rows** — a behaviour deliberately left untested. Absence has no line number; put it in a comment where the reader would otherwise wonder, or drop it if nobody would.
- **Cross-references** — another spec cited by ID. Re-point at the test file, which still exists.

---

## Scope

Vitest unit and integration tests (`src/**/*.test.{ts,tsx}`). Playwright e2e is out of scope — say so rather than stretching these patterns over it.
