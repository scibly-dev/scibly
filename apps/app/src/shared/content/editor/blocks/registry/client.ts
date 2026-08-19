"use client";

import type { EditorSchemaSlot, TiptapExtension } from "./types";

import { horizontalRuleNodeViewBindings } from "@/shared/content/editor/blocks/custom-horizontal-rule/client";
import { flashcardNodeViewBindings } from "@/shared/content/editor/blocks/flashcard/client";
import { guideCharacterNodeViewBindings } from "@/shared/content/editor/blocks/guide-character/client";
import { hintNodeViewBindings } from "@/shared/content/editor/blocks/hint/client";
import { blockMathNodeViewBindings } from "@/shared/content/editor/blocks/math/block-math/client";
import { inlineMathNodeViewBindings } from "@/shared/content/editor/blocks/math/inline-math/client";
import { audioPlayerNodeViewBindings } from "@/shared/content/editor/blocks/media/audio-player/client";
import { customImageNodeViewBindings } from "@/shared/content/editor/blocks/media/custom-image/client";
import { videoPlayerNodeViewBindings } from "@/shared/content/editor/blocks/media/video-player/client";
import { clozeTextNodeViewBindings } from "@/shared/content/editor/blocks/questions/cloze-text/client";
import { dragAndDropNodeViewBindings } from "@/shared/content/editor/blocks/questions/drag-and-drop/client";
import { freeFormInputNodeViewBindings } from "@/shared/content/editor/blocks/questions/free-form-input/client";
import { inputFieldNodeViewBindings } from "@/shared/content/editor/blocks/questions/input-field/client";
import { matchingPairsNodeViewBindings } from "@/shared/content/editor/blocks/questions/matching-pairs/client";
import { multipleChoiceNodeViewBindings } from "@/shared/content/editor/blocks/questions/multiple-choice/client";
import { stepsNodeViewBindings } from "@/shared/content/editor/blocks/steps/client";

import { ClientNodeViewRegistry } from "./client-node-view-registry";
import { editorSchemaRegistry } from "./shared";

const clientNodeViewRegistry = new ClientNodeViewRegistry(editorSchemaRegistry)
  .register(...horizontalRuleNodeViewBindings)
  .register(...flashcardNodeViewBindings)
  .register(...guideCharacterNodeViewBindings)
  .register(...hintNodeViewBindings)
  .register(...audioPlayerNodeViewBindings)
  .register(...customImageNodeViewBindings)
  .register(...videoPlayerNodeViewBindings)
  .register(...blockMathNodeViewBindings)
  .register(...inlineMathNodeViewBindings)
  .register(...inputFieldNodeViewBindings)
  .register(...multipleChoiceNodeViewBindings)
  .register(...dragAndDropNodeViewBindings)
  .register(...clozeTextNodeViewBindings)
  .register(...freeFormInputNodeViewBindings)
  .register(...matchingPairsNodeViewBindings)
  .register(...stepsNodeViewBindings)
  .finalize();

const CLIENT_NODE_VIEW_BINDINGS = clientNodeViewRegistry.getBindings();

export function getClientSchemaExtensions(
  slot?: EditorSchemaSlot,
): TiptapExtension[] {
  return editorSchemaRegistry.materializeSchemaExtensions(
    CLIENT_NODE_VIEW_BINDINGS,
    slot,
  );
}
