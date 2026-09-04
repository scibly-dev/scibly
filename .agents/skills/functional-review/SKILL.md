---
name: functional-review
description: QA a finished feature in the running app and write a report with screenshots.
disable-model-invocation: true
---

# Functional Review

A human reviewer opens the app, uses the feature, tries the thing the author did
not, and comes back with a list. This is that.

**Run this as a fresh subagent** (`Agent` tool), never in the context that wrote
the code. Fresh eyes are the whole value: an author tests the paths they already
had in mind, which are exactly the paths they already handled.

**Report only.** Findings go in the report; the human decides what to act on. An
agent that can patch will rationalise its own findings.

## 1. Establish scope

`git diff main...HEAD --stat`, then read the files that matter and form your own
picture of which routes the change reaches. Free text from the invocation
narrows scope; `gh issue view <n> -R scibly-dev/scibly` gives the intent — the
gap between what the issue asked for and what the diff does is a finding.

Read the `CONTEXT.md` of every feature directory the diff touches (see
`CONTEXT-MAP.md`). A feature that contradicts its own context's vocabulary is a
real defect even when it works.

## 2. Bring the stack up

```bash
pnpm wt:up   # idempotent: env files, private ports + database, migrate, seed
pnpm dev
```

**Use the URLs `wt:up` prints.** `localhost:3001` belongs to another worktree and
would review the wrong branch.

### Signing in

```bash
agent-browser open http://localhost:<app-port>/auth/login
agent-browser fill '#email' 'john_doe@gmail.com'
agent-browser fill '#password' 'Dummy_user#1234'
agent-browser eval '[document.getElementById("email").value, document.getElementById("password").value.length]'
agent-browser click 'button[type="submit"]'
```

The `eval` is mandatory: input typed before React hydrates is silently discarded
by the rerender, and an empty field looks exactly like a wrong password. Fill
again if the values did not stick. (`apps/app/__test__/e2e/helpers/sign-in.ts`
has the robust version, waiting on `__reactFiber$`.)

Two redirects are normal, not failures: `/auth/login` → `/de/auth/login`, and
every authenticated arrival → `/profile/onboarding` → *personal* settings. That
is the account area; the product lives under the org workspace, so navigate
straight to `/profile/org/scibly-dev/{courses,members,notebooks,learn,settings}`.
`packages/routes/src/index.ts` is the full route table — read it rather than
guessing paths.

Seed data: `john_doe@gmail.com` / `Dummy_user#1234` owns org `scibly-dev` with 21
courses (incl. a published "Cyber safety at work") and 50 members. For the
permission-boundary row use a non-owner in a clean session —
`dummy_user10@scibly.com` / `#Member#1234` is a plain member (2–5 are admins).
The e2e suite has its own org and user (`e2e_user1@scibly.com`, `scibly-e2e`).

## 3. Verify deterministically, before clicking anything

```bash
pnpm validate   # check (types, lint, format) + unit + Playwright e2e
```

**If this fails, stop and report it.** A red suite is a finding on its own, and
there is no point clicking through code that does not compile.

## 4. Drive the browser

Follow `.agents/skills/next-dev-loop/SKILL.md` — `agent-browser` for the
browser's view (DOM, console, network, React) plus `/_next/mcp` for Next.js's
(routes, server logs, compile errors). Read it before driving; do not guess
subcommands. It is also the only driver that shares the session you signed in
with, so stay in it rather than reaching for `webapp-testing`.

Screenshot as you go into `.reviews/<branch>/`, numbered in walk order.

## 5. What to cover

**Every row gets pass, fail, or N/A with a reason** — "N/A" alone is not an
answer. Skipping is allowed; skipping silently is not.

| Check | What it means here |
| --- | --- |
| German copy | Playwright pins `de-DE` and every user-facing component localises. No raw i18n keys, no English fallback. |
| Keyboard & labels | Tab reaches every control, focus is visible, buttons and inputs have accessible names. |
| Empty state | The surface with no data at all — new org, no courses, no members. |
| Loading state | Slow network. Does it show anything, and does it resolve? |
| Error state | Force a failure the feature can actually have. Errors surface, never swallowed. |
| Permission boundary | Repeat the key action as a non-owner. Server-side refusal, not just a hidden button. |
| 375px | Only if the surface is learner-facing or otherwise used on a phone. Say which, if N/A. |

**The checklist is a floor, not the review.** Walk the whole feature path end to
end and try the second-most-obvious thing a user would do: cancel halfway, go
back, reload mid-flow, double-click submit, paste something absurdly long, open
the same thing in two tabs. Report whatever you find, row or no row.

## 6. Write the report

`.reviews/<branch>/report.md`, screenshots beside it, gitignored. Every finding
carries steps, expected, actual and a screenshot — a finding a human cannot
reproduce from the report is not a finding. Most severe first, and say plainly
if you could not reach part of the feature and why.

```md
# Functional review — <branch>

<one paragraph: what the feature is, what you walked, verdict in a sentence>

`pnpm validate`: pass | fail (<what failed>)

## Checklist

| Check | Result | Notes |
| --- | --- | --- |
| German copy | pass | |
| Keyboard & labels | fail | see F2 |
| ... | n/a | author-only surface, never on a phone |

## Findings

### F1 — <one line>
**Steps** 1. … 2. …
**Expected** …
**Actual** …
![](03-publish-dialog.png)

## Walked but clean
<paths you exercised that behaved — so the next reviewer knows what is covered>
```

## After it ships

```bash
pnpm wt:down --yes
```

The stack is left running after a review so a human can open the app and see
what the report meant; this is the cleanup, once that is done.
