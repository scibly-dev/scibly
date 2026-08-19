---
name: nextjs-prisma-trpc-deep-review
description: Run a deeper, second-pass code review focused on Next.js/React, Prisma, tRPC, Zod, and Tiptap framework knowledge, performance, data-flow correctness, and security — a companion to the `refactor` skill's dimension-reviewer pass, not a replacement for it. Use for a deep review, second-pass review, refine the review, or nextjs prisma trpc deep review.
disable-model-invocation: true
---

# Next.js + Prisma + tRPC + Tiptap Deep Review Refinement

## Why this exists

The first pass of a code review tends to catch the obvious stuff and stop there. The genuinely useful findings — the place where a manual N+1 query loop could just be one Prisma `include`, or where a mutation quietly forgot to `revalidateTag` — usually only surface on a second, more skeptical look. This skill *is* that second look: a structured, checklist-driven pass built specifically around the parts of Next.js, Prisma, tRPC, Zod, and Tiptap that generated code tends to reinvent or get subtly wrong.

## How this fits with the first-pass review

This codebase also runs the `refactor` skill's Step 3 dimension-reviewer fan-out before this skill gets invoked — simplification (including code-judo-style restructuring and file-size), duplication, correctness, security, performance, and maintainability, each producing a JSON findings array (see `refactor/references/dimensions.md`). Don't repeat that pass. If a finding is really about generic software structure — true of any codebase in any language — it almost certainly already got caught there. Stay specifically in the territory a generic reviewer has no way to cover: things that require actually knowing these five libraries, plus performance, data-flow correctness, test coverage, and — unlike a purely local project — real security and input-validation review, since this one has actual users.

## Before you start

Two separate things need to happen before digging in:

1. **Locate the first pass's actual findings.** This runs right after the `refactor` skill's dimension-reviewer fan-out, so its findings should already be sitting in the conversation — find them rather than starting a parallel review the user then has to reconcile by hand. If they aren't there, ask for them; extending a review you don't have isn't possible.
2. **Re-read the changed code itself, fresh.** Don't lean on memory of what the first pass covered — that's exactly how a review ends up re-confirming what was already caught while glossing over what wasn't. If you don't know which files changed, check `git diff` / `git status` or ask.

These aren't in tension. The first review's *findings* are something to build on and keep; your own *inspection of the code* should still start fresh, so you're not primed to only notice what's already been pointed out.

## Self-critique before presenting anything

After drafting findings, take one more look through the lens of: "what would a senior engineer who's deeply fluent in Next.js, Prisma, tRPC, Zod, and Tiptap flag that I just didn't?" This is the step that most often gets skipped under time pressure, and it's specifically the step that catches what earlier passes missed. If nothing new comes up, that's a fine outcome — it means the review actually is thorough now, not that you didn't look hard enough.

## What to check, category by category

Go through all five categories below every time, even if one seems unlikely to apply. "Nothing found here" is a legitimate, useful result — skipping a category silently is how issues get missed again.

### 1. Simplification & code reduction via built-ins

Generated code often reimplements functionality these libraries already ship. Look specifically for:

**Next.js / React:**
- Manual fetch-then-`setState`-then-loading-flag boilerplate in a Client Component → fetching directly in a Server Component, or `use()` with a Suspense boundary
- Hand-rolled optimistic-update state management → `useOptimistic`
- Custom pending/disabled-state tracking on forms → `useFormStatus`
- Manual cache-busting query params or full reloads after a mutation → `revalidatePath` / `revalidateTag`

**Prisma:**
- Multiple separate queries to stitch together related data → `include` / nested `select`
- Manually creating a parent then its children in separate calls with app-level rollback logic → nested writes (Prisma wraps these in a transaction automatically)
- Hand-rolled loops calling `.update()` per record → `updateMany` / `createMany` (also auto-transactional)
- Custom TypeScript interfaces mirroring the database shape → Prisma's generated types

**tRPC:**
- Auth-check code copy-pasted into every procedure → a shared middleware / `protectedProcedure`
- The same input shape re-declared across multiple procedures → chained/shared `.input()` schemas
- Hand-written HTTP status/error mapping → `TRPCError` with the appropriate code

**Zod:**
- A TypeScript interface maintained by hand alongside a separate runtime check → one Zod schema with `z.infer<>` feeding both
- The same validation logic duplicated across client and server → a single shared schema imported on both sides

