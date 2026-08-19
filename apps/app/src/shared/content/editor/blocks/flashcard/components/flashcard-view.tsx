import { cn } from "@scibly/ui/utils";
import {
  NodeViewContent,
  type NodeViewProps,
  NodeViewWrapper,
} from "@tiptap/react";
import { RotateCw } from "lucide-react";
import { useState } from "react";

import { resolveBlockDocUrl } from "@/lib/utils";
import { getNodeAttributes } from "@/shared/content/editor/blocks/attributes/get-default-react-block-attributes";
import { FlashcardThemeSettings } from "@/shared/content/editor/blocks/flashcard/components/flashcard-theme-settings";
import {
  type FlashcardTheme,
  THEME_MAP,
} from "@/shared/content/editor/blocks/flashcard/components/flashcard-themes";
import ReactBlockWrapper from "@/shared/content/editor/blocks/ui/react-block-wrapper";

export { THEME_MAP } from "@/shared/content/editor/blocks/flashcard/components/flashcard-themes";

export default function FlashcardView(props: NodeViewProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const { theme: themeAttr } = getNodeAttributes<{ theme: FlashcardTheme }>(
    props.node,
  );
  const themeClasses = THEME_MAP[themeAttr] || THEME_MAP.default;

  return (
    <NodeViewWrapper className="w-full">
      <ReactBlockWrapper
        nodeViewProps={props}
        isEditorEditable={props.editor.isEditable}
        docLink={resolveBlockDocUrl("interactive", "flashcard")}
        settingsContent={
          <FlashcardThemeSettings
            themeAttr={themeAttr}
            onThemeChange={(theme) => props.updateAttributes({ theme })}
          />
        }
      >
        <div
          className={cn(
            "flashcard-container not-draggable group relative my-4 w-full [perspective:1000px]",
            isFlipped && "is-flipped",
            themeClasses,
            !props.editor.isEditable && "cursor-pointer",
          )}
          onClick={() => {
            if (!props.editor.isEditable) setIsFlipped(!isFlipped);
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsFlipped(!isFlipped);
            }}
            className="border-hairline text-ink-muted hover:border-edge hover:text-ink ease-press absolute top-3 left-1/2 z-20 flex size-8 -translate-x-1/2 cursor-pointer items-center justify-center rounded-full border-2 bg-white shadow-[0_2px_0_0_var(--color-lip)] transition-[translate,box-shadow,border-color,color] duration-100 active:translate-y-[2px] active:shadow-none dark:text-neutral-600 dark:hover:text-neutral-400"
            title="Flip Card"
            aria-label="Flip Card"
          >
            <RotateCw className="h-4 w-4" />
          </button>
          <NodeViewContent />
        </div>
      </ReactBlockWrapper>
    </NodeViewWrapper>
  );
}
