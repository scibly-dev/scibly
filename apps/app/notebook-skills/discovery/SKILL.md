---
name: discovery
description: Interactive requirements-gathering at the very start of building or restructuring a course. Ask the SME targeted onboarding questions with askMultipleChoice, capture the course's target style (Duolingo-style microlearning vs. general microlearning), and confirm the course structure with proposePlan before any lesson or scene gets created. Use whenever the user wants to create a new course, redesign an existing one from scratch, or hasn't yet defined target audience, outcomes, or course style. Load lesson-design right after for the actual pedagogical structure, and batch-flow when execution begins.
---

# Discovery

Use this skill before any structural design work. The goal is to gather just enough context to design well, then hand off to `lesson-design`.

## 1. Ask Before Designing

Do not design a course from thin context. Start by asking targeted questions that improve learning quality, then use the user's answers to propose a course plan. If sources, existing course structure, lessons, or scenes are available through tools, inspect them before recommending major changes.

**Use `askMultipleChoice` for structured discovery.** When you need one of a few known answers, use clickable options instead of asking the user to type a long reply.

- **At the start of course creation**, when you have 2-8 onboarding questions, call `askMultipleChoice` once in **batch mode** with a `questions` array. The user answers them back-to-back in one wizard, then you continue.
- **For a single follow-up later**, use single-question mode with `question` + `options`.
- Ask one focused topic per question. Wait for the answer(s) before continuing. Use free-text chat only when the answer is genuinely open-ended.

Ask only the questions that matter for the current task. Good questions include:

- Who are the learners, and what do they already know?
- What should learners do differently after the course?
- Where do learners usually make mistakes?
- Which concepts are business-critical, safety-critical, compliance-critical, or frequently forgotten?
- How much time should a learner spend per lesson and per course session?
- Is this onboarding, compliance, product training, performance support, or skill practice?
- Are there required source documents, policies, videos, images, or existing lessons to preserve?
- What must be assessed, and what would count as success?

## 2. Capture the Course Style

**This is an experimental question — the product currently only fully supports Duolingo-style microlearning, but we are testing whether a lighter "general microlearning" mode produces better results for denser, more formal content (e.g. compliance).** Ask it as one of the batch onboarding questions:

- **Duolingo-style microlearning** (default): mandatory Guide Character from scene 1, short punchy scenes, frequent bite-sized interactions. Best for skill practice, product training, anything that benefits from playful pacing.
- **General microlearning**: Guide Character optional, scenes may carry more explanation or a short video before an interaction, still short and outcome-driven but not forced into the Duolingo mold. Best for dense compliance/policy content where oversimplifying risks losing accuracy.

Pass the answer forward explicitly when handing off — `lesson-design` branches its structural rules on this.

## 3. Propose and Confirm the Plan

After asking, summarize the design assumptions (including the chosen course style) and invite correction before creating many lessons or scenes. When the user gives feedback, revise the plan instead of defending the first draft.

**Use `proposePlan` before major structural work.** When you have a concrete multi-step plan — course outline, lesson sequence, refactor strategy — call `proposePlan` with a clear title, optional summary, and numbered steps. Wait for the user to confirm, reject, or adjust the plan before executing it.

- **Course structure:** propose lessons/modules as steps before calling `createCourse`, `createLesson`, or bulk scene creation. Make each step name a specific lesson and its scene count, not just "build the course" — `review-check` later re-derives this plan from the conversation to confirm everything was actually built, so a vague plan makes that check unreliable.
- **Other workflows:** use the same tool for content rewrites, migration plans, or phased edits.
- If the user **confirms**, load `lesson-design` and hand off to it, then `batch-flow` for execution.
- If the user **rejects**, ask what direction they prefer (use `askMultipleChoice` when helpful).
- If the user **adjusts**, follow their revised steps and notes — do not ignore edits.

## Hand-off

- Confirmed plan + course style → load `lesson-design` to turn it into outcomes, lesson structure, and reinforcement plan.
- Ready to start creating lessons/scenes → load `batch-flow` for the execution cadence.
