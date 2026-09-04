---
name: functional-review
description: Review a finished feature the way a human QA reviewer would — run the full verification suite, then open the app and click through the whole feature path including edge cases, error states and screen sizes. Produces a report with screenshots. Use when a feature is implemented and you want it checked before it ships.
disable-model-invocation: true
---

# Functional Review

A human reviewer does not read the diff and declare it fine. They open the app,
use the feature, try the thing the author did not, and come back with a list.
This is that, done by an agent that did not write the code.

**Run this as a fresh subagent.** Spawn it with the `Agent` tool; do not perform
the review in the context that implemented the feature. The whole value is a
reader who does not already know where the bodies are buried — an agent
reviewing its own work tests the paths it already had in mind, which are exactly
the paths it already handled.

**Report only. Never fix anything.** Findings go in the report; the human decides
what to act on. An agent that can patch will rationalise its own findings.

## 1. Establish scope

Three inputs, in this order:

1. **The diff, always** — `git diff main...HEAD --stat`, then read the files that
   matter. Form your own picture of what changed and which routes it reaches.
   Do not ask the implementing agent where to look.
2. **The steer, if given** — free text from the invocation narrows the scope.
3. **The issue, if given** — `gh issue view <n> -R scibly-dev/scibly` for the
   intent the feature was meant to serve. What the issue asked for and what the
   diff does are two different things, and the gap between them is a finding.

Read the `CONTEXT.md` of every feature directory the diff touches (see
`CONTEXT-MAP.md`). It defines the domain words, and a feature that contradicts
its own context's vocabulary is a real defect even when it works.

## 2. Bring the stack up

```bash
pnpm wt:up
```

Idempotent. Writes this worktree's five `.env` files from the main checkout,
gives it ports and a Postgres database nobody else is using, migrates and seeds.
Prints the URLs — **use the ones it prints**, never `localhost:3001`. That port
belongs to another worktree and you would review the wrong branch's code.

Then start the servers if they are not already up, and wait for the app to
answer:

```bash
pnpm dev
```

### Signing in

Two things strand an agent here. Both are avoidable.

**Sign-in is at `/auth/login` and the app redirects to a locale prefix** — you
land on `/de/auth/login`. Do not treat that redirect as a failure.

```bash
agent-browser open http://localhost:<app-port>/auth/login
agent-browser fill '#email' 'john_doe@gmail.com'
agent-browser fill '#password' 'Dummy_user#1234'
agent-browser eval '[document.getElementById("email").value, document.getElementById("password").value.length]'
agent-browser click 'button[type="submit"]'
```

The `eval` is not optional. Input typed before React hydrates is **silently
discarded** by the post-hydration rerender — the fields go empty, submit does
nothing, and the page looks identical to a wrong password. If the values did not
stick, fill again. `apps/app/__test__/e2e/helpers/sign-in.ts` waits on a
`__reactFiber$` key on `#email` for the same reason; read it if you need the
robust version.

**Signing in does not land you in the app.** Every authenticated arrival goes to
`/profile/onboarding`, which forwards an onboarded user to their *personal*
settings. That is the account area, not the product — an agent that stops there
reports being stuck when it is simply in the wrong half of the app.

The features live under the org workspace:

```
/profile/org/scibly-dev/courses     # 20 seeded courses, incl. a published Cyber Safety
/profile/org/scibly-dev/members     # 50 seeded members
/profile/org/scibly-dev/notebooks
/profile/org/scibly-dev/learn       # learner-facing side
/profile/org/scibly-dev/settings
```

Navigate straight there after signing in. `packages/routes/src/index.ts` is the
full route table — read it rather than guessing paths.

The seed user is `john_doe@gmail.com` / `Dummy_user#1234`, owner of org
`scibly-dev` ("Scibly Development"). The e2e suite uses a *different* user
(`e2e_user1@scibly.com` / `#Member#1234`, org `scibly-e2e`) — do not mix them up.

## 3. Verify deterministically, before clicking anything

```bash
pnpm validate
```

`pnpm check` (typecheck, lint, format) + unit tests + Playwright e2e. **If this
fails, stop and report the failure.** There is no point clicking through code
that does not compile, and a red suite is a finding on its own.

## 4. Drive the browser

Follow `.agents/skills/next-dev-loop/SKILL.md`. It uses `agent-browser` for the
browser's view (DOM, console, network, React) and `/_next/mcp` for Next.js's own
(routes, server logs, compilation errors). Read it before driving; do not guess
`agent-browser` subcommands.

Do not use the `webapp-testing` skill for this — it drives a separate Python
Playwright process, loses the Next.js view, and its browser will not share the
session you signed in with.

Screenshot as you go, into `.reviews/<branch>/`, numbered in the order you
walked them.

## 5. What to cover

**The checklist is mandatory.** Report every row as pass, fail, or N/A **with a
reason** — "N/A" alone is not an answer. Skipping is allowed; skipping silently
is not.

| Check | What it means here |
| --- | --- |
| German copy | Playwright pins `de-DE` and every user-facing component is required to localise. No raw i18n keys, no English fallback, no untranslated new strings. |
| Keyboard & labels | Tab reaches every control, focus is visible, buttons and inputs have accessible names. |
| Empty state | The surface with no data at all — new org, no courses, no members. |
| Loading state | Slow network. Does it show anything, and does it resolve? |
| Error state | Force the failure the feature can actually have — submit invalid input, break the request. Errors must surface, never be swallowed. |
| Permission boundary | Repeat the key action as a non-owner member. The seed has 50 of them. Server-side refusal, not just a hidden button. |
| 375px | Only if the surface is learner-facing or otherwise used on a phone. Say which, if N/A. |

**Then go beyond it.** The checklist is a floor, not the review. Walk the whole
feature path end to end — not the happy path only. Try the second-most-obvious
thing a user would do: cancel halfway, go back, reload mid-flow, double-click
submit, paste something absurdly long, open the same thing in two tabs. Report
whatever you find, whether or not a row covers it.

## 6. Write the report

`.reviews/<branch>/report.md`, screenshots beside it. Gitignored.

Concise and structured. Every finding needs the steps to reproduce it, what you
expected, what happened, and the screenshot. A finding a human cannot reproduce
from the report is not a finding.

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

### F1 — <one line, most severe first>
**Steps** 1. … 2. …
**Expected** …
**Actual** …
![](03-publish-dialog.png)

## Walked but clean
<paths you exercised that behaved — so the next reviewer knows what is covered>
```

Order findings by severity. Say plainly if you could not reach part of the
feature and why — a review that quietly skipped the hard half is worse than no
review.

## When the feature is done

```bash
pnpm wt:down
```

Stops this worktree's servers and drops its database. The stack is deliberately
left running after a review so a human can open the app and see what the report
meant; this is the cleanup, once it has shipped.
