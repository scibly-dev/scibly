import { columnsDefinition } from "@/shared/content/editor/blocks/column/definition";
import { horizontalRuleDefinition } from "@/shared/content/editor/blocks/custom-horizontal-rule/definition";
import { customListItemDefinition } from "@/shared/content/editor/blocks/custom-list-item/definition";
import { paragraphDefinition } from "@/shared/content/editor/blocks/custom-paragraph/definition";
import { documentDefinition } from "@/shared/content/editor/blocks/document/definition";
import { flashcardDefinition } from "@/shared/content/editor/blocks/flashcard/definition";
import { guideCharacterDefinition } from "@/shared/content/editor/blocks/guide-character/definition";
import { hintDefinition } from "@/shared/content/editor/blocks/hint/definition";
import { markdownDefinition } from "@/shared/content/editor/blocks/markdown/definition";
import { blockMathDefinition } from "@/shared/content/editor/blocks/math/block-math/definition";
import { inlineMathDefinition } from "@/shared/content/editor/blocks/math/inline-math/definition";
import { audioPlayerDefinition } from "@/shared/content/editor/blocks/media/audio-player/definition";
import { customImageDefinition } from "@/shared/content/editor/blocks/media/custom-image/definition";
import { videoPlayerDefinition } from "@/shared/content/editor/blocks/media/video-player/definition";
import { clozeTextDefinition } from "@/shared/content/editor/blocks/questions/cloze-text/definition";
import { dragAndDropDefinition } from "@/shared/content/editor/blocks/questions/drag-and-drop/definition";
import { freeFormInputDefinition } from "@/shared/content/editor/blocks/questions/free-form-input/definition";
import { inputFieldDefinition } from "@/shared/content/editor/blocks/questions/input-field/definition";
import { matchingPairsDefinition } from "@/shared/content/editor/blocks/questions/matching-pairs/definition";
import { multipleChoiceDefinition } from "@/shared/content/editor/blocks/questions/multiple-choice/definition";
import { stableIdDefinition } from "@/shared/content/editor/blocks/stable-id/definition";
import { stepsDefinition } from "@/shared/content/editor/blocks/steps/definition";
import {
  richTextCodeDefinition,
  richTextFormattingDefinition,
  textFoundationDefinition,
} from "@/shared/content/editor/blocks/text-schema/definition";
import { customGroupDefinition } from "@/shared/content/editor/blocks/ui/react-block-wrapper/definition";
import { SLASH_COMMAND_GROUPS } from "@/shared/content/editor/extensions/slash-command/registry/groups";

import { EditorSchemaRegistry } from "./editor-schema-registry";

export const editorSchemaRegistry = new EditorSchemaRegistry()
  .registerSlashCommandGroups(...SLASH_COMMAND_GROUPS)
  .register(textFoundationDefinition)
  .register(documentDefinition)
  .register(markdownDefinition)
  .register(horizontalRuleDefinition)
  .register(richTextCodeDefinition)
  .register(customListItemDefinition)
  .register(richTextFormattingDefinition)
  .register(columnsDefinition)
  .register(stableIdDefinition)
  .register(flashcardDefinition)
  .register(guideCharacterDefinition)
  .register(hintDefinition)
  .register(paragraphDefinition)
  .register(audioPlayerDefinition)
  .register(customImageDefinition)
  .register(videoPlayerDefinition)
  .register(blockMathDefinition)
  .register(inlineMathDefinition)
  .register(inputFieldDefinition)
  .register(multipleChoiceDefinition)
  .register(clozeTextDefinition)
  .register(dragAndDropDefinition)
  .register(freeFormInputDefinition)
  .register(matchingPairsDefinition)
  .register(stepsDefinition)
  .register(customGroupDefinition)
  .finalize();

export type QuestionBlocksType = ReturnType<
  (typeof editorSchemaRegistry)["getQuestionNames"]
>[number];
