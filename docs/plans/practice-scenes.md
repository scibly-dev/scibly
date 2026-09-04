# Practice scenes (PoC)

A second kind of scene whose content is an agent-generated interactive mini-app —
a Gmail clone seeded with phishing mail, a code editor with a failing test suite —
rendered in a sandboxed iframe and graded server-side against a solution the
authoring agent stored with it.

Why: today the agent uploads a source, writes a course, publishes it, and the
learner reads. Nobody became a programmer by reading. Practice is where the
learner does the work.

## Model

`SceneKind { DOCUMENT, PRACTICE }` on `Scene`, defaulting to `DOCUMENT`.
No new lesson type — `LessonIcon.PRACTICE` already exists and stays cosmetic.

New nullable `Scene` columns, draft side only:

```prisma
kind              SceneKind @default(DOCUMENT)
practiceHtml      String?   /// One self-contained HTML file. Never served from an app origin.
practiceSolution  Json?     /// { field: { value, points, eps? } }
practiceExplain   String?   /// Released to the learner on submit, always.
```

All writes go through one server function so a later swap of `practiceHtml` for a
Yjs `Y.Text` (live author-visible agent edits) is a single seam.

Publish is unchanged deep-copy (ADR 0002): `practiceHtml` → `learnerContent`,
`practiceSolution` + `practiceExplain` → `gradingManifest`. The solution never
reaches a client before submission — same trust boundary the question blocks use.

## Runtime

`practiceHtml` stores the agent's fragment only (inline `<style>`/`<script>` OK,
no `<!DOCTYPE>`/`<head>` boilerplate expected). A server function —
`assemblePracticeDocument(fragment)`, one file, following the shape of
[OpenGenerativeUI's `assembleDocument`](https://github.com/CopilotKit/OpenGenerativeUI/blob/main/apps/mcp/src/renderer.ts) —
wraps it into the full document at render time: CSP meta, design tokens, SDK,
in that order, injected right after `<head>` (adding one if the fragment has
none). Assembly is code, not stored data, so changing the CSP, the SDK or the
token set never touches an existing scene.

Rendered in an iframe, `sandbox="allow-scripts"`, no `allow-same-origin`, so it
runs on an opaque origin with no reach into a Scibly session. PoC serves it via
`srcdoc`; a dedicated `practice.scibly.app` host is the upgrade if the sandbox
attribute ever has to be relaxed. (OpenGenerativeUI's README iframe combines
`allow-scripts allow-same-origin` — do not copy that: for a `srcdoc` iframe that
pairing collapses back to the parent's origin, defeating the isolation this
whole boundary exists for.)

CSP is enforced by a `<meta http-equiv="Content-Security-Policy">` in the
assembled document (the only option `srcdoc` allows — there's no HTTP response
to header). Allowlist: `cdnjs.cloudflare.com` (Pyodide, CodeMirror, D3, Chart.js)
plus a reserved, currently-empty `cdn.scibly.app/practice/v1` for first-party
Scibly components later. No components ship in v1 — a Gmail clone is divs; the
only hard part is code execution, and the agent pulls Pyodide itself.

Design tokens: a small `<style>` block, single-sourced from the real CSS custom
properties in [globals.css](../../packages/ui/src/styles/globals.css)
(`--color-blue-500`, `--font-sans`, `--radius-md`, ...), injected into every
assembled document. Every generated app inherits Scibly's look without the
agent hand-rolling colors and without a component library.

Injected SDK:

```js
window.scibly = {
  mode: "attempt" | "review",
  previous: { work, grade } | null,   // review mode renders the answer record
  submit(work),                        // once; ends the scene
}
```

Height bridge (forked from OpenGenerativeUI's `BRIDGE_JS`, more robust than a
bare `ResizeObserver`): observes `document.body`, also fires on `window.load`
and a 200ms-interval fallback that self-clears after a few seconds, posts
`{ type: "scibly:height", px }` to the parent. The player clamps 200–2000 and
sizes the iframe. Works identically in embeds (nested sandboxed iframe).

**Not adopted from OpenGenerativeUI:** their `sendPrompt`/`openLink` bridge —
that pushes messages back into a live chat transcript, which only makes sense
for the agent↔Scibly run loop we already cut from v1. Their
`@jetbrains/websandbox` RPC library and Idiomorph DOM-morphing — those solve
incrementally rendering a *streaming* response into an iframe; a practice
document is written once via `writePractice` and served complete, so there's
no streaming case to justify a new dependency for two calls that raw
`postMessage` already covers.

**Why an iframe at all, not inline HTML in the page:** the app is agent-generated
code nobody reviewed. Inlined into the page it would share the Scibly React app's
global scope, DOM, cookies and session — real XSS, not theoretical. iframe
isolation is the boundary that makes "we don't need to worry about security here"
actually true for the rest of the app. `postMessage` is the unavoidable
consequence of that isolation (an opaque-origin sandboxed iframe has no other way
to reach the parent) — `window.scibly` is not the agent hand-rolling `postMessage`,
it's an SDK we inject as the first `<script>` in `practiceHtml`'s `srcdoc` that
wraps it. The agent only ever calls `submit(work)`.

**"Doesn't feel like an iframe"** is a styling choice layered on top, not a reason
to drop it: no border, `width/height: 100%` filling the scene's content area (a
practice can take over the full viewport, chrome-free), plus the height-forwarding
above. Isolation and full-bleed presentation aren't in tension.

