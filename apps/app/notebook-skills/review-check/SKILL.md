---
name: review-check
description: Deliberately harsh quality review of a course, written as a human-style report (strengths, specific issues with location and fix, overall verdict) instead of a plain good/bad signal — checks concrete criteria (transfer-vs-trivia assessment quality, spaced repetition, guide-character consistency, schema-complete blocks, media support) and reports two kinds of findings, rule violations and didactic elevations; on a first-pass review of a fresh build it must name per lesson the most passive moment, the best unused media opportunity, and the shallowest question, each with a concrete upgrade. Also re-derives the original plan from this conversation's proposePlan call to confirm it was fully executed. Use whenever the user asks to review, audit, check, or judge the quality/completeness of a course, or as the mandatory critique step of batch-flow's two-iteration build. Works standalone for reviewing an already-existing course — does not require discovery or batch-flow.
---

# Review Check

This is a QA pass, not a content-authoring skill. It reads the course and reports back — it does not fix things itself unless the user asks for that as a separate follow-up action.

## The Bar Is High-End, Not "Fine"

You are reviewing against the standard of the best learning apps, not against "technically works." A course passes only if a demanding L&D professional would put their name on it. Grade like the strictest reviewer on the team:

- **Read every scene, not a sample.** Call `getSceneContent` for each scene. Criteria below that say "per lesson" mean checked in every lesson, not spot-checked.
- **Surface-level content is a failure, not a style note.** A lesson where the learner mostly reads, questions are answerable without thinking, or a concept appears once and never returns did not achieve its job — say so.
- **Do not round up.** "Needs another authoring pass" is a normal, useful verdict. A review that always ends in "ready with minor fixes" is a broken review.
- **Re-review after fixes.** If issues get fixed (by you on request, or by the user), run the full review again on the changed lessons before calling anything done. One review pass per authoring pass — the course is finished when a pass comes back clean, not when the first pass's issues are patched.

## Two Kinds of Findings

Report both, and label them:

- **Violations** — breaks of a concrete rule from the criteria below (empty block, biased distractors, missing reinforcement). These get fixed.
- **Elevations** — places where the course is *correct but didactically weaker than it could be*: a text nugget that should be an interaction, a paragraph that should be a diagram, a question that tests less than the learner could handle. These get **upgraded**, and they are what turns an okay course into one where the learner actually does something instead of consuming.

A review that only reports violations has done half its job.

## The First Review Is a Critique, Not a Confirmation

The first review of a freshly built course grades a **draft** — treat it like the harshest colleague on the team would, because iteration two is where the course gets good, and iteration two can only be as good as this critique. For **every lesson**, answer three questions and report the answers as elevation findings with a concrete rewrite proposal:

1. **Where does the learner consume instead of act?** Name the most passive moment of the lesson and state how to convert it — which interaction block, what the learner would do in it. "The scene is fine" is not an answer; every lesson has a most-passive moment.
2. **Where is the best unused media opportunity?** Name the one scene whose idea would land hardest as an image, diagram, or visual sequence (per `educational-visuals`), and sketch the visual (layout, labels, what it shows).
3. **Which question is the shallowest, and what is its deeper version?** Take the weakest practice moment and write the upgraded version in the finding itself — the added complication, the more tempting distractor, the production task that replaces the recognition task.

These three are mandatory per lesson on a first-pass review — a first draft in which no lesson can be activated further, visualized better, or deepened does not exist. Do not fabricate violations to seem strict; the elevations are where the strictness lives. And a first-pass verdict of "ready to publish" should make you suspicious of your own review: check the three questions again before writing it.

## Output Format

**Never output a single good/bad signal.** Structure every review like a human colleague's written feedback:

1. **Summary** — one or two sentences on overall state.
2. **Strengths** — what's genuinely working, specific enough to be useful (not "the course is good").
3. **Issues found** — one item per issue, each with: which lesson/scene it's in, what's wrong, and a concrete suggested fix. Group by the criteria below. Skip a section entirely if there is nothing to report for it — do not pad with "no issues found" filler for every category.
4. **Verdict** — is this ready to publish, ready with minor fixes, or needs another authoring pass. Be direct; do not soften a genuine gap into vague encouragement.

## Step 1: Re-derive the Plan

