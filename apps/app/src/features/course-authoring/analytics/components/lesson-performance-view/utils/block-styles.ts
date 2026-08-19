import {
  FALLBACK_BLOCK_ICON,
  QUESTION_BLOCK_METADATA,
} from "@/shared/content/editor/blocks/registry/question-metadata";
import { editorSchemaRegistry } from "@/shared/content/editor/blocks/registry/shared";

const ICON_CLASS = "text-ink-muted";
const BLOCK_BACKGROUND_CLASS = "bg-ground border-2 border-edge";

export const getBlockStyle = (type: string) => {
  if (editorSchemaRegistry.isQuestionName(type)) {
    const metadata = QUESTION_BLOCK_METADATA[type];
    return {
      icon: metadata.iconName,
      iconClass: ICON_CLASS,
      bgClass: BLOCK_BACKGROUND_CLASS,
      label: metadata.analyticsLabel,
    };
  }

  return {
    icon: FALLBACK_BLOCK_ICON,
    iconClass: ICON_CLASS,
    bgClass: BLOCK_BACKGROUND_CLASS,
    label: type,
  };
};
