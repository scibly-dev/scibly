---
name: scene-content
description: Micro-level scene authoring — write, edit, ground, refresh, and inspect course-builder scene content with editor and source tools. Covers schema-valid HTML, scene length limits, guide-character voice, block-type selection and anti-bias question authoring, formatting, and writing that doesn't read as AI-generated. Use this whenever the user asks to write, update, rewrite, improve, insert, replace, inspect, source-ground, or refresh scene content, including outdated scenes after source changes. Load this before using searchNotebookSources, getEditorSchema, getSceneContent, insertContent, createScene, updateScene, setSceneLineage, getOutdatedScenes, or deleteScenes. For which cognitive level a question should target, or how many scenes a lesson should have, load lesson-design instead — this skill assumes those decisions are already made.
---

# Scene Content

Micro-level: turning an already-decided idea (one must-know concept, one cognitive level, one block type) into an actual valid scene. This is where source content gets transformed into an explanation or example, and where the actual copy gets written. For macro decisions (what to teach, how much, at what level) load `lesson-design`.

## Core Rule

`insertContent` replaces the full scene HTML. For a targeted edit, first read the existing scene, preserve the parts that should remain, and write a complete replacement HTML document fragment.

## Required Workflow

1. **Load the editor schema**: call `getEditorSchema` before writing HTML. Use only tags and attributes allowed by the returned schema — it is the source of truth, not memory of past examples.
2. **Read before editing**: call `getSceneContent` before modifying an existing scene. It returns live scene HTML and existing `sourceIds`.
3. **Plan the replacement**: decide what to preserve, remove, add, or rewrite. Keep the user request narrow unless they asked for a full rewrite.
4. **Write valid full HTML**: call `insertContent` with the complete replacement HTML, not a diff or partial snippet.
5. **Preserve lineage**: pass still-relevant prior `sourceIds` plus any new source IDs used for new content.
6. **Handle warnings correctly**: if `insertContent` succeeds but returns `lineageWarning`, call `setSceneLineage` with the same `sceneId` and `sourceIds`. Do not call `insertContent` again.

## Schema Validity Is Non-Negotiable

An invalid or half-empty block reaching a learner is a build failure, not a cosmetic issue. Before every `insertContent`, run this validation pass on your draft HTML — mentally, line by line, every time:

1. **Every tag and attribute exists in the schema you just loaded.** If you are not certain a tag is allowed, it isn't — omit it or re-read the schema.
2. **No block is a skeleton.** Every interactive block must be fully populated at insert time: no empty arrays, no empty `label`/`text`/`content` strings, and no faces or sides without content. There is no "fill it in later" — a block with empty required content must never be inserted.
3. **Matching pairs get an explicit completeness check** (this block has shipped empty before):
   - `questionData.pairs` is non-empty and every pair has BOTH a left and a right value with real content.
   - Every `matching-pair` row contains two `matching-pair-side` divs (`data-side="left"` and `data-side="right"`), each with actual content inside — never an empty side.
   - `rightColumnOrder` covers every right item.
4. **All internal IDs resolve.** Every `correctChoiceIds` entry names a real choice, every cloze `correctItemId` names a real word-bank item, every drag-and-drop mapping names a real item and zone.
5. **`questionblock-data` parses as JSON.** Single-quoted attribute, unescaped double quotes inside, no trailing commas, no comments.

If `insertContent` rejects the HTML, do not blindly retry: re-read the error, re-check against `getEditorSchema`, fix the specific violation, and only then re-insert. Two consecutive validation failures mean you are guessing at the schema — stop and re-read it in full.

## Scene Targeting

- `getSceneContent` and `insertContent` can target the active scene when `sceneId` is omitted. Pass `sceneId` when reading or editing a non-active scene.
- Use `listScenes` when you need scene IDs for a lesson before editing multiple scenes.
- Every draft lesson starts with a default empty **Introduction** scene at order 0. After `createLesson`, call `listScenes` and use `insertContent` on that scene for the lesson opener — do not call `createScene` for the first scene unless you intentionally need a second one.
- Use `createScene` only to add scenes **after** the Introduction. After it returns the new scene ID, call `insertContent` with that `sceneId` to write content.
- Use `updateScene` for metadata such as title, vibe, design, animation, or type. Use `insertContent` for scene body content.

