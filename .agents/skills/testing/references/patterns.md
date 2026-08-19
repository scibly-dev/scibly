# Patterns by SUT type

Phase 5. The spec decides what to assert; this decides how to arrange it.

## Choosing the seam

Below the seam you trade reality for convenience; above it the failure surfaces three layers from its cause.

| Behaviour | Seam |
|---|---|
| Domain rules, calculations | Pure function |
| Authorisation, validation, error mapping, transactionality | Procedure, DB doubled |
| What a user sees / cannot see | Component |

Asserting the same rule at two seams means deleting one.

## Designing a seam

Hard-to-test usually means hard-wired dependency. Fix with a parameter, not a double:

```typescript
// ✗ ambient clock
export const isExpired = (s: Session) => s.expiresAt < new Date();
// ✓ injected boundary, convenient default
export const isExpired = (s: Session, now = new Date()) => s.expiresAt < now;
```

No fake timers, no module mock, and the test reads as the spec. `vi.useFakeTimers()` and `vi.mock` are the fallback for code you cannot change. If testability requires a change you won't make unilaterally, raise it as a finding.

**Prefer SDK-style boundaries over one generic fetcher.** A named function per external operation is a seam per operation:

```typescript
// ✓ each operation independently substitutable, one shape per double
const api = {
  getUser: (id) => fetch(`/users/${id}`),
  createOrder: (data) => fetch("/orders", { method: "POST", body: data }),
};
// ✗ one entry point, so every double needs a switch on endpoint
const api = { fetch: (endpoint, options) => fetch(endpoint, options) };
```

The generic version forces branching logic into test setup, hides which endpoints a test exercises, and types every call the same.

## Doubles

- **Never double the SUT** or anything in its call graph implementing spec'd behaviour. Past the seam a double substitutes your assumptions for reality — and they are always self-consistent, which is why over-doubled suites are green and useless.
- **A double is a premise, never a claim.** Setting `findMany` to return two rows and asserting two rows come back tests the double. Assert what our code *decided* — the filter it built, the mapping it applied, the rejection it raised.
- **Asserting the outbound payload is valid** at a real boundary: it is the observable effect.
- **Keep doubles dumb.** A double with branching logic is a second implementation that drifts. Branches needed → move the seam.

## Pure logic — table-driven

```typescript
it.each([
  { name: "accepts the next scene in order", state: active(["s1"]), cmd: complete("s2"), expected: "accepted" },
  { name: "rejects a skipped predecessor",   state: active([]),     cmd: complete("s2"), expected: "PREVIOUS_SCENE_INCOMPLETE" },
] as const)("B4: $name", ({ state, cmd, expected }) => {
  expect(describeOutcome(transitionAttempt(state, cmd))).toBe(expected);
});
```

- `as const` — literal types, so a typo in `expected` is a compile error, not a silently unmatched row.
- `$name` — failures read as the broken behaviour.
- Normalise discriminated unions through a named helper (`describeOutcome`). Logic inside the assertion is a smell.
- One table per behaviour ID, one row per partition.

## IO seams

Inject the boundary; assert the returned value **and** the outbound payload.

```typescript
describe("source ingestion", () => {
  let fetchPage: Mock;
  let result: IngestResult;

  beforeEach(async () => {
    fetchPage = vi.fn().mockResolvedValue({ status: 200, body: "<h1>Title</h1>" });
    result = await ingestSource({ url: "https://example.com/a" }, { fetchPage });
  });

  it("B2: extracts the document title", () => expect(result.title).toBe("Title"));
  it("B2: fetches the requested URL", () => expect(fetchPage).toHaveBeenCalledWith("https://example.com/a"));
});
```

Drive failures through the seam — a rejected `fetchPage` is how the real failure arrives:

```typescript
const outcome = await ingestSource({ url }, { fetchPage: vi.fn().mockRejectedValue(new Error("ECONNREFUSED")) });
it("B9: reports unavailable rather than throwing", () => expect(outcome.status).toBe("unavailable"));
```

## tRPC procedures

Build a caller with `createCallerFactory(courseRouter)`, double the DB at the boundary, assert outcomes.

- **Assert the specific rejection**, not that something threw — a typo also throws. Check the `AppError` code the spec names.
- **Cross-tenant isolation is a behaviour.** Caller in org A requests a resource in org B; assert the rejection. Highest-value test at this level.
- **Assert what was written**: `expect(db.scene.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ courseId }) }))` catches a wrong-tenant write.
- **Query-shape fidelity belongs in an integration test** against a real DB — a double that inspects the query is a second database and drifts from the schema.
- **Transactionality gets an ID.** Fail step two, assert step one did not commit.

Build the context inline. Extract a helper only on the second use, and make identity fields (user id, org id, role) **required parameters** — those are what authorisation tests vary and must never inherit a default silently.

## Components

Query by accessible role and name — how users find things, and how the accessibility guardrails are enforced.

```typescript
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";

describe("scene feedback", () => {
  beforeEach(() => render(<SceneFeedback state={{ status: "submitted", correct: false }} />));

  it("B6: tells the learner the answer was wrong", () =>
    expect(screen.getByRole("status")).toHaveTextContent(/not quite/i));

  it("B7: withholds the solution before the retry is spent", () =>
    expect(screen.queryByTestId("solution")).not.toBeInTheDocument());
});
```

The negative assertion carries the security behaviour and regresses silently — no snapshot catches it.

Never assert class names, DOM nesting, or child props. Stub a child only when it opens a socket or renders a canvas; say why inline.

## Hooks

```typescript
const { result } = renderHook(() => usePlayerNavigation(course));
expect(result.current.currentSceneId).toBe("scene-1");
```

Wrap state changes in `act`. The **first-render value** is a real behaviour and the one that usually breaks — a hook that settles correctly after flashing a wrong value is a visible bug. Assert loading states before the update, not only after.

## Tiptap / Yjs

Assert **document structure**, never serialised strings — string comparison fails on irrelevant whitespace and passes on semantic change.

- Traverse with `JSONContent` and typed helpers.
- `editor.getMarkdown()` is typed via `src/shared/content/editor/runtime/types/tiptap-markdown.d.ts`.
- Insert markdown: `editor.commands.insertContent(md, { contentType: "markdown" })`.
- **Stripping behaviours** (solutions, grading state, learner answers) get their own IDs. Assert absence *anywhere in the document*, including nested blocks — "absent at top level" is a weaker claim, and the bug lives in the difference.

Drive plugins through real transactions, not internals.

## Parsers

**Round-trip**: if `parse(serialise(x)) === x` is promised, table it across representative documents including empty, nested, unicode, markup-adjacent.

**Malformed input**: the spec must state throw vs. best-effort partial. Silently doing one while callers assume the other loses data.

`toMatchInlineSnapshot` is acceptable *here only*, when the output is stable and human-reviewable and the committed snapshot was read against the spec.

## Fixtures

Prefer builders over shared fixtures:

```typescript
const active = (completed: string[] = [], o: Partial<AttemptState> = {}): AttemptState =>
  ({ status: "active", completedSceneIds: new Set(completed), triesUsed: 0, maxTries: 2, ...o });
```

Each test states only what it depends on, so the test reads as a spec. Shared fixtures hide which fields matter and break distant tests for unreconstructable reasons.

Keep builders in-file until a second file needs them, then colocate as `<subject>.fixtures.ts`.