Retry is free, unlimited and ungraded *inside* the app. `submit()` is the single
graded event, so `SceneProgress`, attempts, unlocking and certificates are
untouched.

## Grading

Field by field against the stored solution. Each field carries `points`; arrays
compare as sets, numbers take an optional `eps`. Open-ended practices store no
comparable fields and return the explanation alone. The explanation is returned
on every submit, so the learner's agent can debrief with ground truth instead of
reciting a score.

`maxSp` = scene basis SP + sum of solution field points, summed at publish exactly
like question-block SP.

**Known ceiling:** a client-side app is spoofable from devtools
(`window.scibly.submit({...})`). Acceptable for personal and low-stakes learning —
same posture as ADR 0006, guarding against the model getting it wrong, not a
hostile learner. A practice scene can never be compliance-audit evidence. Needs
an ADR.

## Validation

The agent writes the app blind and cannot see it render, so grading a payload
against the solution would pass an app whose Submit button is wired to nothing.
One pure function, `checkPracticeScene({ practiceHtml, practiceSolution })`,
reads the app's source and returns what is wrong with it: no html, no
`window.__sciblySelfTest` assignment, no `scibly.submit(work)` call, no
`scibly.onGraded()` call, or a solution field the html never mentions. A scene
that grades nothing is exploratory and passes on having html at all.

Every caller runs that same function:

- **publish** — any problem is `UNVALIDATED_PRACTICE`, naming the scene and
  what is missing. Not behind `force`: an app whose submit is wired to nothing
  strands the learner on the scene.
- **MCP `validatePractice`** — grades the agent's payload against the solution
  and returns `problems` alongside, so the agent sees the exact sentence
  publish would refuse with.
- **the editor** — the same list, recomputed live under the preview.

Nothing is stamped and nothing is stored. The check derives from the two
columns, so editing either re-derives it, and publish needs neither a browser
nor a UI visit first.

**Known ceiling:** string checks, not a parser. An app with all four markers
that still throws at runtime gets through; the upgrade path is a headless
Chromium run behind the same function.

## MCP surface

Mirrors the document path so an agent that can author a scene needs almost nothing new:

| Document                | Practice                                        |
| ----------------------- | ----------------------------------------------- |
| `getEditorSchema()`     | `getPracticeContract()`                         |
| `insertContent()`       | `writePractice(sceneId, html, solution, explanation)` |
| `getSceneContent()`     | `getPractice(sceneId)`                          |
| —                       | `validatePractice(sceneId, work)`               |

`createScene` grows `kind`. `insertContent` on a practice scene refuses by name
and says which tool to use. All five registered in `MCP_TOOL_NAMES`.

`getPracticeContract()` returns the SDK, the solution schema, the self-test
requirement, the CDN rules and a worked example — the `getEditorSchema` of practice.

## Author view

Live preview iframe, plain-text editing of html / solution / explanation, a
Validate button. Nothing fancy in the first iteration.

## Skills

One skill ships: `practice/contract` — how to build any practice app. Scenario
recipes (code kata, spot-the-thing, build-it) come after the contract has survived
real use. Served through the existing `loadSkill` tool.

## Cut from v1

- Agent↔Scibly run loop (`startPracticeRun` / coach / debrief)
- Personal organizations — an author already needs an account and an org
- Any publish or versioning change
- Chat-based practice: an interview is passive learning again
- Putting the app in the tiptap schema: limits what can be expressed, adds complexity