## Source Grounding

- Consult the source material before answering source questions or writing source-grounded content. Your context either quotes the sources in full or describes each one and gives you `searchNotebookSources` / `readSource` to reach the text — the "Source material" section says which.
- When you do search, search for terms, not topics. Good query: "GDPR data deletion request first step policy". Bad query: "GDPR".
- Never invent or guess source facts. If the material does not cover it, say so and ask the user to upload, connect, or clarify source material.
- Pass `sourceIds` to `insertContent` — every source you actually drew on. When editing existing content, keep prior `sourceIds` only for content that remains accurate and relevant.
- If the tool returns `groundingWarning`, the scene was written but is not grounded — prefer correcting this by re-reading the material and rewriting with `sourceIds`.

## Outdated Scene Workflow

Use this workflow when draft scenes are marked outdated, amber badges are shown, source material changed, or the user asks whether a course is still current after a re-sync.

Always call `getOutdatedScenes` first — it is the authoritative check. Do not claim a course is up to date while it returns outdated scenes.

For each outdated scene: call `getSceneContent`, look up its topic in the source material as it stands now, compare the current HTML against that, then decide:

- **Regenerate** when the material still covers the topic, or wording/requirements changed but the topic still exists. Preserve scene ID, order, title, vibe, design, and SP unless asked to change them. Call `getEditorSchema`, then `insertContent` with complete replacement HTML and the `sourceIds` you used. Do not call `createScene` to replace an outdated scene.
- **Suggest deletion** when the source material no longer covers the topic at all.

When removing unsupported content: call `listScenes` first. If the lesson has only one scene, call `deleteLessons` instead of `deleteScenes`. Otherwise call `deleteScenes` once with every scene ID, a shared `reason`, plus `title`/`lessonTitle`/`lessonId` for the confirmation UI. Pass all IDs in one call — never multiple separate deletion calls. If `success: false`, re-fetch IDs via `listScenes`/lessons and retry.

Never clear outdated flags with `setSceneLineage` unless the scene body was just rewritten with `insertContent`. Lineage alone does not prove the content was updated.

## A Scene Is One Task, Not a Page (Strict)

**The lesson is the smallest self-contained learning unit — a scene is one beat inside it.** Like a single Duolingo screen: the learner sees one thing to do, does it, and moves on. A scene alone does not need to explain itself fully; it relies on the scenes before it. Design the flow at lesson level (`lesson-design`), then make each scene the smallest possible step of that flow.

Before calling `insertContent`, check the draft against these limits — regardless of how many scenes the lesson has in total:

- **One task per scene**: one interaction, one guide-character beat, or one media nugget. Not "a topic with an exercise attached".
- **No headings** (`h1`-`h6`) inside scene content. The scene IS the task, not a chapter. If framing is needed, one short plain sentence or the guide character does it. (The scene *title* in metadata is for navigation; it does not belong in the content HTML.)
- **At most 1-2 short setup sentences** before an interaction — often zero is right. Or **one list with at most 3 items** when the list itself is the nugget.
- **At most one media or one interaction block** per scene.
- **No re-explaining**: never restate context the previous scene already established. Trust the flow.
- **No reference dumps**: if source material lists many facts/places/steps, split across multiple scenes or convert to flashcards, cloze, or drag-and-drop instead of one bullet-heavy scene.

Preferred scene shapes: one interaction block with a one-line prompt (or none); one guide-character beat; one image or video with a one-line caption; one flashcard.

### Avoid Plain-Text-Only Scenes

Do not ship scenes that are only paragraphs with no interactive, media, or guide element. When text carries the message, put it in the Guide Character's mouth, pair it with an image or video, or replace the exposition with an interaction. Interactivity is the default state of a scene, not the exception.

### Watch for Documentation Disguised as Microlearning

Every rule above can pass — schema-valid blocks, an interaction after every nugget, no guide-only chain — while the lesson is still just a feature manual cut into taps. This happens when content is organized around a single tool or feature rather than around a decision. If 3 or more scenes in a row all describe the *same one thing* from different angles (what it does, how to configure it, its limits, its price, its shortcuts), stop and ask: **is there a decision here, or am I just describing this exhaustively?**

