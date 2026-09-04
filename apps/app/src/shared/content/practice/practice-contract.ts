export const PRACTICE_CONTRACT = `# Practice scene contract

## What a practice scene is

A small app the learner *operates*, not a question they answer. They drag,
aim, build, connect, step, toggle or run something; the app reacts visibly
on every interaction; and the submitted work is the state their play
arrived at.

These are rejected however good the prose around them is:

- question text followed by <input> fields and a Submit button
- a "simulation" whose only interactive parts are numeric fields
- anything a learner could answer identically with the app deleted

If it can be solved on paper and then typed in, it is a DOCUMENT scene with
a question block. Do not build it here.

So: draw the state (canvas, SVG or live DOM) and redraw on every change.
Let the learner act on that drawing directly, and answer immediately —
motion, a highlight, a counter, a trace that builds up. Setup controls
(sliders, presets, a Run button) are fine when the run is the point; a panel
of number fields with nothing to watch is the anti-pattern above. For a
physics scene that means a body actually moving under the parameters the
learner set, and submit(work) reporting the configuration they *found* —
not the number they computed in their head.

## The fragment

practiceHtml is a self-contained HTML *fragment* (not a full document),
rendered inside a sandboxed iframe (sandbox="allow-scripts", no
allow-same-origin — it runs on an opaque origin with no access to the Scibly
session). Inline <style>/<script> are fine. Do not include <!DOCTYPE>,
<html>, or <head> — those are added automatically at render time, along
with a CSP, Scibly's design tokens, and the SDK below.

The page ground is transparent and the frame is seamless: your fragment IS
the scene the learner is looking at, not a widget embedded in one. Do not
paint a full-bleed page background or wrap everything in one big card —
colour only the surfaces that mean something (a stage, a panel, a token).

You get the whole scene column, up to ~1150px wide, and the frame grows to
whatever height your body needs. Lay the app out edge to edge and use the
space: a stage/canvas that fills the width with controls beside or below it,
not a 600px column centred in the middle. Do not cap your own width, and stay
responsive down to ~360px — the same fragment renders on phones.

## SDK (window.scibly)

Injected as the first <script>, before your fragment runs:

  window.scibly = {
    mode: "attempt" | "review",
    previous: { work, grade } | null,  // set only in "review" mode
    submit(work),                       // call exactly once; ends the scene
    onGraded(callback),                 // the verdict comes back here
  }

Call window.scibly.submit(work) exactly once, when the learner is done. work
is any JSON-serializable value — its shape must match the "solution" you
pass to writePractice (see below). There is no separate "check" step:
submit is graded immediately, server-side, against the stored solution, and
is the single scored event for the scene. Retrying inside the app before
submit is free and ungraded.

## Exploratory scenes (no submit, no Submit button)

Not every practice has a right answer. When the point is for the learner to
play with something until its behaviour clicks — a sandbox, a what-if,
a thing to take apart — pass solution: null, never call submit, and build no
Submit button at all. The player awards the scene's SP when the learner
presses Next, and shows your "explanation" under the app as the takeaway
before they move on. Write one: it is the only thing the platform says about
an exploratory scene.

Everything below — onGraded, the field-by-field solution, the self-test —
applies only when the scene has a solution. Skip all three if it does not.

## Showing the result (required when there is a solution)

Grading happens on the server, and the answer comes back into your still-
running app:

  window.scibly.onGraded(function (grade) {
    // grade.sp     -> points earned
    // grade.fields -> { "<fieldId>": { correct, expected, points, maxPoints } }
  });

Register it once at startup. It fires after submit (and immediately at boot
in "review" mode, where the same grade also sits in previous.grade), so
write one render path that handles both.

An app that prints "Submitted." and goes inert is a dead end — the learner
never finds out which of their eight decisions was wrong, which is the whole
point of the exercise. When the grade arrives, mark up *the things the
learner touched*: turn each misjudged email red in the list, snap the wrong
connection back, replay the trajectory that missed. grade.fields[id].expected
carries the right answer, so show it next to what they chose. Keep the app on
screen and readable — do not clear it, do not blank the stage.

## Solution schema (writePractice's "solution" argument)

null for an open-ended practice (no score, explanation only), or an object
keyed by field id:

  {
    "<fieldId>": { "value": <expected value>, "points": <number>, "eps"?: <number> }
  }

Grading is field by field: array values compare as sets, number values
compare within +/- eps (default 0), everything else compares by deep
equality. work[fieldId] is compared against that field's "value". Field ids
are yours to choose — submit(work) must send an object with the same keys.

## Self-test (required when there is a solution)

You write the app blind and cannot see it render, so every practiceHtml that
calls submit MUST also define:

  window.__sciblySelfTest = () => ({ /* the exact payload a correct play submits */ })

This is what the author's Validate button, and the validatePractice tool,
run the app against — proof submit is actually wired to something, not just
that the answer key is well-formed. Its return value must equal what a
learner who does everything right would pass to submit(work).

The author's Validate button feeds it to your own window.scibly.submit(), and
a run that scores full marks is what makes the scene publishable. Editing the
html or the solution afterwards retires that, so leave the hook correct.

## Allowed CDN

Scripts may only be loaded from cdnjs.cloudflare.com (Pyodide, CodeMirror,
D3, Chart.js, etc. are all there). No other origin is reachable from
inside the iframe — the CSP blocks it.

## Worked example

Ordering by direct manipulation — click one step, click another, they swap:

  <div id="app"></div>
  <script>
    const STEPS = ["render(data)", "fetch(url)", "await res.json()"];
    const order = [0, 1, 2];          // the learner's arrangement
    let picked = null;

    function render() {
      document.getElementById("app").innerHTML = \`
        <p>Put the steps in the order they run.</p>
        \${order.map((step, slot) => \`
          <button data-slot="\${slot}" style="display:block;width:100%;margin:4px 0;
            border:2px solid \${picked === slot ? "#0066FF" : "#eceae4"};border-radius:12px;
            padding:10px;background:#fff;cursor:pointer">\${STEPS[step]}</button>\`).join("")}
        <button id="go">Submit</button>\`;

      document.querySelectorAll("[data-slot]").forEach((el) => {
        el.onclick = () => {
          const slot = Number(el.dataset.slot);
          if (picked === null) picked = slot;
          else {
            [order[picked], order[slot]] = [order[slot], order[picked]];
            picked = null;
          }
          render();                    // every click redraws
        };
      });
      document.getElementById("go").onclick = () =>
        window.scibly.submit({ order: order.map((step) => STEPS[step]).join(" > ") });
    }

    render();

    window.scibly.onGraded((grade) => {
      const field = grade.fields.order;
      document.querySelectorAll("[data-slot]").forEach((el, slot) => {
        // Mark each slot the learner arranged against the right answer.
        const ok = STEPS[order[slot]] === field.expected.split(" > ")[slot];
        el.style.borderColor = ok ? "#58cc02" : "#e5484d";
      });
      document.getElementById("go").outerHTML = field.correct
        ? "<p>Correct \u2014 " + grade.sp + " SP.</p>"
        : "<p>Right order: " + field.expected + "</p>";
    });

    window.__sciblySelfTest = () => ({ order: "fetch(url) > await res.json() > render(data)" });
  </script>

writePractice's solution argument for this app:

  { "order": { "value": "fetch(url) > await res.json() > render(data)", "points": 10 } }

Note the order is submitted as a joined string: array values are compared as
sets, so an array would grade a shuffled answer as correct.
`;
