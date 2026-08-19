---
name: educational-visuals
description: Design and generate Scibly-style educational visuals — infographics, concept diagrams, process flows, and labeled illustrations — using generateImage. Balances Duolingo-like gamified energy (hooks, progress metaphors) with professional clarity, source-grounded truth, and low cognitive load; generated images are always character-free (the guide character frames the visual from the scene HTML instead). Applies cognitive load theory, Mayer's multimedia principles, and microlearning nugget design. Use when the user asks for infographics, diagrams, illustrations, visual summaries, concept maps, step-by-step visuals, or educational images for scenes and lessons.
---

# Educational Visuals

Create education-focused images that teach at a glance — and feel like part of a modern learning app, not a corporate slide deck or a children's sticker book.

The learner should grasp the core idea in under 10 seconds, **want** to keep going, and trust that what they see is accurate.

## Scibly design philosophy

Scibly courses follow a **Duolingo-style microlearning path**: short lessons, quick wins, frequent practice, and a friendly guide — while staying **professional and truthful**. Visuals must match that mindset.

| Principle                               | What it means for visuals                                                                                                                                                                                                               |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Learn by doing**                      | Visuals set up a decision, mistake, or "aha" — not passive reference posters. Prefer hook questions ("Which step comes first?") over dry labels ("Process overview").                                                                   |
| **Gamified energy, professional craft** | Borrow app-like cues: numbered steps, progress paths, level badges, streak metaphors, checkpoint flags. Keep typography clean, palette restrained, and icons consistent — never clip-art chaos or casino neon.                          |
| **Fun, not silly**                      | Warm and encouraging tone; light personality through headlines and playful metaphors. Avoid infantilizing learners (no excessive emoji, no cartoon explosions, no "LEVEL UP!!!" spam).                                   |
| **Character-free images**               | Generated images never contain the guide characters, any mascot, or Duolingo's owl. Personality comes from the guide character in the scene HTML around the image — never baked into the image, where the model draws it off-brand and it can't be reused.                                   |
| **Truth over decoration**               | Every label must be factually correct and proportionally honest. Simplify for clarity, never distort. Ground claims in notebook sources when available. If unsure, ask or qualify — do not invent statistics, quotes, or process steps. |
| **One nugget, one visual**              | Same rule as scenes: one idea per image. A visual is the **nugget** in the hook → nugget → practice → feedback rhythm from `course-design`.                                                                                             |

**The balance:** Duolingo's _pacing and motivation_ + Scibly's _professional trust and source fidelity_. Think "motivating colleague with a clear diagram," not "textbook wall" or "mobile game ad."

## When to use this skill

Load this skill before generating or revising any educational image:

- Infographics, concept diagrams, process flows, timelines, comparisons
- Visual summaries of a lesson topic, framework, or mental model
- Scene illustrations where text alone would overload working memory
- Replacing dense bullet lists with a single coherent visual

Do **not** use this skill for decorative stock-style photos, standalone character portraits, or photorealistic scenes with no instructional structure.

**Hard rule — no characters inside generated images.** Never include the Scibly guide characters (`sage`, `spark`, `coach`, `buddy`, `pro`), any mascot figure, or Duolingo's owl "Duo" in a generated image. The image model cannot reproduce the real guide characters, so any attempt yields an off-brand lookalike — and Duo is another company's trademarked character. The guide's presence around a visual comes from the scene: a guide-character block introduces or comments on the image in the scene HTML (see `scene-content`). Add "no mascots, no cartoon characters, no people as decoration" to the prompt constraints when the model tends to add them.

## Workflow

