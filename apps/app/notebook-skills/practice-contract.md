# Practice scene contract

What the platform injects, enforces and refuses. This is the mechanical half:
it tells you what your code must call, not what makes a practice scene worth
building — load the `practice-scenes` skill for that.

## The fragment

practiceHtml is a self-contained HTML *fragment* (not a full document),
rendered inside a sandboxed iframe (sandbox="allow-scripts", no
allow-same-origin — it runs on an opaque origin with no access to the Scibly
session). Inline <style>/<script> are fine. Do not include <!DOCTYPE>,
<html>, or <head> — those are added automatically at render time, along
with a CSP, Scibly's design tokens, and the SDK below.

The page ground is transparent and the frame is seamless. You get the whole
scene column, up to ~1150px wide, the frame grows to whatever height your body
needs, and the same fragment renders on phones down to ~360px.

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

## Scenes with no solution

Pass solution: null, never call submit, and build no Submit button at all. The
player awards the scene's SP when the learner presses Next, and shows your
"explanation" under the app as the takeaway before they move on.

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
write one render path that handles both. grade.fields[id].expected carries the
right answer.

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

This is what the author's Validate button, and the validatePractice tool, run
the app against — proof submit is actually wired to something, not just that
the answer key is well-formed. Its return value must equal what a learner who
does everything right would pass to submit(work).

## What publishing checks

publishCourse reads every practice scene and refuses the ones that are not
finished. With no browser to run the app in, it reads the source: a scene with
a solution must assign __sciblySelfTest, call submit(work), call onGraded(),
and mention every field id in its solution. Nothing has to be validated by
hand first — but validatePractice returns that same list under "problems", so
call it once with your __sciblySelfTest() payload and you learn both whether
the app scores full marks and whether publishing will take it.

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
      document.getElementById("app").innerHTML = `
        <p>Put the steps in the order they run.</p>
        ${order.map((step, slot) => `
          <button data-slot="${slot}" style="display:block;width:100%;margin:4px 0;
            border:2px solid ${picked === slot ? "#0066FF" : "#eceae4"};border-radius:12px;
            padding:10px;background:#fff;cursor:pointer">${STEPS[step]}</button>`).join("")}
        <button id="go">Submit</button>`;

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
        ? "<p>Correct — " + grade.sp + " SP.</p>"
        : "<p>Right order: " + field.expected + "</p>";
    });

    window.__sciblySelfTest = () => ({ order: "fetch(url) > await res.json() > render(data)" });
  </script>

writePractice's solution argument for this app:

  { "order": { "value": "fetch(url) > await res.json() > render(data)", "points": 10 } }

Note the order is submitted as a joined string: array values are compared as
sets, so an array would grade a shuffled answer as correct.