If this conversation contains an earlier `proposePlan` call (from `discovery`) for this course, treat its confirmed steps as the checklist:

- Extract the planned lessons/scenes from that tool call's steps.
- Call `listLessons` and `listScenes` for the course and compare what actually exists against what was planned.
- Report any planned lesson or scene that is missing, empty, or was silently dropped.

If `batch-flow` produced per-lesson **scene plan tables** (idea / rhythm role / block type / cognitive level / reinforces) in this conversation, check the built lessons against them row by row:

- Does each scene match its planned block type and cognitive level? A practice scene planned as Apply that shipped as a recall question is an issue, not a footnote.
- Was every concept listed in a "Reinforces" column actually resurfaced, in the promised different block type?
- Were deviations from the table announced when they happened, or silent?

**Limitation to be upfront about:** `proposePlan` is not persisted anywhere outside this conversation — if the plan was proposed in an earlier session, or if you're reviewing a course you didn't help build, there is no stored plan to check against. In that case, skip this step and rely on the criteria below plus the course's own stated objectives (course/lesson titles, descriptions) as the baseline instead. Say explicitly that no original plan was available to check against, rather than silently skipping the comparison.

## Step 2: Concrete Criteria

Check each of these as a genuine pass/fail per lesson, not a vague overall impression:

