import type { icons } from "lucide-react";
import type { QuestionBlocksType } from "@/shared/content/editor/blocks/registry/shared";

import { editorSchemaRegistry } from "@/shared/content/editor/blocks/registry/shared";

type QuestionBlockMetadata = Readonly<{
  analyticsLabel: string;
  iconName: keyof typeof icons;
  userFriendlyName: string;
}>;

export const FALLBACK_BLOCK_ICON: keyof typeof icons = "CircleHelp";

function projectMetadata(
  definition: ReturnType<
    (typeof editorSchemaRegistry)["getQuestionDefinitions"]
  >[number],
): QuestionBlockMetadata {
  const presentation = definition.presentation;
  if (!presentation) {
    throw new Error(`Question definition "${definition.name}" lacks metadata`);
  }

  return {
    analyticsLabel: presentation.analyticsLabel,
    iconName: presentation.iconName,
    userFriendlyName: presentation.userFriendlyName,
  };
}

// SAFETY: one entry per registered question definition, and
// `QuestionBlocksType` is the union of exactly those names.
export const QUESTION_BLOCK_METADATA = Object.fromEntries(
  editorSchemaRegistry
    .getQuestionDefinitions()
    .map((definition) => [definition.name, projectMetadata(definition)]),
) as Record<QuestionBlocksType, QuestionBlockMetadata>;