A lesson about several tools should mostly ask "which one, for this situation" — not "everything about tool A, then everything about tool B." If you cannot name a concrete "given this situation, which do you pick" moment the scenes are building toward, the content belongs in reference documentation, not a course: cut it down to the one decision that actually matters and drop the rest, per the didactic reduction in `lesson-design`.

### Every Theory Scene Is Followed by Its Own Interaction (Strict)

Whenever a scene delivers content the learner is supposed to retain — explanatory text, a guide beat that explains rather than reacts, a video, audio, or infographic — the **very next scene must be interactive, and its task must be about that content**: retrieve it, apply it, or transfer it to a new situation. Not an unrelated question, not "we'll practice it at the end." The interaction immediately after is what makes the content stick; a theory scene without one is an **orphaned nugget** and a build error, not a style choice.

Before inserting any theory scene, know what its follow-up interaction is. If you can't name the retrieval or transfer task it sets up, the scene is delivering content nobody will be asked to use — cut it or fold its point into an interaction that teaches through the task itself (a cloze reconstructing the rule, a sort over the categories just shown). Never insert two theory scenes back to back; hooks and post-practice feedback beats don't count as theory, but they also can't be used as spacers between a nugget and its practice.

### Guide-Only Scene Cap (Strict)

The rule above stops two *theory* scenes from sitting back to back — it does not stop a chain of guide-character scenes that individually all qualify as non-theory (a hook, then a feedback beat, then a bridging hook into the next idea). Three guide bubbles in a row is a monologue to the learner no matter how the rhythm roles are labeled internally. **No more than 2 consecutive guide-character-only scenes, full stop** — regardless of whether each one is a legitimate hook, feedback, or bridge on its own.

If a flow genuinely needs three guide moments close together, do one of two things: insert a short interaction between them (even a single-tap retrieval breaks the chain), or merge two of the beats into one scene — a hook and the feedback that follows a *different* interaction can often share one guide bubble instead of two.

## Guide Character

Every course uses a **Guide Character** — `sage`, `spark`, `coach`, `buddy`, or `pro` — chosen once during `lesson-design`'s discovery hand-off and kept for the whole course. Your job here is consistency of the actual copy:

- Introduce the guide in the very first scene of the course.
- Keep the same vocabulary, sentence length, and personality for that character every time it speaks — a `buddy` scene and a `sage` scene should not read interchangeably.
- Use the guide for hooks, tips, encouragement, and transitions — not only the intro.
- **The guide also frames explanation media.** When a scene carries a flashcard, infographic, or video, the guide introduces or comments on it — either a one-line guide beat in the scene before, or the media nested inside the guide's speech bubble (the schema supports media and flashcards inside the bubble). A learner should never meet an infographic or flashcard that just appears with no voice around it. The character lives in the scene HTML, never inside the generated image itself (see `educational-visuals`).
- **Vary `data-layout` deliberately.** The schema offers `left`, `right`, `top`, and `inline`. Do not park the character on one side for the whole course — switch position with the situation: e.g. `left` as the default conversational beat, `right` when reacting to something the learner just did, `top` for a framing moment before a big interaction, `inline` for a quick aside. Two consecutive guide scenes should not use the same layout.
- In **general microlearning** style (see `lesson-design`), the guide character is optional; if omitted, keep tone consistent through the Voice Contract below instead.

## Choosing a Block Type

Call `getEditorSchema` before choosing a block — it is the source of truth for which interaction blocks exist, their `data-type` values, and required attributes. **Do not default to multiple choice** and do not hardcode block names from memory.

**Active production beats recognition.** Duolingo's core mechanic is that the learner *builds* the answer (assembling words, filling gaps, sorting items), not just recognizes it in a list. Blocks where the learner produces or assembles (cloze with word bank, drag-and-drop, matching pairs, input field, free-form) create deeper learning than recognition-only multiple choice. Reserve multiple choice for genuine decision scenarios where picking between plausible actions IS the skill.

The four task formats, mapped to blocks:

