---
name: lesson-design
description: Macro-level instructional design — learning outcomes, what content survives (must/should/nice-to-know triage), lesson sizing, the hook-nugget-practice-feedback-reinforcement rhythm, spaced reinforcement planning, and what cognitive level each assessment moment should target. Use whenever the user asks to design, review, outline, split, sequence, or improve a course, module, or lesson path, or to judge whether an existing course's structure is sound. Does not cover HTML/block mechanics or scene-level copy — load scene-content for that. Load discovery first if outcomes/audience/course style are not yet known.
---

# Lesson Design

Macro-level pedagogy: what to teach, in what order, how often to repeat it, and at what cognitive level to test it. This skill answers "is the course structured well" — not "is this scene's HTML valid" (that's `scene-content`).

## 1. Define Learning Outcomes

Before creating content, identify what learners should be able to do, what decisions they should make correctly, and what mistakes they should avoid. Use action-oriented outcomes that can be practiced and assessed.

Good: Recognize phishing attempts, handle customer objections, apply GDPR requirements, escalate incidents correctly.
Avoid vague outcomes: understand, learn about, become familiar with.

## 2. Identify Critical Knowledge (Didactic Reduction)

Sort content into:

- **Must know**: required for real decisions, safety, compliance, performance, or common mistakes.
- **Should know**: useful context that improves judgment.
- **Nice to know**: background detail that can be omitted, linked, or saved for optional material.

Build the course primarily from must-know content. Include should-know content only when it directly improves learner decisions. Avoid completeness for its own sake.

**This triage happens once, here, at course/lesson scope.** `scene-content` does not re-derive it — a scene only enforces the downstream consequence (exactly one idea per scene), it does not re-run the must/should/nice judgment.

## 3. Design Lessons

**The lesson is the smallest self-contained learning unit — not the scene.** A scene is one beat (one task, one guide moment, one nugget) that relies on the scenes before it; a lesson is a complete, repeatable arc a learner can redo any time. Design top-down: decide the lesson's single objective and its flow first, then break the flow into single-task scenes.

Prefer more lessons with fewer scenes over a few overloaded lessons. A lesson should solve one problem, teach one skill, and take about 2-5 minutes to complete. Split anything larger.

Good course structure:

- 8-20 short lessons for a substantial topic.
- 1 primary objective per lesson.
- 1-2 key concepts per lesson.
- Frequent practice instead of long explanation.

**Scene count is an outcome, not a target.** Never plan toward a scene number — plan toward complete coverage, and let the count land wherever the content puts it. A lesson is the right length when:

- every must-know concept of the lesson (after the didactic reduction in section 2) actually appears — nothing gets cut just to keep the lesson short;
- every nugget has its immediate interaction directly after it (the no-theory-without-practice rule in section 6), and the reinforcement moments from section 8 have their scenes — practice and checks are never the scenes you drop to save length;
- every scene still passes `scene-content`'s hard limits (one task per scene, no headings, at most 1-2 setup sentences).

If those three hold, 6 scenes is a fine lesson and 16 scenes is a fine lesson. What scene count *does* signal: a flow that keeps growing past what one objective needs usually means the lesson has quietly picked up a second objective — split it into two lessons rather than trimming interactions. And a 12-scene lesson of 12 trivial taps is still worse than 5 well-designed scenes: the didactic reduction decides what earns a scene, never the desire for a bigger number.

## 4. Course Style (from `discovery`)

Apply the style captured during discovery:

- **Duolingo-style** (default): many small beats — mandatory Guide Character, frequent short interactions, minimal explanatory text per scene. Naturally produces more, shorter scenes; that's a consequence of the beat size, not a count to hit.
- **General microlearning**: fewer, denser beats — Guide Character optional, allow more explanation or a short video ahead of an interaction. Still outcome-driven and still short — this is not permission to write long-form text dumps, it is permission to not force every idea into a flashcard when the content genuinely needs a beat more explanation.

**This branch is experimental.** If the user hasn't specified, default to Duolingo-style and note the assumption; do not silently invent a third style.

## 5. Apply Microlearning Principles

- **One objective per lesson.**
- **Minimize cognitive load**: small chunks, clear language, few concepts per lesson, gradual progression.
- **Teach only what matters**: critical decisions, common mistakes, practical application, realistic scenarios.
- **Active learning over passive consumption — with a hard ratio**: the learner should spend most of the lesson *doing*, not reading. Plan at least **two thirds of each lesson's scenes as interactive** (practice, retrieval, decisions, sorting) rather than consuming (explanations, media, guide exposition). If a draft lesson plan is mostly nugget scenes, it is a reading assignment with quizzes sprinkled in — restructure it so concepts are learned *through* the tasks.
- **Active production over recognition**: the strongest scenes make the learner *build* the answer (assemble a word bank, sort situations, type the missing step) instead of recognizing it in a list. Plan most practice moments as production tasks; recognition (multiple choice) is for genuine either/or decisions.
- **Transfer tasks that build on each other**: for each must-know concept, plan an escalating chain — retrieve it, apply it in a near situation, then transfer it to a situation with a complication (conflicting rule, missing information, time pressure). The chain spans lessons via the repetition schedule in section 8.
- **Retrieval practice**: ask learners to recall, choose, apply, and explain throughout the lesson, not only at the end.
- **Mastery before complexity**: a concept earns a harder task only after an easier one on the same concept. Never open with Analyze-level practice on an idea the learner hasn't retrieved once — the ladder in section 7 is a sequence, not a menu.
- **Immediate feedback**: explain why answers are correct, why incorrect options are wrong, and what principle to remember — in the block's own feedback field the second after answering, not in a summary scene at the end.
- **Reward loop**: points (`sp`) scale with cognitive level, so harder thinking visibly earns more. The lesson should feel like a run of small wins, not an exam.

## 6. Sequence for App-Like Learning

Use a rhythm that feels like modern learning apps:

- **Hook**: a concrete problem, decision, mistake, or scenario — often delivered by the guide character.
- **Nugget**: a small explanation, example, image, or video.
- **Practice**: a question, decision, categorization, or applied interaction.
- **Feedback**: explain the reasoning and correct misconceptions.
- **Reinforcement**: revisit the key idea later in a new context.

**Hard rule — no theory without immediate practice.** Every scene that delivers learnable content (a nugget in any form: explanatory text, guide exposition, video, audio, infographic, worked example) must be **directly followed** by at least one interactive scene that retrieves, applies, or transfers *that scene's* content — not a generic interaction on something else, and not "practice comes three scenes later." Consuming without immediately doing is how content fails to stick; the interaction right after is what encodes it. Consequences:

- **Never two theory scenes in a row.** If the content needs two nuggets, the first one gets its interaction before the second one starts. If one interaction can't cover the nugget, the nugget is too big — split it (per the didactic reduction), don't stack it.
- The follow-up interaction can *teach through the task* (a cloze whose gaps reconstruct the rule just shown, a sort whose zones are the categories just introduced) or *intensify* (a transfer task applying the idea to a new situation) — both count; passive re-reading does not.
- Hooks and feedback beats are not theory: a hook poses a problem without delivering content, a feedback beat reacts to an interaction that just happened. They may sit next to other scenes freely — but they can't be used to smuggle a second exposition beat between a nugget and its practice.

Every lesson should include recall, decision, application, or practice. If a lesson only delivers information, redesign it.

## 7. Question-Level Ladder (Transfer, Not Trivia)

**This is the highest-priority quality bar for the whole course.** Quiz content frequently drifts toward testing irrelevant source details (an exact percentage, a specific date) instead of whether the learner can actually use what they learned. Assign a deliberate cognitive level to every practice moment, tied to where it sits in the rhythm/reinforcement cycle:

| Moment | Level | What it tests |
| --- | --- | --- |
| Immediate retrieval (right after the nugget) | Remember / Understand | Can the learner recall or recognize the concept just introduced. |
| Near reinforcement (1-3 lessons later) | Apply | Can the learner use the concept in a new, still-simple situation. |
| Later reinforcement / course-ending assessment | Analyze / Evaluate | Can the learner judge, decide, or spot the mistake in a realistic scenario. |

**Concrete rule:** if a source gives a specific number, date, or statistic, that fact becomes supporting content inside an explanation or scenario — it does not become the question itself. Test whether the learner can act on the underlying point, not recall the figure.

Good: "A customer requests deletion of personal data. What should you do first?"
Bad: "What percentage of requests must be resolved within 30 days?" (when the source only mentions this as one supporting detail)

Never place two practice moments at the same cognitive level back to back — vary level the same way `scene-content` varies block type.

## 8. Plan Spaced Repetition

Spaced repetition here means **within-course repetition at expanding intervals** — the same concept resurfacing later in the course, each time after a longer gap and in a harder or different form. It does not mean a time-delayed reminder days after the learner finishes (that would require the product to re-contact a learner after completion, which is a platform/notification feature, not something this skill or the chat-based authoring flow can produce).

**Every must-know concept gets a repetition schedule with expanding gaps**, planned before authoring starts:

- **First exposure**: introduce the idea simply.
- **Immediate retrieval**: recall or apply it within the same lesson (gap: minutes).
- **Near reinforcement**: revisit 1-3 lessons later, in a different block type and a new scenario (gap: one session).
- **Far reinforcement**: bring it back near the end of the course or in a review lesson, at Analyze/Evaluate level (gap: several lessons).
- **Escalation, not repetition**: each revisit must be harder or in a newer context than the last — retrieval, then near application, then transfer with a complication. Re-asking the same question in new words is not spaced repetition, it is padding.

**Review lessons are part of the structure, not optional.** For courses of 6+ lessons, plan a dedicated review lesson roughly every 4-6 lessons plus one before the course ends. A review lesson contains no new concepts: it interleaves the must-know concepts of the preceding lessons in mixed order (interleaving beats blocked review), in different block types than their first exposures.

Prioritize repetition for high-risk misconceptions, frequently forgotten facts, common workplace mistakes, and concepts that affect safety, compliance, or performance. `review-check` will verify each must-know concept actually reappears on this schedule — do not treat this section as optional.

## 9. Gold Example: One Duolingo-Style Lesson Arc

A reference shape for a ~3 minute lesson ("Handling data deletion requests", guide character: coach). Scene names below are metadata titles for navigation — the scene *content* never contains headings or topic introductions; each scene is one bare task or one guide beat that assumes the previous scenes happened. The rhythm cycles hook → nugget → practice → feedback twice, block types never repeat back to back, and the figure from the source (30 days) appears only inside scenario text:

| # | Scene (metadata title) | Rhythm role | Content is exactly | Level |
| --- | --- | --- | --- | --- |
| 1 | A customer wants to disappear | Hook | Guide beat: coach poses the situation | — |
| 2 | Verify first | Nugget | Image + one-line caption: the verify-before-delete rule | — |
| 3 | Right to erasure | Immediate retrieval | Flashcard: term ↔ meaning | Remember |
| 4 | Your first move | Practice | Multiple choice: what do you do first? | Apply |
| 5 | Why verification wins | Feedback | Guide beat: one-sentence takeaway | — |
| 6 | The clock | Nugget | Guide beat: what starts the 30-day window | — |
| 7 | When does it start? | Retrieval | Cloze: the clock starts when the request ___ | Remember |
| 8 | Now or never | Practice | Drag-and-drop: "do immediately" vs "never without verification" | Apply |
| 9 | The edge case | Stretch practice | Multiple choice: requester can't verify identity | Analyze |
| 10 | The decision path | Reinforcement | Guide beat: coach recaps in two sentences | — |

What makes this the target: 7 of 10 scenes are interactive or guide-driven with zero exposition paragraphs; every information beat is followed within 1-2 scenes by practice on that exact idea; no scene has more than one task; levels climb across the lesson (Remember → Apply → Analyze); the concept from scene 2 is scheduled to reappear 1-3 lessons later in a different block type (per section 8); and the lesson works as a standalone repeatable unit while no single scene has to.

## 10. Coach SMEs Toward Better Learning

Subject matter experts often include too much information, focus on completeness, explain instead of teach, and overestimate prior knowledge. Help them simplify, prioritize, chunk content, convert explanations into activities, and turn information into decisions and scenarios.

Optimize for learning outcomes, retention, engagement, practical application, and simplicity. A shorter course that changes behavior is better than a longer course that merely delivers information.

## Hand-off

- Ready to write actual scene HTML/interactions → load `scene-content`.
- Ready to start creating lessons/scenes in the app → load `batch-flow`.
- Auditing an existing course → load `review-check` directly; you do not need `discovery` or `batch-flow` for a pure review.
