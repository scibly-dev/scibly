---
name: practice-scenes
description: How to design a PRACTICE scene worth building — a small app the learner operates (drags, aims, builds, runs) rather than a question they answer. Covers what gets rejected, drawing a state the learner acts on, laying the app out in the scene column, when a scene should be exploratory instead of graded, and how to show the grade so the learner learns from it. Load before writing or editing a PRACTICE scene with writePractice or validatePractice. A question with input fields and a Submit button is not a practice scene — that is a DOCUMENT scene question block, so load scene-content instead.
---

# Designing a practice scene

This is the design half. It says nothing about the SDK, the solution schema,
the self-test hook or what publishing refuses — call `getPracticeContract` for
those, and call it before you write any code. You cannot build a scene from
this file alone.

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

## Filling the scene

Your fragment IS the scene the learner is looking at, not a widget embedded in
one — the ground is transparent and the frame seamless. Do not paint a
full-bleed page background or wrap everything in one big card: colour only the
surfaces that mean something (a stage, a panel, a token).

Use the space you are given. Lay the app out edge to edge — a stage or canvas
that fills the width with controls beside or below it, not a 600px column
centred in the middle. Do not cap your own width, and stay responsive down to
phone widths, because the same fragment renders there.

## When a scene should be exploratory

Not every practice has a right answer. When the point is for the learner to
play with something until its behaviour clicks — a sandbox, a what-if, a thing
to take apart — make it exploratory: no solution, no submit, no Submit button.

Write the "explanation" carefully when you do. It is the only thing the
platform says about an exploratory scene, and the learner reads it as the
takeaway before they move on.

## Making the grade teach

An app that prints "Submitted." and goes inert is a dead end — the learner
never finds out which of their eight decisions was wrong, which is the whole
point of the exercise.

When the grade arrives, mark up *the things the learner touched*: turn each
misjudged email red in the list, snap the wrong connection back, replay the
trajectory that missed. Show the right answer next to what they chose. Keep
the app on screen and readable — do not clear it, do not blank the stage.
