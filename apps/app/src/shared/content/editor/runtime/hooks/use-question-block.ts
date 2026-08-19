"use client";

import type { NodeViewProps } from "@tiptap/core";
import type { InternalQuestionBlock } from "@/shared/content/editor/assessment/parsing/base-parser/types";
import type { QuestionBlocksType } from "@/shared/content/editor/blocks/registry/shared";

import { useEffect, useMemo } from "react";
import { useDebouncedCallback } from "use-debounce";

import { useQuestionBlockStore } from "@/shared/content/editor/assessment/grading/question-block-store";
import {
  getQuestionBlockGradedState,
  isQuestionBlockReadOnlyWhenGraded,
  type QuestionBlockGradedState,
} from "@/shared/content/editor/assessment/grading/question-block-store/helpers";
import { resolveDisplayOrder } from "@/shared/content/editor/assessment/learner/answer-order";
import { getQuestionBlockAttributes } from "@/shared/content/editor/blocks/attributes/default-question-block-attributes";
import { EditableState } from "@/shared/content/editor/blocks/attributes/get-default-react-block-attributes";
import { useEditorStoreScopeActive } from "@/shared/content/editor/runtime/context/editor-store-scope-context";
import { useMissingSolutionIndicator } from "@/shared/content/editor/runtime/hooks/use-missing-solution-indicator";

type QuestionBlockConfig<Q> = {
  blockType: QuestionBlocksType;

  isEmpty: (questionData: Q) => boolean;

  candidates: ((questionData: Q) => string[]) | null;
};

type QuestionBlockResult<Q, A> = {
  block: InternalQuestionBlock<Q, A>;

  hidden: boolean;

  isReadOnly: boolean;

  gradedState: QuestionBlockGradedState | null;

  displayOrder: string[] | null;

  missingSolution: string | null;
};

export function useQuestionBlockRegistration<Q, A>(
  props: NodeViewProps,
  config: QuestionBlockConfig<Q>,
): QuestionBlockResult<Q, A> {
  const attrs = getQuestionBlockAttributes<Q, A>(props.node);
  const qba = attrs.questionBlockAttributes;
  const { isEditable } = props.editor;
  const isStoreScopeActive = useEditorStoreScopeActive();

  const isEmpty = !isEditable && config.isEmpty(qba.questionData);

  const questionBlocks = useQuestionBlockStore((s) => s.questionBlocks);
  const register = useQuestionBlockStore((s) => s.registerBlock);
  const unregister = useQuestionBlockStore((s) => s.unregisterBlock);
  const syncAnswer = useQuestionBlockStore((s) => s.updateBlockAnswer);
  const learnerIdentity = useQuestionBlockStore((s) => s.learnerIdentity);

  const block: InternalQuestionBlock<Q, A> | undefined = useMemo(
    () => questionBlocks.get(attrs.id),
    [questionBlocks, attrs.id],
  );

  useEffect(() => {
    if (!isStoreScopeActive || isEmpty) return;
    if (attrs.isEditable === EditableState.NotEditable) {
      unregister(attrs.id);
      return;
    }
    register({
      blockId: attrs.id,
      blockType: config.blockType,
      optional: qba.optional,
      solution: qba.questionData,
      learnerAnswer: qba.userAnswers,
      isEditable: attrs.isEditable,
      isResizable: attrs.isResizable,
      isQuestionBlock: attrs.isQuestionBlock,
      maxPoints: qba.maxPoints,
      achievedPoints: qba.achievedPoints,
      blockSp: qba.sp,
    });

    return () => unregister(attrs.id);
  }, [
    isStoreScopeActive,
    isEmpty,
    attrs.id,
    attrs.isEditable,
    attrs.isResizable,
    attrs.isQuestionBlock,
    config.blockType,
    qba.optional,
    qba.questionData,
    qba.userAnswers,
    qba.maxPoints,
    qba.achievedPoints,
    qba.sp,
    register,
    unregister,
  ]);

  const debouncedAnswer = useDebouncedCallback(
    (answer: A) => syncAnswer<A>(attrs.id, answer),
    200,
  );
  useEffect(
    () => debouncedAnswer(qba.userAnswers),
    [qba.userAnswers, debouncedAnswer],
  );

  const hidden = (isEmpty && !isEditable) || !block;

  const gradedState = useMemo(
    () =>
      getQuestionBlockGradedState(
        attrs.isEditable,
        isEditable,
        block?.achievedPoints,
        block?.maxPoints,
        block,
      ),
    [attrs.isEditable, block, isEditable],
  );

  const displayOrder = useMemo(() => {
    if (!config.candidates) return null;
    return resolveDisplayOrder({
      candidateIds: config.candidates(qba.questionData),
      blockId: attrs.id,
      identity: learnerIdentity,
      isAuthoring: isEditable,
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qba.questionData, attrs.id, learnerIdentity, isEditable]);

  const missingSolution = useMissingSolutionIndicator({
    blockType: config.blockType,
    questionData: qba.questionData,
    isAuthoring: isEditable,
  });

  return {
    // SAFETY: `hidden` is true whenever the block is missing, and every caller

    block: block as InternalQuestionBlock<Q, A>,
    hidden,
    missingSolution,
    isReadOnly: isQuestionBlockReadOnlyWhenGraded(
      block?.achievedPoints,
      block?.maxPoints,
    ),
    gradedState,
    displayOrder,
  };
}
