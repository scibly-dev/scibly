# Interrogation question bank

Phase 2. Prompts for your own thinking — not a script. Cover the dimensions that apply; skip the rest.

## A proposal, sized

> ✗ "What should happen if the denominator is zero?"
> ✓ "Zero scored scenes — `computeScorePct(0, 0)` returns 0, null, or throws. Default 0: callers render straight into a percentage badge, null forces a branch into every call site. Unless 'no score yet' must look different from 'scored zero' in the UI?"

## Open with the scope, not a dimension

Sweeping all seven dimensions over a trivial subject manufactures behaviours nobody needs. Put Phase 1's scoped list up first and let the user cut it:

> *"In scope: the progression rules and the tenant guard on the scene router. Out: the DTO mappers (passthrough), `formatDuration` (one branch, covered by types). Anything there you want tested anyway?"*

Then per surviving subject: **what is the worst thing this could do wrong?** It ranks them and usually names the first behaviour.

## Dimensions

**1. Contract** — Responsibility in one domain sentence, and what it explicitly excludes. Post-conditions and invariants. Callers and what they do with the result. *If this were deleted, who notices and how fast?* An answer of "nobody" means don't write these tests — say so.

**2. Boundaries** — Equivalence partitions and their edges. You are eliciting the *classes* of input treated differently, not example values — each class earns one case, and the interesting ones sit at the edges:
- Collections: empty, one, many, duplicates, large. Does empty mean "not yet" or "definitively none"?
- Numbers: zero, negative, non-integer, and **the threshold ± 1**. `passesScore(70, 70)` — inclusive? Off-by-one on a threshold is the most common silent defect and is invisible to tests that only use 80 and 60.
- Strings: empty, whitespace-only, unicode, very long, embedded markup.
- Optionals: are `null`, `undefined`, and absent distinct?

**3. Failure modes** — Throw vs. typed failure vs. neutral value vs. log-and-continue. Which errors reach the user, and as what. Partial completion after a mid-sequence failure — acceptable or all-or-nothing? Retry-safe?

**4. Ordering / idempotency / concurrency** — Is a second identical call a no-op? Does input order matter? Is output order **guaranteed or incidental** — asserting on incidental order creates change detectors, failing to assert on guaranteed order misses bugs. Two concurrent writers: one wins, both apply, or one is rejected?

**5. Trust** — Which inputs are client-controlled and hostile. What is rejected, with which error. **Cross-tenant reachability** via a crafted ID. Is authorisation enforced here or assumed upstream — and is that assumption safe if a new caller appears? Authorisation behaviours get their own IDs.

**6. Ambient state** — Clock, timezone, locale, randomness, generated IDs, env config. Behaviour at midnight, DST, expiry-exactly-now, missing config. Anything ambient without a **seam** is untestable by construction — raise it as a finding.

**7. Negative space** — What must it refuse? What "can't happen" state should fail loudly rather than corrupt quietly? Which plausible-looking behaviour is deliberately absent (record it as a non-behaviour so nobody "fixes" it)? Closer: *"what bug here would embarrass you to ship?"*

## By SUT type

| SUT | Ask |
|---|---|
| **Pure logic** | Rounding direction and precision. Threshold inclusivity. Inputs pre-validated or defended? |
| **tRPC procedure** | Authorised roles. Unauthenticated vs. authenticated-unauthorised. DB failure → which `AppError`. Schema validation vs. handler checks. Transactional? What does a partial failure leave? |
| **Component** | What the user sees per state: loading, empty, error, populated. Announced to assistive tech. What must **not** render (pre-submission solutions are security behaviours). |
| **Hook** | First-render value before effects settle. Re-render on input change. Cleanup on unmount; what leaks without it. |
| **Editor / Tiptap / Yjs** | Resulting document *structure*. Authoritative vs. derived attributes. Undo. What must never round-trip to a learner — solution and grading-state stripping gets its own IDs. |
| **Parser / serialiser** | Round-trip guarantee: is `parse(serialise(x)) === x` promised or coincidental? Malformed input — throw or best-effort partial? Which whitespace is significant? |

## Stop condition

Every applicable dimension `agreed` or explicitly deferred, and each behaviour states in one domain sentence without naming the implementation. A behaviour describable only as "returns whatever `buildRow` produced" means the abstraction leaks — get the domain meaning.

Six sharp behaviours beat thirty vague ones.