1. **Clarify the learning goal** — What should the learner remember or do after seeing this image? One primary takeaway only.
2. **Check sources and truth** — When notebook sources exist, verify facts, steps, and proportions before simplifying. Do not invent data.
3. **Set the hook** — Frame the title as a question, challenge, or scenario when it fits ("What trips up most learners here?"). Match course tone (workplace-realistic, app-like, exam-focused).
4. **Check existing media** — Call `listNotebookMedia` first. Reuse a suitable image via `insertContent` instead of generating duplicates.
5. **Choose a layout** — Pick one template from [Layout catalog](#layout-catalog). Match layout to content structure, not aesthetics alone.
6. **Reduce content** — Apply [Content reduction](#content-reduction) until only must-know labels remain (typically 3–5 chunks).
7. **Add gamified cues** — Apply [Gamification without clutter](#gamification-without-clutter): progress metaphor, numbered steps, or checkpoint — only what serves the learning goal.
8. **Build the prompt** — Follow [Prompt structure](#prompt-structure). Keep prompt under 4000 characters.
9. **Generate** — Call `generateImage` with `prompt`, `alt`, and `aspectRatio`.
10. **Close in chat** — Brief text-only confirmation. Never paste markdown images, raw URLs, or duplicate the visual in prose.
11. **Insert on request** — Use `insertContent` with the returned URL only when the user explicitly asks to place the image in a scene.

## Cognitive load rules

Design to manage all three load types:

| Load type                        | Design response                                                                                                       |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **Intrinsic** (topic complexity) | Chunk into 3–5 labeled parts. One concept per visual. Split overloaded topics into a series.                          |
| **Extraneous** (visual noise)    | No decorative clutter, 3D effects, stock photo backgrounds, or unrelated icons. Generous whitespace.                  |
| **Germane** (schema building)    | Use consistent metaphors, color-coded categories, arrows showing relationships, and a clear title + closing takeaway. |

### Mayer's multimedia principles (apply all)

- **Coherence** — Omit anything that does not support the learning goal.
- **Signaling** — Bold titles, color accents, and arrows guide attention to what matters.
- **Redundancy** — Do not repeat the same fact in title, body, and caption. Say it once, visually.
- **Contiguity** — Place labels next to the elements they describe; avoid long leader lines.
- **Segmenting** — Number steps (01–04) or separate zones so learners process one chunk at a time.
- **Pre-training** — For jargon-heavy topics, label key terms inside the visual before expecting full understanding.
- **Dual coding** — Pair a simple icon or diagram with each short label; never icon-free text blocks.

### Additional learning design habits

- **Chunking** — 3–5 items per visual is ideal; 7 is the hard maximum for labeled elements.
- **Progressive disclosure** — One scene = one visual idea. Multi-part topics → series of visuals, not one crowded poster.
- **Concrete over abstract** — Prefer recognizable icons (clipboard, hourglass, brain, arrows) over abstract shapes.
- **Retrieval support** — Include a memorable headline question or action verb ("Simplify", "Reduce", "Maximise") when it aids recall.

## Gamification without clutter

Use game-like **structure**, not game-like **noise**. Each cue must help the learner see progress, stakes, or sequence.

| Cue                             | Use when                            | Keep professional by                                                              |
| ------------------------------- | ----------------------------------- | --------------------------------------------------------------------------------- |
| **Numbered steps / levels**     | Procedures, skill progression       | Large clean numerals (01–04), color bands, no fantasy RPG framing                 |
| **Progress path / quest trail** | Habits, multi-step journeys         | Dotted path or diagonal band with checkpoint nodes — not a literal video-game map |
| **Checkpoint / flag icons**     | Milestones, compliance stages       | Simple flat flags or circles; one icon style throughout                           |
| **Before → after split**        | Common mistakes vs correct approach | Neutral "before" vs accent "after"; no shame-based imagery                        |
| **Streak / habit metaphor**     | Reinforcement, spaced practice      | Subtle chain of linked nodes or calendar ticks — no flame emoji spam              |

**Avoid:** XP bars with fake numbers, leaderboard UI, treasure chests, excessive badges, meme references, or childish speech bubbles inside the image (guide dialogue belongs in the Guide Character block in the scene).

## Truth and accuracy

Gamification must never trade away correctness.

- **Source-ground** labels when notebook sources are available. Search or read sources before generating process steps, policies, statistics, or definitions.
- **Proportional simplification** — Omit nice-to-know detail, but do not change meaning (e.g. do not turn "usually" into "always," or collapse optional steps into mandatory ones).
- **No invented facts** — Do not fabricate percentages, dates, regulations, product names, or quotes for visual punch.
- **Jargon policy** — Pre-label technical terms the learner needs; explain them in the paired scene copy if the visual alone would mislead.
- **Regenerate for accuracy** — If the image model distorts text or invents labels, regenerate with explicit spellings and fewer text elements.

## Visual style defaults

Unless the user requests otherwise, target this look (aligned with Scibly course aesthetics):

- **Format**: Clean flat-vector educational infographic on white or very light neutral background — modern learning-app polish, not corporate PowerPoint
- **Palette**: 2–3 brand-safe colors (e.g. teal/emerald, navy, soft violet accent) plus black text — no rainbow gradients or casino brightness
- **Typography**: Bold sans-serif title; short labels in sentence case; no paragraphs
- **Icons**: Simple line or flat icons inside circles or rounded squares; consistent stroke weight
- **Tone**: Warm hook headline; confident and clear, lightly encouraging — never condescending
- **Text budget**: Title ≤ 12 words. Per label ≤ 8–12 words. Optional one-line takeaway at bottom ≤ 15 words. **No paragraph text.**
- **Language**: Match the course/scene language (German or English)

## Layout catalog

Pick exactly one layout per image.

| Layout                | Best for                                       | Structure                                                                                                                           |
| --------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Diagonal path**     | Tips, habits, sequential advice                | Title hook question; 3–4 nodes along a diagonal progress band; icons in colored circles; closing takeaway                           |
| **Quest path**        | Skill journey, lesson sequence, phased rollout | Winding or stepped path with 3–5 checkpoint nodes; flag or star marker at start (never a mascot); "You are here" feel without game UI chrome |
| **Segmented concept** | Frameworks with 2–4 categories                 | Central metaphor (e.g. brain, gear, funnel) with color-coded segments; each segment has icon + 1-line label + action verb           |
| **Numbered steps**    | Procedures, workflows                          | Vertical or horizontal 3–4 steps; large step numbers; one headline + one supporting line each; color-coded bands                    |
| **Radial hub**        | Ecosystem overview, 6–8 related facets         | Central icon; spokes to short labels; equal visual weight per spoke                                                                 |
| **Side-by-side**      | Compare/contrast, before/after                 | Two columns with matching structure; max 3 comparison points                                                                        |
| **Labeled anatomy**   | Parts of a system, UI, object                  | Single subject with callout labels; max 5–6 labels                                                                                  |
| **Timeline**          | History, phases, maturity                      | Left-to-right or top-to-bottom; 3–5 milestones with icons                                                                           |

See [examples.md](examples.md) for ready-to-adapt prompt patterns per layout.

## Content reduction

Before writing the prompt, strip the topic down:

1. Write the **one-sentence learning outcome** for this visual.
2. List candidate facts; keep only those required for that outcome.
3. Merge synonyms; delete nice-to-know background.
4. Convert each remaining fact to **icon + short label** (not a sentence).
5. If more than 5 chunks remain, split into multiple images or drop lowest-priority items.

**Bad**: A wall of 10 bullet points explaining cognitive load theory.
**Good**: Hook title "Feeling mentally overloaded?" + 3–4 path nodes + takeaway "Process smarter, not more."

**Bad**: Fake stat "90% of people fail" with no source.
**Good**: Accurate, source-grounded labels even if less punchy.

## Prompt structure

Build prompts in this order so image models produce consistent Scibly-style output:

```
[STYLE] Clean flat-vector educational infographic, modern learning-app aesthetic, white background, teal and navy palette with soft violet accent, simple line icons, generous whitespace, professional not childish, no photorealism, no paragraph text.

[TONE] Warm and motivating microlearning tone; hook-driven headline; trustworthy and workplace-appropriate.

[LAYOUT] <layout name and spatial description>

[TITLE] <hook question or challenge, ≤12 words>

[CONTENT]
1. <icon description> — <label, ≤12 words>
2. ...

[GAMIFICATION] <optional: numbered steps, progress path, checkpoint flags — never a mascot or character>

[TAKEAWAY] <optional single encouraging closing line in a light accent box, ≤15 words>

[CONSTRAINTS] Factually accurate labels only. No lorem ipsum. No tiny unreadable text. No watermarks. No stock photos. No fake statistics. No mascots, no cartoon characters, no people as decoration. Text must be spelled correctly in <language>.
```

### Aspect ratio

| Layout                                              | Recommended `aspectRatio` |
| --------------------------------------------------- | ------------------------- |
| Diagonal path, numbered steps, timeline, quest path | `16:9`                    |
| Segmented concept, side-by-side, labeled anatomy    | `4:3`                     |
| Radial hub                                          | `1:1`                     |
| Tall step ladder (4+ vertical steps)                | `3:4` or `9:16`           |

Default to `16:9` when unsure.

### Alt text

Write `alt` as plain-language description of what the image teaches (10–200 characters). Describe the learning content, not the art style.

- Good: `Infographic with three tips to reduce cognitive overload: prioritize tasks, short sessions, less context switching`
- Bad: `Colorful infographic image`

## Quality checklist

Before calling `generateImage`, confirm:

- [ ] One primary learning takeaway
- [ ] Hook-style title when it fits the lesson (question, challenge, or scenario)
- [ ] Facts source-grounded or clearly general knowledge — no invented data
- [ ] Gamification cues serve learning, not decoration (≤1 metaphor type per visual)
- [ ] No mascots, guide characters, or third-party characters anywhere in the prompt
- [ ] Professional tone — motivating but not childish
- [ ] ≤ 5 labeled chunks (or justified split into multiple images)
- [ ] No paragraph-length text in the prompt
- [ ] Icons specified for every label
- [ ] Layout matches content structure
- [ ] Colors limited to 2–3 + neutrals
- [ ] `listNotebookMedia` checked when library may already have a fit
- [ ] `alt` describes instructional content
- [ ] Prompt requests correct language spelling

After generation, if the result is text-heavy or cluttered, **regenerate** with stricter constraints: fewer labels, larger icons, explicit "no body text, labels only."

## Integration with Lesson Design and Scene Content

Load `lesson-design` when placing visuals inside a lesson arc, and `scene-content` for the scene HTML/voice around the image. Visuals are **nuggets** in the app-like rhythm:

1. **Hook** — Guide character or headline scene poses the problem (visual may preview the stakes).
2. **Nugget** — This infographic delivers the structured insight in one glance.
3. **Practice** — The very next scene must be interactive **and about the visual's content**: retrieve its labels, sort its categories, apply its rule to a case. An infographic is a theory scene like any other — shipping one without an immediate practice moment on exactly what it shows leaves an orphaned nugget (see `scene-content`), and the learner scrolls past it without encoding anything.
4. **Feedback** — Explain why the practice answer matters, tying back to the visual's labels.

Additional rules:

- Pair visuals with a short Guide Character line or one-sentence scene copy — the image carries structure; the scene adds voice and context.
- Do not put assessment questions inside the image. Keep testing in interaction blocks.
- For complex topics, plan a **visual sequence** across scenes (one idea per scene per `lesson-design`'s nugget rules).
- When a visual replaces a text-heavy scene, delete redundant prose so learners are not told the same thing twice.
- The course's guide character never appears inside the image — it introduces or comments on the visual from a guide-character block in the scene HTML, keeping the character consistent across all explanation formats.
- **Non-language content usually needs more than bite-sized text.** When a concept is too dense for a flashcard or cloze to carry alone, prefer an infographic or short video over compressing it — see `scene-content`'s Voice Contract for why 1:1 Duolingo-style terseness doesn't fit everything.

## Additional resources

- Prompt templates and worked examples: [examples.md](examples.md)