**Tiptap:**
- A custom rich-text extension built from scratch for something StarterKit or an official extension already covers → check the extension list before writing a `Node.create()`/`Mark.create()` from zero
- Manual keyboard-shortcut wiring for standard formatting → `addKeyboardShortcuts()` on an extended existing extension
- Hand-rolled content validation before saving → `enableContentCheck` / the published Tiptap JSON schema

For each one found, name the specific API and sketch what the replacement looks like. A vague "use more built-ins" is exactly the kind of unhelpful feedback this skill exists to avoid — specificity is the whole point. This is a different lens from generic refactoring suggestions: the point isn't "extract a helper," it's "this exact library already ships a feature that does this" — something only findable by actually knowing these frameworks, not by reading the diff structurally.

### 2. Performance flaws

- **Prisma**: N+1 query patterns (a query inside a loop instead of one `include`/`select`), missing indexes implied by frequent `where`/`orderBy` usage, fetching full rows when only a few fields are used, unpaginated `findMany` where a cursor/paginated query is needed
- **Next.js**: data fetching in a Client Component that could live in a Server Component, cache config that's missing (needless refetching) or too aggressive (stale data), heavy libraries imported into Client Components that don't need them client-side
- **React**: missing memoization or unstable object/function identities causing avoidable re-renders in list-heavy components or the Tiptap editor wrapper, unstable `key` props
- **Tiptap**: the editor instance being re-created on every render instead of once (unstable `useEditor` dependencies), large documents with no pagination/virtualization, extensions doing expensive work on every keystroke without debouncing

### 3. Data-flow & rendering-boundary correctness

This category is deliberately not "architecture" in the generic sense — that's the `refactor` skill's job. It's specifically about correctness patterns that only exist because this stack draws its boundaries in particular places:

- **Server/Client boundary**: logic that only needs to run server-side ending up in a `'use client'` component, or a Server Component reaching for hooks/browser APIs it can't use
- **Cache/mutation consistency**: a Server Action or tRPC mutation that changes data without calling the matching `revalidatePath`/`revalidateTag`, leaving the UI showing stale state
- **Schema single-source-of-truth drift**: the Zod schema, the Prisma schema, and the tRPC input/output types disagreeing in ways TypeScript won't catch — e.g. a field required in Prisma but optional in the Zod input schema
- **Tiptap content boundary**: the persisted JSON (source of truth) diverging from what's rendered back out, or SSR/hydration mismatches from initializing the editor without `immediatelyRender: false`

### 4. Test coverage & edge cases

- Prisma: unique-constraint violations, concurrent writes to the same record, transaction rollback on partial failure
- tRPC: auth-failure paths return the right `TRPCError` code, malformed/boundary input values, empty results
- Next.js: `loading.tsx` / `error.tsx` boundaries actually get exercised, dynamic route params that are missing or malformed
- Tiptap: empty document state, content pasted from external sources (Word, Google Docs) that may not map cleanly onto the schema, very large documents

### 5. Security & input validation

- **tRPC**: every procedure touching user-specific or sensitive data uses `protectedProcedure`/auth middleware — and beyond authentication, checks that the authenticated user is actually authorized for the specific resource being read or mutated, not just "logged in" but "allowed to touch this row"
- **Prisma**: no user input concatenated directly into `$queryRaw`/`$executeRaw`; `where` clauses built from user input can't be widened to reach other users' data
- **Zod**: input schemas are as strict as the data actually allows — no unnecessary `z.any()`, unbounded strings, or `.passthrough()`; output validators used where returned data could otherwise leak more than intended
- **Next.js**: Server Actions carry their own auth/authorization checks rather than relying on client-side gating (a Server Action is a public endpoint by default), and no secrets or server-only values reach Client Components
- **Tiptap**: persisted content is sanitized before being rendered back out as raw HTML (stored-XSS risk from rich text), and untrusted JSON content is validated against the schema before being trusted server-side

## Presenting findings

The result should read as one refined review, not two stapled together. Carry the first review's findings forward — grouped however that review grouped them — and fold this pass's additions in under the five categories above, clearly marked as new. For each new finding, give: where it is, what's wrong, why it matters, and the specific fix — naming the actual API, not just "optimize this." Skip categories with nothing new to report rather than padding them; say so briefly and move on. What matters is that the user comes away with one complete, coherent review, not two documents they have to cross-reference themselves.

## After presenting

This skill's job is to make the findings sharper and more complete, not to change how the review-to-code pipeline works otherwise. Once findings are on the table, keep going the way this kind of review normally proceeds in this conversation — if the established pattern has been to implement flagged issues as you go, keep doing that; otherwise wait for direction.