| Task format (what the learner does) | Learning goal | Block |
| --- | --- | --- |
| **Reconstruction** — assemble the answer from given parts | Rules, sequences, key phrases | Cloze text with word bank |
| **Transfer** — apply an idea to a new situation | Decisions, judgment calls | Multiple choice (scenario), drag-and-drop (situations → responses) |
| **Gap fill / production** — type or place the missing piece | Terms, steps, names | Input field, cloze |
| **Active recall** — retrieve or explain without cues | Definitions, reflection | Flashcard, matching pairs, free-form input |

**Diversity rule:** across a lesson, use at least 2 different block types. Use multiple choice at most once per lesson unless the user explicitly wants quiz-heavy content. When revisiting a concept for spaced reinforcement, use a **different** block type than first exposure. If the schema offers several blocks for the same goal, prefer one not yet used in this lesson.

**Don't let block types go extinct.** Across a course, every suitable block type should appear somewhere. The **input field** is the most commonly forgotten one — yet typing the term, step, or number yourself is the strongest production task there is. Use it whenever recalling and *producing* the exact word or step is the skill (key terms, first steps, thresholds the learner must know cold), at least every couple of lessons. **Adding it must not push cloze out** — they test different things (cloze: reconstruct within a given structure; input field: produce with no structure at all) and a lesson that swaps one for the other has not gotten more diverse, only relabeled.

**An input field's or free-form field's expected answer must be vocabulary the learner has already met in this lesson** — a word or phrase that appeared in an earlier scene's nugget, guide beat, or gap, never a term you assume the learner independently knows or infers. Before setting `questionData.answer`, locate the exact scene where that word was introduced; if you cannot point to one, the lesson never taught it and the field is unwinnable through no fault of the learner's. If the concept has no established name yet, use cloze with a word bank instead — there, the correct label is at least visibly present as one of the options.

### Question Scenes Need a Clear Prompt

Every question block needs a clear task: either the question lives inside the block's own config, or one short plain sentence above it sets the scene ("A customer emails you. What now?"). Never a heading, never a paragraph of context — the scenes before this one already built the context.

### Flashcard Formatting

A flashcard has exactly two faces (`data-type="flashcard-face"` with `data-position="front"` and `"back"`). One card per scene.

- **The front must carry context — never a bare term.** A front that just says "Verification" gives the learner nothing to retrieve against. Phrase the front as a question, prompt, or mini-situation ("A deletion request arrives. What's your first step?"), and the back as the compact answer. Test: could someone who knows the material answer from the front alone? If the front is one context-free word, they can't.
- **Faces hold block content — use it.** A face can contain an image plus a short line: a front with a diagram or screenshot and "What's wrong here?" is a stronger card than text alone.

### Right-Sized Interactions

A one-gap cloze or a two-item drag-and-drop is a tap, not an exercise. Except for multiple choice (one question per block), size each interaction so it carries real retrieval effort while staying one task:

- **Cloze**: 2-4 gaps in one connected sentence or short passage. The gaps together reconstruct one rule or sequence — not four unrelated facts.
- **Drag-and-drop**: 4-6 items across 2-3 zones.
- **Matching pairs**: 3-5 pairs per block, all serving one concept (e.g. situations → correct responses) — never a grab bag of unrelated facts.
- **Input field**: one field is fine when producing the answer is the point; embed it in a sentence so typing completes a thought.

"One task per scene" limits the number of *blocks*, not the substance inside the block. Multiple gaps, items, or pairs that all serve the same idea are still one task.

### Combining Blocks

The schema allows nesting, and good scenes use it: flashcard faces, matching-pair sides, and the guide character's speech bubble all hold rich block content (text, images, math, audio — the bubble even holds flashcards and questions). Combine deliberately:

- An image inside a flashcard face turns a definition card into a "read the situation" card.
- A flashcard or short interaction inside the guide's bubble makes the guide *hand* the learner the task instead of the task floating context-free.
- An image on one side of a matching pair ("match the warning sign to the risk") beats text-text matching for anything visual.

A combined block still counts as the scene's one task — combination adds richness inside the beat, never a second beat.

### Explain Technical Terms

Define every technical term or acronym the first time it matters for a decision. For a lesson introducing several new terms, add a brief glossary moment (guide-character intro, compact list, or note-style block). Reinforce business-critical or commonly confused terms with a flashcard or cloze, not only a prose definition.

