"use client";

import { cn } from "@scibly/ui/utils";
import {
  NodeViewContent,
  type NodeViewProps,
  NodeViewWrapper,
  useEditorState,
} from "@tiptap/react";
import { Check, ChevronDown, Lock, X } from "lucide-react";
import { useState } from "react";

import { useTranslation } from "@/i18n/hooks/use-translation";
import { getNodeAttributes } from "@/shared/content/editor/blocks/attributes/get-default-react-block-attributes";
import typedUpdateAttributes from "@/shared/content/editor/blocks/attributes/typed-update-attributes";
import {
  QA_GAME,
  QACelebrationMotion,
} from "@/shared/content/editor/blocks/ui/qa-celebration";
import ResizeInputField from "@/shared/ui/components/resize-input-field";

type StepAttributes = { label: string };

const TILE_PADDING = "px-4 py-3 @min-[40rem]:px-5 @min-[40rem]:py-4";
const TITLE_CLASS =
  "text-[16px] @min-[40rem]:text-[17px] leading-snug font-semibold";

const TILE_FACE = {
  default:
    "border-neutral-200 bg-white text-neutral-700 shadow-[0_4px_0_0_var(--color-edge)] dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:shadow-[0_4px_0_0_#404040]",
  selected:
    "border-[#b9d7ff] bg-[#eff5ff] text-[#0b4fb0] shadow-[0_4px_0_0_#94c4ff] dark:border-blue-400/40 dark:bg-blue-950/30 dark:text-sky-300 dark:shadow-[0_4px_0_0_#3b82f6]",
  locked:
    "border-neutral-200 bg-neutral-100 text-neutral-400 opacity-80 shadow-[0_4px_0_0_var(--color-edge)] dark:border-neutral-700 dark:bg-neutral-800/80 dark:text-neutral-500 dark:shadow-[0_4px_0_0_#404040]",
} as const;

