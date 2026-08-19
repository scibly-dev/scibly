---
name: creating-tiptap-blocks
description: Guidelines for creating, modifying, reviewing, or refactoring Scibly LMS Tiptap nodes, marks, extensions, and QA blocks. Use this whenever work touches editor features, especially QA blocks, cloze text, drag-and-drop, multiple choice, input fields, block settings, markdown parsing, or assessment UI. Enforces editor folder placement, AI awareness, Zod/Yjs-safe state, parser/store registration, shared QA game tokens, authoring ergonomics, wrapping, grading, and verification.
---

# Tiptap Node Guidelines

Use this skill to keep editor work production-ready. The editor is collaborative and schema-driven, so persisted state must stay serializable and deterministic. QA blocks are learning interactions, so they should feel tactile and forgiving for students while staying fast and predictable for authors.

## 1. Place Files Correctly

Shared content block additions belong under
`apps/app/src/shared/content/editor/blocks/`; authoring-only chrome and commands
belong under `apps/app/src/features/course-authoring/scenes/editor/`:

| Type                | Directory Location                               | Purpose                                                   | Required Files                                                            |
| ------------------- | ------------------------------------------------ | --------------------------------------------------------- | ------------------------------------------------------------------------- |
| **QA Blocks**       | `shared/content/editor/blocks/questions/[name]/` | Interactive assessments.                                  | `schema.ts`, `index.ts`, `[name].tsx`, markdown/parser files, i18n, tests |
| **Classical Nodes** | `shared/content/editor/blocks/[name]/`           | Read-only or layout blocks.                               | `index.ts`, optional `.tsx` / markdown files                              |
| **Marks**           | `marks/[name]/`                                  | Inline text formatting wrappers (e.g., bold, highlights). | `index.ts`, `[name]-markdown.ts`                                          |
| **Extensions**      | `shared/content/editor/extensions/[name]/`  | Headless document behavior.                               | `index.ts`                                                                |
| **Authoring UI**    | `features/course-authoring/scenes/editor/menus/` | Editing-only menus and toolbars.                          | component, i18n, tests                                                    |

Register insertable features in slash commands and localized command translations. Add globally available nodes/extensions to the main editor extension setup.

## 2. Preserve Editor Contracts

- Add AI awareness in `index.ts` with `addHtmlSchemaAwareness()`; QA blocks should use `questionBlockSchemaAttribute` where available.
- Keep `schema.ts` pure TypeScript: types, constants, defaults, and Zod schemas only. Do not import React or Tiptap there.
- Initialize QA attributes via `getDefaultReactBlockAttributes<QuestionData, UserAnswer>({ questionBlock: { defaultQuestionData, defaultAnswerData } })`.
- Wrap React node views in `NodeViewWrapper` and use `useQABlockRegistration` for assessment state.
- Read/write attributes with `getQuestionBlockAttributes(...)` and `updateQuestionAttributes(...)`, not raw mutation.
- Implement `renderHTML` and markdown serialization so content can round-trip through parser/PDF workflows.
- Put user-facing copy in i18n files and generated types.

## 3. Wire QA Blocks End-to-End

For every QA block:

- Create/register a parser extending `BaseQABlockParser` in `src/shared/content/editor/blocks/questions/`.
- Register it in `QABlockParserRegistry` and add a title to `userFriendlyNameMap`.
- Add the node name to `QA_BLOCK_NAMES` so `UniqueID` assigns stable ids.
- Treat `achievedPoints` / `maxPoints` as graded-state ground truth when present; avoid duplicate correctness booleans that can drift from scoring.

## 4. Keep State Yjs-Safe

- Do not use `react-hook-form` inside node views; it conflicts with collaborative attribute state and causes cursor resets.
- Keep persisted state in node attributes. Local state is only for ephemeral UI: hover, selected id, animation locks, pending focus.
- Validate `QuestionData` with Zod from `schema.ts`; feed that into `useQABlockRegistration({ isEmpty })`.
- Derive `isGraded`, `isFullyCorrect`, selected state, and answer presence during render instead of storing them in effects.
- Debounce noisy validation UI with `useDebounce`.
- If inputs stop key propagation, explicitly route `Cmd/Ctrl+Z`, `Cmd/Ctrl+Shift+Z`, and `Ctrl+Y` to editor undo/redo.

## 5. Use Shared QA UX

Before adding local QA styling, check `@/shared/content/editor/blocks/ui/qa-celebration`.

- Use `QA_GAME`, `getQAGameTileClassName`, graded-status helpers, `QACelebrationMotion`, `QASolutionHint`, and `QASolutionPlacementChip`.
- Answer tiles use a face plus bottom `box-shadow` lip. Do not recreate the old thick-border 3D look.
- Selected state is light sky-blue and active-looking, not green.
- Grading colors: green = correct item, red = wrong answer/placement, yellow = missed required answer, grey = unused/neutral.
- Do not show a block or item as green when it is only partially correct.
- Use quick, reduced-motion-aware celebration; avoid bespoke animation systems for standard QA feedback.
- Keep reset/retry controls quiet until there is something to reset.

## 6. Make Authoring Feel Native

- Prefer keyboard-first flows: shortcuts can create editable blanks/items, Backspace removes inline structures like text, and undo/redo works inside node-view inputs.
- Focus newly created editable children on the next layout pass with refs + `useLayoutEffect`.
- Use auto-sizing inline inputs for text-like authoring; keep empty min widths small near structural boundaries.
- For inline blank/gap authoring, collapsed selection should create an empty focused target; selected text should become the answer/content. Deleting that structure should remove its stored content unless restoration is explicit.
- Keep destructive buttons as quiet fallbacks (`opacity-0 group-hover:opacity-100`) when keyboard deletion exists.
- Normalize away empty helper segments or artifacts that create unexplained spacing.

## 7. Wrap Real Content

Long real-world content is normal. Design chips, options, and drop targets to wrap cleanly rather than truncate or overflow.

- Prefer wrapping over `truncate`, `overflow-hidden`, or `whitespace-nowrap` for learner-visible labels.
- Use `wrap-break-word`, `min-w-0`, and max-width tokens such as `QA_GAME.chipMaxWidth` so chips wrap in both source banks and target zones.
- Align icons/drag handles to the top in multi-line chips.
- Highlight every valid destination. If a selected/dragged item can return to its origin, that origin should highlight too.
- Keep inline spacing modest; avoid margins that create phantom gaps.

## 8. Visual & Settings Standards

- Use shared block settings components from `@/shared/content/editor/blocks/ui/block-settings-ui`.
- Default to soft geometry (`rounded-2xl`, `rounded-xl`), subtle borders, light shadows, crisp `text-[15px] font-medium`, and muted helper labels.
- Hover should signal interactivity without competing with graded feedback.
- Touch targets should remain usable even when compact.
- Use `sonner` for invisible background actions, not routine typing or selection.

## 9. Verify Before Finishing

- Add or update schema, parser, and behavior tests for new QA logic.
- Test utility edge cases: empty content, adjacent gaps, long labels, deletion, undo/redo, id preservation.
- Manually check wrapping, graded states, selected states, dark mode, reduced motion, and author keyboard flows.
- Run focused package commands from `apps/app` where possible: `pnpm test`, `pnpm run typecheck`, `pnpm run lint`.
