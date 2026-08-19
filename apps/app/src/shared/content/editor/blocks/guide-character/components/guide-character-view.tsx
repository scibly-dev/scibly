"use client";

import type { NodeViewProps } from "@tiptap/react";
import type { GuideCharacterReaction } from "@/shared/content/editor/blocks/guide-character/utils/guide-character-reactions";

import { cn } from "@scibly/ui/utils";
import { NodeViewContent, NodeViewWrapper } from "@tiptap/react";
import { useMemo } from "react";

import { stringAttribute } from "@/shared/content/editor/blocks/attributes/string-attribute";
import { GuideAvatarSlot } from "@/shared/content/editor/blocks/guide-character/components/guide-avatar-slot";
import { GuideCharacterChrome } from "@/shared/content/editor/blocks/guide-character/components/guide-character-chrome";
import { useGuideCharacterSceneReaction } from "@/shared/content/editor/blocks/guide-character/components/guide-character-reaction-context";
import { GuideSpeechBubbleTail } from "@/shared/content/editor/blocks/guide-character/components/guide-speech-bubble-tail";
import { useGuideNestedReaction } from "@/shared/content/editor/blocks/guide-character/hooks/use-guide-nested-reaction";
import {
  type GuideLayoutId,
  normalizeGuideLayoutId,
} from "@/shared/content/editor/blocks/guide-character/utils/guide-layouts";

const LAYOUT_ROW: GuideLayoutId[] = ["left", "right"];
const LAYOUT_STACK: GuideLayoutId[] = ["top", "inline"];

export default function GuideCharacterView(props: NodeViewProps) {
  const layout = normalizeGuideLayoutId(stringAttribute(props.node, "layout"));
  const isEditable = props.editor.isEditable;
  const isRowLayout = LAYOUT_ROW.includes(layout);
  const isStackLayout = LAYOUT_STACK.includes(layout);

  const sceneReaction = useGuideCharacterSceneReaction();
  const nestedReaction = useGuideNestedReaction(props.node);

  const reaction = useMemo((): GuideCharacterReaction => {
    if (isEditable) return "idle";
    if (nestedReaction) return nestedReaction;
    return sceneReaction;
  }, [isEditable, nestedReaction, sceneReaction]);

  const speechBubble = (
    <div
      className={cn(
        "guide-speech-bubble border-hairline relative rounded-[20px] border-2 bg-white px-4 py-3 shadow-[0_4px_0_0_var(--color-lip)]",
        "dark:border-neutral-700/80 dark:bg-neutral-900",
        layout === "inline" && "pl-[3.75rem]",
        isStackLayout && "w-full",
      )}
    >
      {layout === "inline" ? (
        <GuideAvatarSlot
          layout={layout}
          reaction={reaction}
          animated={!isEditable}
        />
      ) : null}
      <GuideSpeechBubbleTail layout={layout} />
      <NodeViewContent
        as="div"
        className={cn(
          "guide-speech-content min-h-[2.75rem] text-[15px] leading-relaxed",
          "[&_.ProseMirror]:min-h-[2.75rem] [&_.ProseMirror]:outline-none",
          !isEditable &&
            "pointer-events-none [&_.react-renderer]:pointer-events-auto",
        )}
      />
    </div>
  );

  return (
    <NodeViewWrapper
      as="div"
      data-guide-character-root=""
      data-guide-layout={layout}
      className="group/guide relative my-5 w-full"
    >
      {isEditable ? (
        <GuideCharacterChrome nodeViewProps={props} layout={layout} />
      ) : null}

      {isEditable ? (
        <div
          data-guide-drag-zone=""
          className="absolute top-0 bottom-0 left-0 z-10 w-3 -translate-x-full"
          aria-hidden
        />
      ) : null}

      {isRowLayout ? (
        <div
          className={cn(
            "flex w-full gap-3 @min-[40rem]:gap-4",
            layout === "left" && "flex-row items-end",
            layout === "right" && "flex-row-reverse items-end",
          )}
        >
          <GuideAvatarSlot
            layout={layout}
            reaction={reaction}
            animated={!isEditable}
          />
          <div className="relative min-w-0 flex-1">{speechBubble}</div>
        </div>
      ) : null}

      {layout === "top" ? (
        <div className="flex w-full flex-col items-center gap-3 @min-[40rem]:gap-4">
          <GuideAvatarSlot
            layout={layout}
            reaction={reaction}
            animated={!isEditable}
          />
          {speechBubble}
        </div>
      ) : null}

      {layout === "inline" ? (
        <div className="relative w-full">{speechBubble}</div>
      ) : null}
    </NodeViewWrapper>
  );
}
