---
name: batch-flow
description: The execution cadence for actually building a course once a plan is confirmed — creating lessons in manageable batches, fully authoring every scene immediately instead of leaving placeholders, reusing the default Introduction scene, and checking completeness after each batch. Every build is two iterations by design — draft, then a harsh review-check critique, then a mandatory elevation pass (activate passive scenes, generate proposed visuals, deepen shallow questions) before the course counts as done. Use whenever the user asks you to actually create, build, or generate a course, lesson, or set of scenes (as opposed to just discussing or reviewing structure). Requires a confirmed plan from discovery and pedagogical rules from lesson-design.
---

# Batch Flow

This is the "how to actually build it" skill — the order and batch size in which you call `createLesson`/`createScene`/`insertContent`, not what the content should say (that's `lesson-design` + `scene-content`).

## Preconditions

Do not start creating lessons without a confirmed plan. If discovery hasn't happened yet (no confirmed `proposePlan` in this conversation, no known course style), load `discovery` first.

## Execution Pattern

1. **Draft the full course map first**, if not already done in `discovery`: lesson titles, one objective per lesson, planned scene count per lesson. Re-confirm with the user if the structure is large or was adjusted.
2. **Write the scene plan before authoring each lesson (mandatory).** Before the first `insertContent` of a lesson, produce a scene table in chat — one row per planned scene:

   | # | Idea (one per scene) | Rhythm role | Block type | Cognitive level | Reinforces |
   | --- | --- | --- | --- | --- | --- |

   - *Rhythm role*: hook / nugget / practice / feedback / reinforcement (per `lesson-design` section 6).
   - *Cognitive level*: only practice scenes get one — Remember, Apply, or Analyze, per the question-level ladder. Deciding the level here, before writing, is what prevents trivia questions.
   - *Reinforces*: which earlier concept (from this or a previous lesson) the scene resurfaces, or "—" for first exposure. Every must-know concept from the course map must appear in at least one later lesson's Reinforces column.
   - No two adjacent practice rows may share the same block type or the same cognitive level.
   - **Nugget-pairing check (row by row, before authoring):** every nugget row — text, guide exposition, image, video, or audio — must have an interactive row **directly beneath it** whose task practices that nugget's content: retrieval, application, or a transfer task. Two nugget rows back to back is a planning error — fix the table before writing a single scene. A nugget row with no paired interaction anywhere is content nobody will be asked to use: cut it, or convert it into an interaction that teaches through the task (per `lesson-design`'s no-theory-without-immediate-practice rule).
   - *Media check per nugget row*: for every nugget, decide at planning time whether it lands better as an image/diagram (per `educational-visuals`) than as text — processes, comparisons, spatial structures, and anything the learner must later recognize usually do. Put "image" in the block-type column and generate it during authoring, not as an afterthought.
   - **Tally the interactivity ratio under the table, as arithmetic, not an impression**: count Rhythm-role rows that are Practice/Retrieval/Reinforcement-with-a-block or a guide beat (zero-exposition) against the lesson's total row count, and write it out — e.g. "Interactive/guide-driven: 8 of 11 (73%)". If the count is below two thirds, the plan is not done: convert a nugget row into a guide beat or add a retrieval row before moving on, do not author against a plan that already fails this check.

   For a large build, fold these tables into the `proposePlan` confirmation. Then author each scene **against its row** — if you deviate while writing, update the row and say why. `review-check` will compare the built lesson to this table, including the tallied ratio.
3. **Fully author every scene you create**: immediately after creating a scene, write its content following `scene-content` — including its pre-insert validation pass (no empty block sides, faces, or labels; all IDs resolve; JSON parses). Never leave placeholder, empty, or "TODO" scenes, and never insert a half-populated interactive block to fill in later. If `insertContent` returns a `qualityWarning`, fix the scene immediately and re-insert before moving to the next scene — do not batch up warnings for later.
4. **Create lessons in manageable batches**: a few lessons at a time, not 10+ empty lessons at once.
5. **Use real interactive elements**: follow `scene-content`'s block-selection rules. Do not write "A) / B) / C)" as plain paragraph text and call it interactive.
6. **Reuse the default Introduction scene**: every new lesson already has an empty Introduction scene at order 0. Call `listScenes` after `createLesson` and populate that scene before calling `createScene` for additional scenes.
7. **Check completeness before continuing**: after each lesson batch, verify every scene has real content and source grounding where relevant.
8. **The build is two iterations, not one.** What you produce in steps 1-7 is **iteration one — a draft by definition**, no matter how carefully it was authored. The course is not done after it; the real quality comes from the critique-and-elevate cycle:

   - **Critique**: load `review-check` and run its full first-pass critique — violations *and* the three mandatory elevation findings per lesson (most passive moment → activation, best media opportunity → visual, shallowest question → deepened version).
   - **Elevate (iteration two)**: work through every finding as an authoring pass, not a patch job. Convert the named passive moments into interactions, actually generate the proposed visuals via `educational-visuals` and place them with a guide beat, replace the shallow questions with their deeper versions. This pass touches every lesson the critique touched — budget for it from the start; it is part of building the course, not aftercare.
   - **Accept**: run `review-check` again on the elevated course. Repeat elevate → review until a pass comes back clean. Only then is the build done.

   Never present iteration one to the user as the finished course. If time or scope runs out mid-cycle, say explicitly that the course is a draft that has not been through its elevation pass.
9. **Summarize progress**: tell the user which lessons/scenes are complete, which remain, what the critique found, and what the elevation pass changed.

Prefer a smaller complete course over a large unfinished shell. A course with 4 fully authored lessons is better than 10 lessons where only a handful of scenes contain content.

## Sizing During Creation

Scene count is an outcome, not a target (per `lesson-design` section 3). A lesson's scene table is complete when every must-know concept has its nugget-plus-interaction pair, the planned reinforcement rows exist, and the interactivity tally clears two thirds — however many rows that takes. Never trim practice or check scenes to make a lesson "fit," and never pad with trivial taps to make it look substantial; if a table keeps growing past one objective, split the lesson instead. If every lesson ends up with only 1-2 scenes, the course is probably over-split — merge adjacent lessons or add practice/feedback scenes.

In every non-recap lesson, at least two thirds of the scenes should be interactive or guide-driven (zero-exposition beats), using at least 2 different block types per `scene-content`'s diversity rule. `review-check` flags lessons below that bar.
