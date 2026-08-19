---
name: deslop
description: Strip AI slop from a branch's diff or named paths — comments, wrapper functions, defensive padding, any-casts, dead nesting.
argument-hint:
  [
    paths,
    files,
    or a base commit/branch/tag — defaults to the diff against main,
  ]
disable-model-invocation: true
---

# Deslop

Strip **slop** from the code in scope: padding written to look careful rather than to work.

The **burden of proof** is on the keep. Every candidate in the catalog goes, unless you can name the concrete thing that breaks or becomes unknowable without it. "Documents intent", "might help someone later", "matches the surrounding style" are not evidence — a bad convention repeated across a hundred files is a hundred pieces of slop.

## 1. Scope

- **Diff** (default) — `git diff <base>...HEAD --stat`, three-dot so code already on `<base>` stays out. `<base>` defaults to `main`.
- **Paths** — the files, directories, or globs the user named. Long-settled code qualifies; a pattern is slop whether it landed yesterday or last year.

Work only inside scope. Slop spotted outside it goes in the report, not in the edit.

## 2. Inventory

Before editing a line, list every candidate in scope. Scripts build the list; you judge it.

**Comments** — the largest seam, so it gets a scanner. Write its **ledger** into your scratchpad directory:

```
node .claude/skills/deslop/scripts/scan-comments.mjs --out=<scratchpad>/deslop <paths…>
```

`--diff=<base>` scopes it to a branch instead of paths. Drop `--out=` for a ranked worst-first summary on stdout, `--json` to fan it out yourself.

The ledger is a folder, so no one reader loads all of it:

- `index.md` — scope, the comment-line totals, and a table routing to every batch: file count, block count, link.
- `batches/<dir>.md` — one directory's blocks, a checkbox each: `L<line>`, `<comment lines>c/<code lines>L`, tags, preview. Tags are `top-heavy` (block dwarfs the code under it), `banner`, `jsdoc-restate`, `step-narration`, `history`, `echo`.

Read `index.md`, then work one batch file at a time. Rank is a reading order, not a verdict: a flagged block can be load-bearing and an unflagged one can be pure slop, so the tags say where to look first — the source file still has to be read. Tick each box as you settle it and write the outcome on the line: `cut`, or `keep — <evidence>`. The ledger is then the inventory step 4 reports against, and the one place parallel subagents hand their verdicts back to.

**Everything else** — grep the scope:

```
rg -n '\bas any\b|as unknown as|\bas [A-Z]|\)!|\]!'     # assertions
rg -n 'catch\s*\('                                      # rethrow wrappers
```

Then read each file and add what greps can't see: every function, hook, type, and interface declared there, and every nesting level ≥ 2. `git diff <base>...HEAD -U0 -- <file>` narrows this to what the branch actually added.

This list is the work. Build it in full before the first edit — a candidate you never listed is a candidate you never judged.

## 3. Cut

Each entry names its test on the left and the move on the right. Deletion is the move whenever inlining or renaming isn't.

**Comments** — **the code is the documentation**. Names, types, and structure carry what the reader needs; a comment is what is left over when the language genuinely cannot hold the fact. Delete is the move on nearly every block in the ledger. A human writes nothing here, or one line — one sentence is the ceiling on any keep, and a comment that needs a paragraph is code that needs a fix.

The exceptions are countable, and each survives only as that one sentence: an external constraint, a business or regulatory rule, a workaround for a dependency bug, a measured perf reason, an invariant the types can't carry. Nothing else is on the list. A batch file that comes back mostly `keep` was read as a formality — go back to it.

- Restates the code, narrates history, tags a spec ID (`ORD15`), banners a section → delete.
- JSDoc repeating the signature (`@param userId The user id`, `@returns the result`) → delete the block.
- Explains _what_ the code does → the code is the defect. Rename, extract a named helper, flatten, or split until it reads, then delete the comment. Shortening the comment instead of fixing the code is a failed cut.
- Longer than the code it introduces → the paragraph is arguing for a line that should argue for itself. Cut to the one sentence that survives the burden of proof, or delete outright.
- A "why we built it this way" essay → keep the one sentence naming the external cause; the rest goes.

**Functions**

- Called once, body three statements or fewer → inline at the call site.
- Name paraphrases the body (`getUserId` → `getUser().id`, `handleSubmit` → `submit(form)`) → inline.
- Forwards its arguments unchanged, or only delegates → delete, call the target.
- A parameter every call site passes the same value → drop the parameter.
- Options object with one caller → positional arguments.
- Interface or abstract class with one implementation → collapse into it.
- `try/catch` that logs and rethrows, or rewraps into a same-shaped error → delete the catch.
- Guard on something the types already guarantee, or on an internal caller you control → delete.

**Types**

- `as any`, `as unknown as X`, `!` standing in for a type that can be written → write the type.
- Type alias used once that restates a shape → inline it.
- Optional field every caller passes → make it required.

**Control flow**

- Nesting an early return would flatten → flatten.
- `else` after a `return` → unindent.
- `if (x) return true; else return false` → `return x`.
- `const result = expr; return result` → `return expr`.
- Unused export, unreachable branch, flag with one value, commented-out code → delete.

**Tests**

- `Behaviours:` / `Seam:` headers restating the `describe`/`it` names → delete. Keep one only where it records a non-obvious rationale, e.g. why a dependency is doubled rather than asserted directly.
- Mock or fixture the test never asserts against → delete.
- Assertion that restates the setup → delete.

**Anything else that exists to look careful rather than to work** → same burden, same default.

Grep an identifier before inlining it. Call sites outside scope are the one genuine reach limit: leave it, list it as a keep.

## 4. Verify and report

`pnpm check` for the touched packages, plus `pnpm test:unit` where the files have tests. Format only the files you edited — never a directory glob.

Re-run the scanner over the same scope, to a second `--out=` folder. The two `index.md` headers are the run's measured before/after.

**Done when every box in the ledger is ticked — cut, or keep with the evidence for it — and every non-comment inventory item is settled the same way.** `rg -c '^- \[ \]' <ledger>/batches/*` finds what nobody settled. Report:

- files touched and the net line delta
- comment lines before → after, from the two scans
- keeps, one line each, with the evidence — a short list is the honest measure of the run
- slop found outside scope

A pass whose diff is mostly rewritten comments cut nothing. The diff should be mostly deletions.

## Guardrails

- Behaviour stays identical. Delete, inline, rename, extract, flatten are the moves. Fix a bug only when it is unmistakable, and flag it.
- Adding indirection to host a comment is slop again.
- Large scope: give each parallel subagent its own batch files — the batch is a unit of work, not a workload, so hand several small ones to the same subagent — and have each tick its own boxes in place. Read their diffs — a subagent reporting "done" is a claim, not evidence, and an unticked box is work nobody did.
