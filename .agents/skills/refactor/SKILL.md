---
name: refactor
description: Refactor planning and architecture scans for scibly-lms — produces plans and reports, never implements.
argument-hint: [paths, branch, or feature area — or "scan" for an architecture review]
disable-model-invocation: true
---

# Refactor (scibly-lms)

Two modes, one contract. The code under review WORKS — built iteratively, behavior user-validated. Your job is analysis and planning, never implementation.

**Contract (both modes):**

- **Read-only on source.** The only artifacts you write are the plan document or the HTML report.
- **Behavior preservation is the prime directive.** Current behavior is the spec, quirks included. Real bugs and security holes are still reported — in their own clearly-marked section, never silently folded into refactor steps.
- `references/codebase.md` is the repo knowledge: map, conventions, commands, stack-specific failure modes. Read it before anything else; include it verbatim in every sub-agent prompt.

**Pick the mode:**

- A specific feature, branch, or path to clean up ("refactor this", "make this production-ready") → **Plan mode**.
- An open-ended hunt for structural improvement ("where does the architecture hurt", "scan for deepening opportunities") → **Scan mode**.
- Ambiguous → ask before spending tokens.

---

## Plan mode

Bring a feature's internals to top-tier-org standard — boring, readable, obvious — without changing what it does. Be ambitious: prefer a **code-judo** move — a restructuring that uses the existing architecture to make whole branches, helpers, or layers disappear — over local cleanup that merely relocates code. The plan must be executable by a fresh agent with no context from this session: every step self-contained (files, current state, target, verification).

### 1. Scope

User-given paths/area, else the branch diff against merge-base with `main` (`git diff --stat $(git merge-base HEAD main)...HEAD`) plus any file heavily entangled with those changes. List in-scope files with rough line counts.

### 2. Baseline

Run the fast gate and the scope-relevant tests (commands in `references/codebase.md`); record commands and pass/fail in the plan — every refactor step must return to this baseline. Assess coverage of the in-scope code specifically: gaps become **Phase 0** — characterization tests that pin down current behavior, bugs and all, *before* any risky restructuring.

### 3. Fan out reviewers

Spawn six parallel read-only review agents (Explore or general-purpose) **in a single message**, one per dimension in `references/dimensions.md`: simplification, duplication, correctness, security, performance, maintainability. Each prompt contains, in order: the in-scope file list, `references/codebase.md` verbatim, its own checklist plus the shared instructions and findings format from `references/dimensions.md`. Reviewers report; they fix nothing.

### 4. Merge and verify

Reviewer output is raw material, not truth:

- **Dedupe** overlaps — simplification and maintainability often hit the same code.
- **Cut speculation.** A finding survives only with file:line + quoted evidence; "could be a problem if…" is dropped or listed as an open question.
- **Personally re-read the cited code** for every critical/high finding — subagents misread code and hallucinate line numbers, and a plan built on a false finding wastes an execution session.
- **Local convention beats generic best practice.**

### 5. Prioritize

Scan the surviving set once for a code-judo move that subsumes several findings — one reframing that deletes the complexity three findings each proposed patching around. It often turns out to be a **deepening** (shallow module → deep one); when it is, describe it in the `/codebase-design` vocabulary. Rank the portfolio by `(maintenance pain relieved × risk reduced) / (effort × regression risk)` and **cut the bottom**: renames of private locals, taste-level restructuring, formatter-work go to a "Not doing" list with one-line reasons — showing what you rejected stops the next agent from re-finding it.

Any surviving item whose target state is still genuinely open — the code-judo move usually is — goes through **Grilling** (below) before it may enter the plan.

### 6. Write the plan

Write `refactor-plan.md` at the repo root (or user-specified path), then summarize the top items in chat. Required structure:

```markdown
# Refactor Plan: <feature/area>
Date · branch · commit SHA of analyzed state

## Baseline
Test/typecheck/lint commands and their current status. Coverage assessment.

## Constraints
Behavior preservation; all conventions in `references/codebase.md`.

## Phase 0 — Safety net (only if coverage gaps exist)
Characterization tests to write first, and what behavior each pins down.

## Refactor steps (ordered)
### Step N: <imperative title>
- **Files:** …
- **Now:** what the code currently does/looks like (with file:line refs)
- **Target:** what it should become and why (reference the finding)
- **Risk:** what could break
- **Verify:** exact commands/checks proving behavior is unchanged

## Behavior-changing fixes (separate — these are NOT refactors)
Real bugs and security issues, each with evidence, impact, and a
recommendation. The user decides if/when these ship.

## Not doing
Rejected findings, one line of reasoning each.
```

Step rules: each **independently shippable** (fast gate passes, behavior unchanged after it lands — no step may depend on a later one), single-commit sized (a description needing "and" twice → split), ordered by dependency then risk, safest first.

---

## Scan mode

Surface architectural friction and propose **deepening opportunities** — refactors that turn shallow modules into deep ones, for testability and AI-navigability. Run the `/codebase-design` skill first and use its vocabulary exactly in every suggestion — **module, interface, depth, seam, adapter, leverage, locality** — never "component", "service", "API", or "boundary".

### 1. Explore

Scope before you scan — deepening pays off by making future change easier, so weight the parts that change. A user-named direction wins; otherwise mine `git log --oneline` for hot spots and let them pull your attention (scattered changes → widen the net). Read `CONTEXT.md` and `docs/adr/` if present — the domain language names good seams; ADRs are not re-litigated. Then send Explore sub-agents through the code organically, noting friction: one concept smeared across many small modules; **shallow** modules (interface nearly as complex as implementation); pure functions extracted "for testability" while the real bugs hide in their call sites (no **locality**); leaks across seams; code untestable through its current interface. Apply the **deletion test** to suspected shallowness: deleting it should *concentrate* complexity — "just moves it" is not a candidate.

### 2. HTML report

Write a self-contained report to `<tmpdir>/architecture-review-<timestamp>.html` (`$TMPDIR`, fallback `/tmp` / `%TEMP%`), open it (`xdg-open` / `open` / `start`), and tell the user the absolute path. Format, scaffold, diagram patterns, and tone live in `references/html-report.md`. One card per candidate: files, problem, solution, wins, before/after diagram, strength badge. Flag an ADR conflict only when the friction justifies reopening the ADR. End with a top recommendation. Do NOT propose interfaces yet — ask the user which candidate to explore.

### 3. Grill

Grill the candidate the user picked (below). When it lands on a concrete deepening, offer to run **Plan mode** on it — that turns the decision into the executable, verifiable plan.

---

## Grilling (both modes)

The user often knows *that* something needs a refactor ("course logic needs a refactor") without knowing *what* it should become. Whenever a target state is genuinely open — multiple viable shapes, or user intent underdetermined — run `/grill-me` on it before committing anything to a plan or report: constraints, dependencies, the target module's shape, what sits behind the seam, which tests survive. **A plan encodes decisions, not open options** — a step with an unresolved "or" in its Target has not passed this gate.

Side effects happen inline as decisions crystallize:

- Naming a module after a concept missing from `CONTEXT.md`, or sharpening a fuzzy term → update `CONTEXT.md` right there (create it lazily).
- User rejects a direction with a load-bearing reason → offer an ADR ("record this so future runs don't re-suggest it?") — skip ephemeral ("not now") and self-evident reasons.
- Alternative interfaces wanted → `/codebase-design` design-it-twice parallel sub-agent pattern.

---

## Maintenance

When a run (or its execution) reveals a convention or pitfall missing from `references/codebase.md`, propose adding it there.