## Question Authoring Recipe (Mandatory)

Never write a question directly from a source fact. Follow these steps in order, every time:

1. **Name the job moment first.** Before writing anything, state (to yourself) the on-the-job decision, mistake, or situation this question tests. If you cannot name one, the concept is trivia — do not write a question about it; put the fact inside an explanation instead.
2. **Write the scenario, then the question.** Open with a concrete second-person situation ("A customer emails you asking to delete their data...") and ask what the learner should do, decide, or spot. The question tests the decision from step 1, at the cognitive level `lesson-design` assigned to this moment.
3. **Numbers, dates, and statistics go in the setup, never in the answer.** If a source gives "30 days" or "83%", that figure may appear in the scenario text as context. The correct answer must be an action or judgment, not the figure itself.
4. **Build each distractor from a named misconception.** For every wrong option, name the real mistake it represents (e.g. "forwards it to IT because they think deletion is a technical task"). If you cannot name the misconception, the distractor is filler — replace it.
5. **Write feedback that teaches.** Explain why the correct action is right and which misconception each distractor reflects. One short guide-character reaction plus one sentence of reasoning.

**Self-check before inserting:** Would a person who never read the source but does this job well get it right? They should. Would a person who memorized the source but can't apply it get it right? They should not. If either check fails, rewrite.

### Depth Bar (No Surface Questions)

A question that any attentive reader answers correctly on first contact without thinking is below the bar. Every question must make the learner *do* cognitive work: weigh two plausible actions, spot the flaw in a realistic setup, transfer a rule to a situation the source never mentioned. Concretely:

- **No questions answerable from the question text alone** (the answer restated in the stem, or only one option that is even on-topic).
- **At least one distractor must be genuinely tempting** — something a reasonable colleague might actually pick. If all distractors are obviously wrong, the question is decoration, not practice.
- **Build transfer chains that escalate.** When a concept gets multiple practice moments (per `lesson-design`'s reinforcement plan), each later task must be harder or in a newer context than the last: first retrieval, then application in a near situation, then transfer to a situation with a complication (conflicting rule, missing information, time pressure). Never re-ask the same difficulty twice in new clothes.
- **Complications make depth.** The best Apply/Analyze questions contain one realistic wrinkle: the requester can't verify identity, two rules conflict, the obvious move has a hidden cost. A scenario without friction tests reading, not judgment.

**Before writing any Apply/Analyze question, name its complication in one sentence first** — literally state it to yourself: "the wrinkle here is ___." If you cannot fill in that blank, you do not have a transfer question yet, only a dressed-up recall question — go find the wrinkle (a conflicting rule, missing information, time pressure, a plausible reason the obvious answer is wrong) before writing the scenario. This is the step that gets skipped under time pressure; treat it as mandatory, not aspirational.

### Transfer vs. Recall — Worked Examples

The self-check above is the test; these are what passing and failing it actually look like, across different block types. In every "Good" version, the source fact survives only as scenario detail — the thing being scored is a decision, a judgment, or an application, never a fact played back.

**Multiple choice**

- Recall (fails the self-check — a person who memorized the source passes, a person who understands verification but forgot the number fails): *"How many days does a company have to respond to a data deletion request?"* A) 14 B) 30 C) 60 D) 90
- Transfer (passes — tests whether the learner acts correctly under the constraint, not whether they remember it): *"A deletion request arrives. The requester's identity is unconfirmed and the 30-day clock is already running. What do you do first?"* → correct: verify identity even though it costs time; distractors: delete immediately (misconception: speed beats verification), escalate to legal before doing anything (misconception: this is not an edge case), ask the requester to resubmit in writing (misconception: form matters more than the deadline).

**Cloze / fill-in-the-blank**

- Recall (fails — tests memorized vocabulary, not judgment): *"The GDPR's right to erasure is defined in Article ___."* (answer: 17)
- Transfer (passes — tests recognizing when a rule applies, not naming the rule): *"A former customer asks you to delete records you also need for an active tax audit. You can refuse the deletion because the right to erasure ___ when a legal retention obligation exists."* Word bank: "does not apply" (correct), "still applies" (misconception: erasure always wins), "must be escalated" (misconception: conflicts always go up). The learner has to reason about a conflict, not recite a clause number.

