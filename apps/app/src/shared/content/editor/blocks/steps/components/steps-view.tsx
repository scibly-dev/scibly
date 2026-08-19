"use client";

import {
  NodeViewContent,
  type NodeViewProps,
  NodeViewWrapper,
} from "@tiptap/react";
import { Plus } from "lucide-react";

import { useTranslation } from "@/i18n/hooks/use-translation";
import { resolveBlockDocUrl } from "@/lib/utils";
import {
  getQuestionBlockAttributes,
  updateQuestionAttributes,
} from "@/shared/content/editor/blocks/attributes/default-question-block-attributes";
import {
  type QuestionData,
  STEPS_NODE_NAME,
  type UserAnswer,
} from "@/shared/content/editor/blocks/steps/schema";
import {
  BlockSettingsContainer,
  BlockSettingsSwitch,
} from "@/shared/content/editor/blocks/ui/block-settings-ui";
import { QuestionBlockGradedFrame } from "@/shared/content/editor/blocks/ui/question-block-graded-frame";
import ReactBlockWrapper from "@/shared/content/editor/blocks/ui/react-block-wrapper";
import { useQuestionBlockRegistration } from "@/shared/content/editor/runtime/hooks/use-question-block";

export default function StepsView(props: NodeViewProps) {
  const { translations } = useTranslation("editorUi");
  const copy = translations.steps;
  const isEditorEditable = props.editor.isEditable;

  const attrs = getQuestionBlockAttributes<QuestionData, UserAnswer>(
    props.node,
  );
  const { hidden, gradedState, missingSolution } = useQuestionBlockRegistration<
    QuestionData,
    UserAnswer
  >(props, {
    blockType: STEPS_NODE_NAME,

    isEmpty: () => false,
    candidates: null,
  });

  const total = props.node.childCount;
  const opened = Math.min(attrs.questionBlockAttributes.userAnswers, total);

  const handleAddStep = () => {
    const pos = props.getPos();
    if (typeof pos !== "number") return;

    props.editor.commands.addStep(pos + props.node.nodeSize - 1);
  };

  if (hidden) return null;

  const settingsContent = (
    <BlockSettingsContainer>
      <BlockSettingsSwitch
        label={copy.optionalLabel}
        checked={attrs.questionBlockAttributes.optional}
        onCheckedChange={() =>
          updateQuestionAttributes<QuestionData, UserAnswer>(props, {
            optional: !attrs.questionBlockAttributes.optional,
          })
        }
      />
    </BlockSettingsContainer>
  );

  return (
    <NodeViewWrapper className="w-full" id={attrs.id}>
      <ReactBlockWrapper
        nodeViewProps={props}
        isEditorEditable={isEditorEditable}
        docLink={resolveBlockDocUrl("interactive", "steps")}
        settingsContent={settingsContent}
      >
        <QuestionBlockGradedFrame
          state={gradedState}
          missingSolution={missingSolution}
        >
          <div className="steps my-6 w-full">
            {/* The rail itself is the progress meter — it draws downwards as
                steps open. A second bar here only fought the player's own. */}
            {!isEditorEditable && (
              <span aria-live="polite" className="sr-only">
                {opened >= total
                  ? copy.allDone
                  : copy.progressLabel
                      .replace("{opened}", String(opened))
                      .replace("{total}", String(total))}
              </span>
            )}

            <NodeViewContent className="steps-list" />

            {isEditorEditable && (
              <button
                type="button"
                contentEditable={false}
                onClick={handleAddStep}
                className="text-ink-muted hover:text-ink bg-ground-soft ease-press mt-1 ml-[3.5rem] flex cursor-pointer items-center gap-1.5 rounded-2xl border-2 border-dashed border-neutral-200 px-4 py-2 text-[14px] font-medium transition-[color,border-color] duration-150 hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-400 dark:hover:text-neutral-100"
              >
                <Plus className="size-3.5" />
                {copy.addStep}
              </button>
            )}
          </div>
        </QuestionBlockGradedFrame>
      </ReactBlockWrapper>
    </NodeViewWrapper>
  );
}
