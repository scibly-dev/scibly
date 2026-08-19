import type { QuestionBlocksType } from "@/shared/content/editor/blocks/registry/shared";

import { type Content, type JSONContent } from "@tiptap/core";

import { type QuestionBlockAttributes } from "@/shared/content/editor/blocks/attributes/default-question-block-attributes";
import { type EditableState } from "@/shared/content/editor/blocks/attributes/get-default-react-block-attributes";
import { type ReactBlockAttributes } from "@/shared/content/editor/blocks/attributes/get-default-react-block-attributes";

export type RawBlock<T extends string> = {
  type: T;
  content?: Content;
  attrs?: JSONContent["attrs"];
};

export type RawQuestionBlock<T extends QuestionBlocksType, V, K> = Omit<
  RawBlock<T>,
  "attrs"
> & {
  attrs: Omit<
    ReactBlockAttributes<V, K>,
    "questionBlockAttributes" | "mediaBlockAttributes" | "id"
  > & {
    id: string;
    questionBlockAttributes: QuestionBlockAttributes<V, K>;
  };
};

export type InternalQuestionBlock<T, K> = {
  blockId: string;
  blockType: QuestionBlocksType;
  optional: boolean;
  solution: T;
  learnerAnswer: K;
  isAnswered: boolean;
  achievedPoints?: number;
  maxPoints: number;

  blockSp: number;
  userFriendlyName: string;
  questionNumber: number;
  isEditable: EditableState;
  isResizable: boolean;
  isQuestionBlock: boolean;
  refs: number;
};

export type QuestionBlock<T, K> = Omit<
  InternalQuestionBlock<T, K>,
  "isAnswered" | "userFriendlyName" | "questionNumber" | "maxPoints" | "refs"
> & {
  maxPoints?: number;
};

export type AnyInternalQuestionBlock = InternalQuestionBlock<any, any>;

export type QuestionBlockMap = Map<string, AnyInternalQuestionBlock>;