**Drag-and-drop / categorization**

- Recall (fails — sorting terms into categories the source already labeled): drag GDPR articles (Art. 15, 17, 20) into "Access", "Erasure", "Portability" buckets — this is matching labels, not deciding anything.
- Transfer (passes — sorting situations by the correct response, which requires judgment): drag five realistic request scenarios ("customer requests full deletion", "employee requests their own HR file", "requester can't prove identity", "law requires the data be kept", "duplicate request from last week") into "Action immediately", "Verify further", "Refuse with reason" — each placement is a decision the learner has to reason through, not a fact lookup.

**Diagnosing your own draft:** if you could answer the question correctly by re-reading the source paragraph one more time without ever having done the job, it is recall — rewrite it as a situation instead of a fact lookup.

### Anti-Bias Rules (Mandatory Position Check)

These prevent a learner from gaming the question instead of demonstrating the skill. LLM-generated quizzes have two notorious tells — the correct answer is the longest option, and the correct answer sits in the same slot (often B, the same word-bank slot, or first-listed). Both must be actively counteracted, not just avoided by luck.

**This check applies to every block with an ordered array of options — not only multiple choice.** MC choices, cloze word-bank items, drag-and-drop items, matching-pairs rows: all of them. It is the block type you are using for the *first time* in a lesson where this gets skipped, precisely because the habit of checking only formed around multiple choice. Do not let unfamiliarity with a block be an excuse to skip the check.

Run this as the literal last step before every `insertContent` call for such a block, not a vague background awareness:

1. Find the correct item/answer in the array you just wrote.
2. Check its position: is it first, last, or in the same slot as the correct answer in this lesson's most recent block of the same type? If yes, physically move it.
3. Check its length against the other items: is it the longest? If yes, either shorten it or lengthen a distractor to match — do not leave it as the longest.

- **Track correct-answer positions across the lesson.** Across a lesson, every position should be used; no slot may hold the correct answer in more than half the questions of that block type.
- **Length parity is a hard check.** The correct option must not be the longest in more than a third of the lesson's questions. If your correct answer needs more words to be right, add the same specificity to the distractors — do not shorten the correct answer into vagueness.
- **Cloze word banks and matching pairs are not exempt.** The correct item must not always be first or the longest label in the word bank; in matching pairs the right column must be shuffled via `rightColumnOrder`, never aligned with the left.
- **Distractors match the correct answer in tone and register.** If the correct answer is written carefully and the distractors read like throwaways, the giveaway is stylistic, not positional.

### QA and Interactive Block Authoring

For any schema-marked question/interaction block:

- Use the exact tag, `data-type`, and attribute names from `getEditorSchema` — never guess or copy examples from this skill verbatim.
- Wrap `questionblock-data` in SINGLE quotes with unescaped double quotes inside the JSON — never double quotes with backslash-escaped internals.
- Set `sp` deliberately: default 10 for Remember-level retrieval, raise it (15-20) for Apply/Analyze scenarios so harder thinking earns more. Points are the lesson's reward loop — make them track effort.
- In cloze blocks, every gap's `correctItemId` must point to a real word-bank item; extra unlinked items are the distractors and should be misconceptions, not random words.
- Leave learner answer fields empty. Do not prefill answers, achieved points, or scores.
- Size every block per the Right-Sized Interactions rules above — no one-gap cloze, no two-item drag-and-drop, no single-pair matching block.

## Gold Examples

These use the real schema shapes (root `<div>` wrapper, `questionblock-data` in SINGLE quotes with unescaped double quotes inside). Still call `getEditorSchema` first — it is authoritative if anything here drifts. Note what is absent in every good example: headings, topic introductions, context paragraphs. Each scene assumes the previous scenes happened.

### Example 1 — A three-scene chain (guide sets up → learner acts → guide reacts)

**Scene A** (guide character opens the situation — nothing else):

```html
<div>
  <div data-type="custom-guide-character" data-character="coach" data-layout="left">
    <p>An email just landed: "Delete everything you have about me." The 30-day clock is ticking. Let's see what you'd do.</p>
  </div>
</div>
```

**Scene B** (only the task — the context came from Scene A, so none is repeated; the correct choice is not first and not the longest):