export default function StepView(props: NodeViewProps) {
  const { translations } = useTranslation("editorUi");
  const copy = translations.steps;
  const isEditorEditable = props.editor.isEditable;
  const { label } = getNodeAttributes<StepAttributes>(props.node);

  const { index, opened, graded } = useEditorState({
    editor: props.editor,
    selector: ({ editor }) => {
      const pos = props.getPos();
      if (typeof pos !== "number")
        return { index: 0, opened: 0, graded: false };
      const $pos = editor.state.doc.resolve(pos);
      const attributes = $pos.parent.attrs.questionBlockAttributes;
      return {
        index: $pos.index(),
        opened: attributes?.userAnswers ?? 0,
        graded: attributes?.achievedPoints !== undefined,
      };
    },
  });

  const [isOpen, setIsOpen] = useState(false);

  const isExplored = index < opened;

  const isLocked = !isEditorEditable && !graded && index > opened;

  const isNext = !isEditorEditable && !isExplored && !isLocked;
  const isExpanded = isEditorEditable || isOpen;

  const toggle = () => {
    if (isLocked) return;
    setIsOpen(!isOpen);
    const pos = props.getPos();
    if (typeof pos === "number") props.editor.commands.openStep(pos);
  };

  const title = label || `${copy.stepFallback} ${index + 1}`;

  return (
    <NodeViewWrapper
      className={cn(
        "steps-item group/step",
        isExplored && "is-explored",
        isLocked && "is-locked",
        isExpanded && "is-open",
      )}
    >
      <QACelebrationMotion
        block
        enabled
        variant="pop"
        celebrateKey={isExplored ? 1 : 0}
        className="absolute top-0 left-0"
      >
        <span
          aria-hidden
          className={cn(
            "steps-item__marker mb-[3px] flex size-[2.375rem] items-center justify-center rounded-full border-2 text-[15px] font-bold transition-[background-color,border-color,color,box-shadow] duration-200",
            isExplored
              ? "border-[#0b52cc] bg-[#0f6fe6] text-white shadow-[0_3px_0_0_#0b52cc]"
              : "border-neutral-200 bg-white text-neutral-500 shadow-[0_3px_0_0_var(--color-edge)] dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-400 dark:shadow-[0_3px_0_0_#404040]",
            isNext &&
              "border-[#b9d7ff] bg-[#eff5ff] text-[#0b4fb0] shadow-[0_3px_0_0_#94c4ff] dark:border-blue-400/40 dark:bg-blue-950/30 dark:text-sky-300 dark:shadow-[0_3px_0_0_#3b82f6]",
            isLocked && "opacity-80",
          )}
        >
          {/* Without a check, done and pending steps read the same at a glance.
              The number itself comes from a CSS counter — see steps.css. */}
          {isExplored && <Check className="size-4" strokeWidth={3.5} />}
        </span>
      </QACelebrationMotion>

      <div
        className={cn(
          "steps-item__card mb-1 overflow-hidden rounded-2xl border-2 transition-[transform,box-shadow,margin-bottom,filter,border-color,background-color] duration-100 ease-out",
          isExplored ? TILE_FACE.selected : TILE_FACE.default,
          isLocked && TILE_FACE.locked,
          !isLocked &&
            !isEditorEditable &&
            cn(
              QA_GAME.tileHover,

              "has-[button:active]:mb-0 has-[button:active]:translate-y-[4px] has-[button:active]:shadow-none",
            ),
        )}
      >
        {!isEditorEditable ? (
          <button
            type="button"
            onClick={toggle}
            disabled={isLocked}
            title={isLocked ? copy.lockedStep : undefined}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? copy.collapseStep : copy.expandStep}
            className={cn(
              TILE_PADDING,
              "flex w-full items-center gap-3 text-left",
              isLocked ? "cursor-not-allowed" : "cursor-pointer",
            )}
          >
            <span className={cn(TITLE_CLASS, "min-w-0 flex-1 wrap-break-word")}>
              {title}
            </span>
            {isLocked ? (
              <Lock className="size-[1.125rem] shrink-0 opacity-70" />
            ) : (
              <ChevronDown
                className={cn(
                  "size-[1.125rem] shrink-0 opacity-70 transition-transform duration-300 motion-reduce:transition-none",
                  isExpanded && "rotate-180",
                )}
              />
            )}
          </button>
        ) : (
          <div className={cn(TILE_PADDING, "pb-0")}>
            <ResizeInputField
              value={label}
              placeholder={copy.labelPlaceholder}
              minWidthPx={120}
              onChange={(event) =>
                typedUpdateAttributes<StepAttributes>(props.updateAttributes, {
                  label: event.target.value,
                })
              }
              className={cn(
                TITLE_CLASS,
                "h-7 border-none bg-transparent shadow-none focus-visible:ring-0",
              )}
              wrapperClassName="-ml-2 block"
            />
          </div>
        )}

        {/* 0fr → 1fr animates the height while keeping the content mounted, so
            nested blocks stay registered and ProseMirror keeps its contentDOM. */}
        <div
          className={cn(
            "steps-item__collapse grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(.34,1.4,.64,1)] motion-reduce:transition-none",
            isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
          )}
        >
          <div className="overflow-hidden">
            <NodeViewContent className={cn(TILE_PADDING, "pt-0")} />
          </div>
        </div>
      </div>

      {isEditorEditable && (
        <button
          type="button"
          contentEditable={false}
          aria-label={copy.removeStep}
          title={copy.removeStep}
          onClick={() => {
            const pos = props.getPos();
            if (typeof pos === "number") {
              props.editor.commands.removeStep(pos);
            }
          }}
          className="text-ink-faint hover:text-ink hover:bg-ground absolute top-2 right-2 flex size-6 cursor-pointer items-center justify-center rounded-[8px] opacity-0 transition-opacity group-hover/step:opacity-100 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
        >
          <X className="size-3.5" />
        </button>
      )}
    </NodeViewWrapper>
  );
}
