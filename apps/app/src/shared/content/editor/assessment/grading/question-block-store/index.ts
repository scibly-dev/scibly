import type { Editor } from "@tiptap/core";
import type { AnswerOrderIdentity } from "@/shared/content/editor/assessment/learner/answer-order";

import isEqual from "react-fast-compare";
import { shallow } from "zustand/shallow";
import { createWithEqualityFn } from "zustand/traditional";

import {
  type AnyInternalQuestionBlock,
  type QuestionBlock,
  type QuestionBlockMap,
} from "@/shared/content/editor/assessment/parsing/base-parser/types";
import { questionBlockParserRegistry } from "@/shared/content/editor/assessment/parsing/parser-registry";
import { QUESTION_BLOCK_METADATA } from "@/shared/content/editor/blocks/registry/question-metadata";

type QuestionBlockStore = {
  editor: Editor | null;
  questionBlocks: QuestionBlockMap;
  learnerIdentity: AnswerOrderIdentity;
  setEditor: (editor: Editor | null) => void;
  setLearnerIdentity: (identity: AnswerOrderIdentity) => void;
  registerBlock: <T, K>(block: QuestionBlock<T, K>) => void;
  unregisterBlock: (blockId: string) => void;
  updateBlockAnswer: <T>(blockId: string, answer: T) => void;
  submit: () => boolean;
  checkIfAllAnswered: (questionBlocks: QuestionBlockMap) => {
    newQuestionBlocks: QuestionBlockMap;
    allAnswered: boolean;
  };
  clear: () => void;
};

/**
 * Tracks whether each question is answered, for the submit gate — it does not
 * grade answers or compute points; that happens on the backend.
 */
export const useQuestionBlockStore = createWithEqualityFn<QuestionBlockStore>(
  (set, get) => ({
    editor: null,
    questionBlocks: new Map(),
    learnerIdentity: { learnerId: null, attempt: undefined },

    setEditor: (editor) => set({ editor }),

    setLearnerIdentity: (learnerIdentity) => set({ learnerIdentity }),

    clear: () => set({ questionBlocks: new Map() }),

    registerBlock: (block) => {
      set((state) => {
        const newBlocks = new Map<string, AnyInternalQuestionBlock>(
          state.questionBlocks,
        );
        const maxPoints =
          block.maxPoints ??
          questionBlockParserRegistry.getMaxPoints(
            block.blockType,
            block.solution,
          );
        const userFriendlyName =
          QUESTION_BLOCK_METADATA[block.blockType].userFriendlyName;
        const existingBlock = newBlocks.get(block.blockId);

        const learnerAnswer = existingBlock
          ? existingBlock.learnerAnswer
          : block.learnerAnswer;
        newBlocks.set(block.blockId, {
          ...block,
          learnerAnswer,
          maxPoints,
          blockSp: block.blockSp ?? 0,
          userFriendlyName,

          isAnswered: questionBlockParserRegistry.isAnswered(
            block.blockType,
            learnerAnswer,
            block.solution,
          ),
          questionNumber: 1,
          refs: (existingBlock?.refs || 0) + 1,
        });
        return { questionBlocks: newBlocks };
      });
    },

    unregisterBlock: (blockId) => {
      set((state) => {
        const newBlocks = new Map<string, AnyInternalQuestionBlock>(
          state.questionBlocks,
        );
        const existingBlock = newBlocks.get(blockId);
        if (!existingBlock) return { questionBlocks: newBlocks };
        if (existingBlock.refs > 1) {
          newBlocks.set(blockId, {
            ...existingBlock,
            refs: existingBlock.refs - 1,
          });
        } else {
          newBlocks.delete(blockId);
        }
        return { questionBlocks: newBlocks };
      });
    },

    updateBlockAnswer: (blockId, answer) => {
      set((state) => {
        const block = state.questionBlocks.get(blockId);
        if (!block || isEqual(block.learnerAnswer, answer)) {
          return state;
        }

        const newBlocks = new Map<string, AnyInternalQuestionBlock>(
          state.questionBlocks,
        );
        newBlocks.set(blockId, {
          ...block,
          learnerAnswer: answer,
          isAnswered: questionBlockParserRegistry.isAnswered(
            block.blockType,
            answer,
            block.solution,
          ),
          achievedPoints: undefined,
        });
        return { questionBlocks: newBlocks };
      });
    },
    checkIfAllAnswered: (questionBlocks: QuestionBlockMap) => {
      const newQuestionBlocks = new Map<string, AnyInternalQuestionBlock>();
      let allAnswered = true;

      for (const [blockId, block] of questionBlocks) {
        const newBlock = { ...block };
        newBlock.isAnswered = questionBlockParserRegistry.isAnswered(
          block.blockType,
          block.learnerAnswer,
          block.solution,
        );
        newQuestionBlocks.set(blockId, newBlock);
        if (!newBlock.optional) {
          allAnswered = allAnswered && newBlock.isAnswered;
        }
      }

      return { newQuestionBlocks, allAnswered };
    },

    submit: () => {
      const { questionBlocks, checkIfAllAnswered } = get();
      if (questionBlocks.size === 0) {
        return true;
      }
      const { newQuestionBlocks, allAnswered } =
        checkIfAllAnswered(questionBlocks);

      set({ questionBlocks: newQuestionBlocks });
      return allAnswered;
    },
  }),
  shallow,
);