```html
<div>
  <p>What do you do first?</p>
  <div data-type="custom-multiple-choice" questionblock-data='{"optional":false,"questionData":{"choices":[{"id":"c1","text":"Delete the CRM entry immediately so the deadline is safe"},{"id":"c2","text":"Confirm the requester's identity before touching any data"},{"id":"c3","text":"Forward it to IT since deletion is a technical task"},{"id":"c4","text":"Reply asking why they want their data deleted"}],"correctChoiceIds":["c2"],"allowMultiple":false},"sp":10}'></div>
</div>
```

**Scene C** (guide gives the one-sentence takeaway, then the flow moves on — note the layout switched sides, since the coach is now *reacting* rather than opening):

```html
<div>
  <div data-type="custom-guide-character" data-character="coach" data-layout="right">
    <p>Verification always comes first. A deletion you can't undo for the wrong person is worse than a missed deadline.</p>
  </div>
</div>
```

### Example 2 — Pure interaction scene: reconstruction with a word bank (zero setup text)

The learner *builds* the answer from parts — active production, Duolingo's core move. The distractor items in the word bank are misconceptions, not random words:

```html
<div>
  <div data-type="custom-cloze-text" questionblock-data='{"optional":false,"questionData":{"segments":[{"type":"text","id":"s1","content":"The 30-day clock starts when the request "},{"type":"gap","id":"g1","correctItemId":"i1"},{"type":"text","id":"s2","content":"."}],"items":[{"id":"i1","label":"arrives"},{"id":"i2","label":"is verified"},{"id":"i3","label":"is forwarded to IT"}]},"sp":10}'></div>
</div>
```

A scene like this is valid on its own. It needs no framing because the previous scenes established everything. Reaching for a setup sentence out of habit is how scenes bloat.

### Example 3 — What NOT to do (one scene trying to be a whole lesson)

```html
<div>
  <h2>GDPR Deadlines</h2>
  <p>The GDPR is the EU's data protection regulation. It came into force in 2018 and defines strict deadlines for handling data subject requests. There are several things you should know about deletion requests.</p>
  <ul><li>Requests must be answered within 30 days</li><li>Identity must be verified</li><li>No reason is required</li><li>Backups are included</li><li>The DPO documents each request</li></ul>
  <div data-type="custom-multiple-choice" questionblock-data='{"optional":false,"questionData":{"choices":[{"id":"c1","text":"14"},{"id":"c2","text":"30"},{"id":"c3","text":"60"},{"id":"c4","text":"90"}],"correctChoiceIds":["c2"],"allowMultiple":false},"sp":10}'></div>
</div>
```

Why it fails: a heading where none belongs, a context paragraph nobody asked for, a five-item reference dump, and a question that tests recalling a number instead of making the decision. This is a lesson compressed into one scene. The fix is Examples 1-2: split it into a chain of single-task scenes and let the number live inside the scenario text.

## Voice Contract

**Write like a real teacher, not generic AI output:**

- No em dashes or en dashes (—, –) anywhere in generated copy. Use a period, comma, or "and"/"but" instead.
- Avoid generic AI tells: "In today's fast-paced world", "It's important to note that", "Let's dive in", excessive hedging, or listy filler that doesn't add information.
- Prefer short, second-person, concrete phrasing for questions: "A colleague sends you a file with an unusual extension. What do you do first?" rather than "Which of the following statements is correct regarding..."
- **You are a trainer, not a lecturer.** Scenes test and guide; they do not explain at length. When the urge to explain hits, turn the explanation into the next task or a one-sentence guide beat.
- Use an optional guide-character beat after an interaction for takeaways worth dwelling on: one short reaction, then one sentence of reasoning. Never only "Correct."/"Incorrect."

**The target is Duolingo's pacing applied to any content.** Keep the single-task screens, the constant interactivity, and the chained flow. What adapts to the content is the *kind* of task: non-language topics often land better as an image or short-video nugget (see `educational-visuals`), a scenario decision, or a sorting task than as a language-style drill. When explanation is genuinely needed, it comes as a guide-character beat between interactions, not as a text page.

## Formatting Consistency

