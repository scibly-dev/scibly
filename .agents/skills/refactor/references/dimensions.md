# Reviewer dimensions

Shared instructions for every reviewer, followed by one checklist per dimension.
When spawning a reviewer, give it: the in-scope file list, the shared
instructions, its own checklist, and the findings format at the bottom.

## Shared reviewer instructions

You are reviewing functionally-correct, user-validated code to prepare a
refactor plan. You are READ-ONLY: report findings, change nothing.

- Every finding must cite `file:line` and quote the offending code. If you
  cannot point at concrete code, it is not a finding.
- Judge against the conventions of THIS codebase first, generic best practice
  second. Read neighboring files to learn the local idiom before flagging
  deviations from it.
- Do not flag style a formatter/linter would catch, and do not propose new
  features, dependencies, or architecture beyond what the code needs today.
- **Exception:** flag lint/type suppressions, monolithic component files, and
  `createElement` hacks — covered in `references/codebase.md` (React section).
- Severity honestly: `critical` = will hurt users or devs soon and badly;
  `high` = real ongoing cost; `medium` = worth fixing while nearby;
  `low` = mention only if nearly free.
- Don't rubber-stamp code that works but leaves the design messier than it
  needs to be. A restructuring that deletes a whole category of complexity —
  a code-judo move — outranks one that only relocates it; when you see a
  plausible one, that's a `high` finding even if every individual piece looks
  locally fine.

## simplification

The most common failure mode of iteratively-built code is accumulated
complexity that no longer earns its keep. Look first for a code-judo move — a
reframing that deletes a whole category of complexity rather than a fix that
relocates it — before working through the list below:

- Abstractions with one caller: interfaces, factories, wrappers, base classes,
  generics, or config options that exist "for flexibility" nothing uses.
- Layers of indirection where a direct call would do; callbacks/events where
  a function call suffices.
- Dead code: unused exports, unreachable branches, commented-out blocks,
  feature flags for decisions already made, leftover scaffolding from earlier
  iterations of the feature.
- State that could be derived; caching of things that are cheap; defensive
  handling of states that cannot occur.
- Functions/components doing several jobs stitched together by booleans
  ("flag parameters") — a symptom of features being bolted on.
- Ad-hoc conditionals or one-off branches bolted onto an otherwise-clean flow,
  especially outside what the change needed to touch — a sign the logic
  should live behind its own abstraction rather than tangle the existing path.
- Cleverness: anything a reader must simulate in their head to understand.
  Boring and explicit beats compact and smart.

## duplication

Search the WHOLE repository, not just the diff — iteratively-built features
routinely reimplement what already exists.

- Copy-paste within the new code: near-identical blocks, components, queries,
  or validation logic diverging in small ways.
- Reimplementation of existing project utilities, hooks, helpers, types, or
  patterns (grep for similar names and shapes elsewhere in the repo).
- Reimplementation of things an already-installed dependency provides.
- Parallel type/schema definitions that must be kept in sync by hand
  (e.g. a TS type mirroring a DB schema or API contract that could derive
  from one source of truth).
- Duplicated string literals / magic numbers that encode the same decision
  in several places.

## correctness

The code passes its happy paths — the user tested those. Look where the user
did not:

- Error handling: swallowed exceptions, empty catch blocks, errors logged but
  execution continuing in a broken state, missing handling on async paths.
- Edge inputs: empty arrays/strings, null/undefined, zero, negative numbers,
  unicode, very large inputs, timezone/locale assumptions.
- Concurrency: race conditions, missing awaits, unhandled promise rejections,
  double-submits, stale-closure bugs in UI code, missing cleanup on
  unmount/abort.
- Resource handling: connections, subscriptions, listeners, timers, and file
  handles that are opened but not reliably closed on every path.
- Broken invariants: state that can become inconsistent between two sources
  (UI vs server, cache vs DB, doc vs attrs) and code that assumes it never does.
- Boundary conditions: off-by-one, inclusive/exclusive confusion, pagination
  edges, first/last-item special cases.

## security

Assume this ships to millions of users. Focus on the new/changed surface:

- Input validation and injection: SQL/NoSQL via string building, XSS via
  dangerouslySetInnerHTML or unescaped rendering, command/path injection,
  unvalidated redirects, SSRF in server-side fetches of user-supplied URLs.
- Authorization: every new endpoint/server action/query — does it verify the
  caller may act on THIS resource (not just that they are logged in)? IDOR is
  the default bug in iteratively-built CRUD.
- Data exposure: secrets or tokens in client bundles, logs, or error messages;
  API responses returning whole DB rows where the UI needs three fields;
  verbose errors leaking internals.
- Untrusted data handling: unsafe deserialization, prototype pollution,
  trusting client-supplied IDs/roles/prices.
- Denial-of-surface: unbounded query params (limit/size), missing rate
  limiting on expensive or abusable endpoints, ReDoS-prone regexes on user
  input.

## performance

Only flag what matters at real scale — no micro-optimization theater:

- Database: N+1 query patterns, missing pagination on unbounded lists,
  queries fetching far more than used, obvious missing indexes for new query
  shapes, transactions held across slow work.
- Hot paths: repeated expensive work inside loops/renders that could be
  computed once; O(n²) scans over data that grows with users.
- Frontend: components re-rendering on every keystroke due to unstable
  props/context, heavy work in render, missing virtualization on long lists,
  bundle-heavy imports for small utilities.
- Memory/growth: unbounded caches, arrays, or maps that grow with usage;
  listeners accumulating over time.
- Waterfalls: sequential awaits that could be parallel; blocking I/O in
  request handlers.

## maintainability

Would a new hire understand and safely change this file? Check:

- Naming: names that lie or say nothing (`data2`, `handleStuff`, `tempFix`);
  the same concept under different names in different files; names that no
  longer match behavior after iteration.
- Boundaries: business logic living in UI components; modules reaching into
  each other's internals; circular dependencies. A file crossing ~1000 lines,
  or a PR pushing one over that line, is a presumptive finding — flag it and
  propose a concrete split even if every piece inside it is individually
  reasonable. Files consisting of multiple larger components have to be split
  into multiple files inside one folder.
- Function shape: functions too long to read on one screen, deep nesting that
  early returns would flatten, boolean/positional argument soup.
- Contracts: public functions/endpoints without types or with `any`-shaped
  escapes; implicit invariants a caller must know but nothing documents or
  enforces.
- Consistency: deviations from how THIS repo already does routing, state,
  errors, naming, and file layout — new code should look native.
- Testability: logic welded to I/O or framework glue such that it cannot be
  tested without heavy mocking.
- Leftover iteration residue: misleading comments from earlier versions,
  TODO/FIXME/HACK markers, console.log debugging, dead props.

## Findings format

Each reviewer returns ONLY a JSON array (no prose around it):

```json
[
  {
    "dimension": "duplication",
    "severity": "high",
    "file": "components/order-summary/order-summary-view.tsx",
    "line": 142,
    "summary": "One-sentence statement of the problem.",
    "evidence": "The quoted offending code, trimmed.",
    "suggestion": "Concrete target state, one or two sentences.",
    "confidence": "high | medium | low"
  }
]
```
