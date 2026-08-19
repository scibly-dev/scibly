"use client";

import { Button } from "@scibly/ui/components/button";
import { cn } from "@scibly/ui/utils";
import { type NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { EyeOffIcon, Lightbulb } from "lucide-react";
import { memo } from "react";

import { useTranslation } from "@/i18n/hooks/use-translation";
import { getNodeAttributes } from "@/shared/content/editor/blocks/attributes/get-default-react-block-attributes";
import typedUpdateAttributes from "@/shared/content/editor/blocks/attributes/typed-update-attributes";
import {
  defaultData,
  type HintBlockAttributes,
} from "@/shared/content/editor/blocks/hint/node";
import shouldRenderBlock from "@/shared/content/editor/runtime/should-render-block";
import ResizeInputField from "@/shared/ui/components/resize-input-field";

const HintComponent = memo((props: NodeViewProps) => {
  const { translations } = useTranslation("editorUi");
  const { content, isRevealed, learnerRevealed } =
    getNodeAttributes<HintBlockAttributes>(props.node);

  const isEditorEditable = props.editor.isEditable;
  const isHintVisible = isEditorEditable ? isRevealed : learnerRevealed;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    typedUpdateAttributes<HintBlockAttributes>(props.updateAttributes, {
      content: e.target.value,
    });
  };

  const toggleHint = () => {
    const attributeToUpdate = isEditorEditable
      ? "isRevealed"
      : "learnerRevealed";
    typedUpdateAttributes<HintBlockAttributes>(props.updateAttributes, {
      [attributeToUpdate]: !isHintVisible,
    });
  };

  return (
    <NodeViewWrapper
      as="span"
      className={cn(
        "ease-press mr-1 ml-1 inline-flex items-center gap-1.5 rounded-[12px] border-2 px-1.5 py-1 align-middle transition-[translate,box-shadow,background-color,border-color] duration-150",
        isHintVisible
          ? "border-[#ffe08a] bg-[#fff8e1] dark:bg-neutral-800/80"
          : "border-hairline hover:border-edge cursor-pointer bg-white shadow-[0_2px_0_0_var(--color-lip)] active:translate-y-[2px] active:shadow-none dark:border-neutral-800/50 dark:bg-neutral-900/50",
      )}
      onClick={!isHintVisible ? toggleHint : undefined}
    >
      <Button
        onClick={(e) => {
          e.stopPropagation();
          toggleHint();
        }}
        variant="ghost"
        size="sm"
        className="h-6 rounded-[8px] px-2 text-[12px] font-medium text-neutral-500 transition-colors hover:bg-white/50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-black/20 dark:hover:text-neutral-100"
      >
        {isHintVisible ? (
          <>
            <EyeOffIcon className="mr-1.5 h-3.5 w-3.5 opacity-70" />
            Verstecken
          </>
        ) : (
          <>
            <Lightbulb className="mr-1.5 h-3.5 w-3.5 text-amber-500" />
            Hinweis anzeigen
          </>
        )}
      </Button>
      {isHintVisible &&
        (isEditorEditable ? (
          <ResizeInputField
            placeholder={translations.hintPlaceholder}
            value={content}
            onChange={handleInputChange}
            className="h-6 min-w-20 border-none bg-transparent px-1 text-[13px] text-neutral-700 shadow-none focus-visible:ring-0 dark:text-neutral-300"
          />
        ) : (
          <span className="animate-fade-in pr-2 pl-1 text-[13px] text-neutral-700 dark:text-neutral-300">
            {content}
          </span>
        ))}
    </NodeViewWrapper>
  );
});

HintComponent.displayName = "HintComponent";

export const Hint = memo((props: NodeViewProps) => {
  const attrs = getNodeAttributes<HintBlockAttributes>(props.node);
  return shouldRenderBlock<HintBlockAttributes["content"]>(
    defaultData.content,
    attrs.content.trim(),
    props,
    HintComponent,
  );
});

Hint.displayName = "Hint";
export default Hint;