- No headings inside scene content, ever. Scene titles live in scene metadata (`createScene`/`updateScene`), not in the content HTML.
- **Use inline emphasis actively, not accidentally.** Plain uniform text walls read as unedited AI output. In every explanatory sentence, mark the one term or phrase that carries the point: `<mark>` (highlight) for the single most important term of the scene, `<strong>` for decision-critical words, `<em>` for contrast or a subtle warning ("this applies *before* verification"). One or two emphasized spans per scene — enough to guide the eye, never so many that nothing stands out.
- **Emojis: warmth in moderation.** In guide-character speech bubbles, one fitting emoji adds Duolingo-style warmth (💡 for a tip, ⚠️ for a caution, ✅ in positive feedback). Rules: at most one per scene, only where it matches the emotional beat, never in question stems or answer options, never several in a row. A compliance course for executives may want zero — match the audience from `discovery`.
- **Lists are structured, never dumped.** When a list is the scene's nugget (max 3 items, per the scene limits): each item is a real `<li>`, one line, parallel grammatical structure, key term of each item bolded. Give the list breathing room — a short lead-in `<p>` before it, never a second paragraph crammed after it in the same scene. Never fake a list with commas, slashes, or `<br>` inside one paragraph.
- **Use the full structural palette when content calls for it.** The schema offers more than paragraphs: a `<blockquote>` sets a verbatim rule, policy sentence, or quote apart from your own words; a **two-column layout** carries a genuine side-by-side (do/don't, before/after, right/wrong response — max 3 short points per column). Pick structure by content shape, and vary it — five paragraph-only scenes in a row is a formatting monoculture even when each scene is short.

## HTML Authoring Rules

- Write concise, valid HTML that matches `getEditorSchema`. Escape JSON attributes correctly for custom nodes.
- Do not invent unsupported tags, attributes, or block types.
- Avoid giant paragraphs, long lecture text, or multiple unrelated concepts in one scene. If content is too large for one scene, split it — do not compress it.

## Error Recovery

- If `insertContent` fails validation, fix the HTML or malformed JSON and retry once with corrected full HTML.
- If the error says the editor is unavailable and you did not pass `sceneId`, retry with the target `sceneId` if known.
- If websocket/background editing is unavailable, tell the user which scene could not be edited and what is needed next.
- Never hide a failed write. Summarize what was changed and what still needs action.

## Content Quality Checklist

Before finishing, check:

- Schema was loaded before writing HTML; existing content was read before a targeted edit.
- The final HTML is a complete scene replacement with source IDs preserved or updated correctly.
- Any `lineageWarning` was handled with `setSceneLineage`.
- Outdated scenes were checked with `getOutdatedScenes` before freshness claims.
- The scene is one task: no headings, at most 1-2 setup sentences, one interaction or one guide beat or one media nugget.
- The scene does not restate context from previous scenes — the lesson flow carries it.
- Question blocks are schema-valid, not plain-text options; no block was inserted with empty sides, faces, labels, or arrays (matching pairs especially).
- No more than 2 consecutive guide-character-only scenes; every theory scene (text, guide exposition, video, audio, infographic) is directly followed by an interaction on that content.
- If 3+ scenes in a row describe the same single tool/feature, a genuine decision moment exists between them — this isn't documentation cut into taps.
- Correct-answer position and length were checked against the lesson's previous questions — no positional or length pattern.
- Questions clear the depth bar: at least one tempting distractor, a realistic complication at Apply/Analyze level, and escalating difficulty on repeated concepts.
- Block types are varied across the lesson, matched to the cognitive level `lesson-design` assigned to this moment.
- Guide character layout (`data-layout`) varies across the lesson's guide scenes; explanation media (flashcards, infographics, video) has a guide beat framing it.
- Key terms are emphasized with inline marks (highlight/bold); lists are real `<li>` structures with a lead-in sentence; blockquotes and columns used where the content shape calls for them.
- Interactions are right-sized: cloze has 2-4 gaps, drag-and-drop 4-6 items, matching 3-5 complete pairs; flashcard fronts carry context, never a bare term.
- At most one fitting emoji per scene, only in guide bubbles or feedback — never in question stems or options.
- No em/en dashes or generic AI phrasing; guide-character voice is consistent with earlier scenes.