- **Schema-complete blocks**: any interactive block with empty content is an automatic fail for its lesson — empty matching-pair sides (left or right without content), empty flashcard faces, empty word-bank labels, unresolved `correctItemId`/`correctChoiceIds` references. Check every block, not a sample.
- **Transfer vs. trivia**: does at least one assessment moment per lesson test a decision or application, not recall of an isolated source fact (date, percentage, exact figure)? Flag any question that just asks for a number back.
- **Question depth**: flag any question answerable without thinking — the answer restated in the stem, all distractors obviously wrong, no plausible alternative action. At Apply/Analyze level, the scenario must contain a realistic complication; a friction-free scenario tests reading, not judgment.
- **Cognitive-level variety and escalation**: per `lesson-design`'s question-level ladder, are practice moments staged (recall early, application/judgment later)? Where a concept is practiced multiple times, does difficulty actually escalate, or is the same question re-asked in new words?
- **Spaced repetition**: does each must-know concept reappear on the expanding-gap schedule from `lesson-design` section 8 — immediate retrieval, near reinforcement 1-3 lessons later in a different block type, far reinforcement near the end? Name the concepts that appear only once. For 6+ lesson courses, check that review lessons exist and interleave concepts rather than introducing new ones.
- **Guide-character consistency**: is the same guide character present across all lessons (if Duolingo-style), with consistent voice/vocabulary? Flag any scene where the character's tone shifts noticeably or a different character appears. Also check the character frames explanation media — flashcards, infographics, and videos should have a guide beat introducing or reacting to them.
- **Guide-character layout variety**: does `data-layout` vary across guide scenes (left/right/top/inline), or is the character parked in one position all course? Two consecutive guide scenes with the same layout is a flag.
- **Block-type diversity**: per lesson, are at least 2 different interaction block types used, and is multiple-choice not the default for every practice moment? Across the whole course, flag any suitable block type that never appears — the input field is the usual victim, and a course where the learner never types anything is missing its strongest production task.
- **Right-sized interactions**: flag thin blocks — a cloze with a single gap, a drag-and-drop with 2 items, a matching block with fewer than 3 pairs. Per `scene-content`, an interaction should carry real retrieval effort (cloze 2-4 gaps, drag-and-drop 4-6 items, matching 3-5 pairs); multiple choice is the only one-question block.
- **Flashcard fronts**: flag any flashcard whose front is a bare term with no question, prompt, or situation around it. The front must give the learner something to retrieve against.
- **Media support**: for each lesson, judge whether any scene's idea would land better as an image, diagram, or short media nugget than as text — dense spatial/structural concepts, processes, comparisons, and anything the learner must later *recognize* are prime candidates. Flag these with a concrete suggestion (which scene, what visual, which layout per `educational-visuals`). Also flag the reverse: media that decorates without teaching.
- **Anti-bias distractors**: check EVERY block with an ordered array of options — multiple choice, cloze word banks, drag-and-drop items, matching-pairs rows — not a sample and not only multiple choice. Tally correct-answer positions per block type across each lesson — flag if any slot holds the correct answer in more than half the questions of that type, or if the correct answer is the longest option in more than a third. Pay particular attention to whichever block type is newest to this lesson's author (first time a block type is used is exactly where this check tends to get skipped) — check it as rigorously as multiple choice, not more leniently.
- **Grounded input-field/free-form answers**: for every input-field or free-form block, confirm the expected answer is a word or phrase the learner actually encountered earlier in this lesson (a nugget, guide beat, or gap) — not assumed vocabulary. If you cannot point to the scene that introduced it, this is a violation: the field is unwinnable through no fault of the learner's.
- **Interactivity ratio, checked as arithmetic**: count interactive/guide-driven scenes against the lesson's total and compare to `batch-flow`'s tallied plan (if available) or compute it directly. Below two thirds is a violation, not a style note — cite the actual fraction in the finding.
- **Pacing vs. stated time**: divide the lesson's `estimatedTimeToCompleteMinutes` by its scene count to get seconds per scene. Under roughly 15-20 seconds/scene for a lesson containing any Apply/Analyze-level practice is a red flag — that is tap-through speed, not enough time to read a scenario and actually think before answering. Cite the math in the finding (e.g. "21 scenes, 5 minutes stated = ~14s/scene, too fast for the two Apply-level questions in this lesson") and recommend either extending the stated time or trimming scenes that do not earn their place. Since scene count is no longer capped (per `lesson-design` section 3, "scene count is an outcome, not a target"), this is the check that catches a lesson that grew longer than its claimed pacing supports — nothing else in this list does.
- **Guide-only chains**: walk each lesson in scene order and flag any run of 3 or more consecutive guide-character-only scenes, regardless of their individual rhythm-role labels. A hook, then a feedback beat, then another hook can each be legitimate alone, but three or more in a row reads as an uninterrupted monologue no matter how they are labeled. This is distinct from the orphaned-theory-scenes check above — a hook→feedback→hook chain may contain no theory scene at all and still need this flag.
- **Single-task scenes**: any scene containing headings (content HTML must have none), more than 1-2 setup sentences, more than one interaction block, or restated context from a previous scene. A scene is one beat in the lesson's flow, not a standalone page.
- **Voice and formatting**: any em/en dashes or generic AI-sounding phrasing in scene text; explanatory scenes with zero inline emphasis (unedited text walls); fake lists (comma chains or `<br>` instead of real `<li>` items); emoji overuse (more than one per scene, or emojis inside question stems/options); formatting monoculture (every scene paragraph-only when blockquotes, columns, or lists would fit the content).
- **Plain-text-only scenes**: any scene that's only paragraphs with no interaction, media, or guide character. Interactivity is the default; flag lessons where fewer than two thirds of the scenes are interactive or guide-driven.
- **Orphaned theory scenes**: walk each lesson scene by scene in order. Every scene that delivers content (explanatory text, explaining guide beat, video, audio, infographic) must be directly followed by an interactive scene whose task is about that content — retrieval, application, or transfer. Flag every theory scene whose successor is another theory scene, a hook, an unrelated interaction, or nothing. This is a violation, not an elevation: per `lesson-design`, consuming without immediately doing is how content fails to stick.
- **Character-free images**: no generated image may contain a guide character, mascot, or third-party character (including Duolingo's owl). Flag for regeneration per `educational-visuals`.

## Step 3: Course Freshness

Call `getOutdatedScenes`. Report any outdated draft scenes as their own issue — do not let this get buried inside the plan-comparison section.

## Fixing Media Findings

When the user asks for fixes (or the `batch-flow` review loop is running), media-support findings are fixed by **actually producing the visual**: load `educational-visuals`, generate the image for the flagged scene, and place it via `insertContent` with a guide beat framing it (per `scene-content`). Do not "fix" a missing-visual finding by writing more text, and do not leave it as a suggestion in the report when you were asked to fix.

## When Called from `batch-flow`

The calling skill must not summarize the build as "done" until this review has run and its verdict has been shared with the user. If the verdict is "needs another authoring pass," say so plainly and let the user decide whether to fix now or later — do not silently downgrade a real gap to "minor fixes" to make the summary sound more finished than it is.
