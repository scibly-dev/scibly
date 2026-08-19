import type { NodeViewProps } from "@tiptap/core";
import type { InternalQuestionBlock } from "@/shared/content/editor/assessment/parsing/base-parser/types";

import {
  type BaseReactBlockAttributes,
  getNodeAttributes,
} from "@/shared/content/editor/blocks/attributes/get-default-react-block-attributes";
import typedUpdateAttributes from "@/shared/content/editor/blocks/attributes/typed-update-attributes";

type QuestionBlock<T, K> = Omit<BaseReactBlockAttributes, "id"> & {
  id: string;
  questionBlockAttributes: QuestionBlockAttributes<T, K>;
};

export type QuestionBlockAttributes<T, K> = {
  optional: boolean;
  questionData: T;
  userAnswers: K;
  maxPoints?: number;
  achievedPoints?: number;

  sp: number;
};

export type QuestionBlockProps<T, V> = NodeViewProps & {
  parserBlock?: InternalQuestionBlock<T, V>;
};

export const DEFAULT_QUESTION_BLOCK_SP = 10;

export const defaultQuestionBlockAttributes: QuestionBlockAttributes<any, any> =
  {
    optional: false,
    questionData: null,
    userAnswers: null,
    maxPoints: undefined,
    achievedPoints: undefined,
    sp: DEFAULT_QUESTION_BLOCK_SP,
  };

const learnerAnswerDefaults = new WeakMap<object, unknown>();

function getLearnerAnswerDefault<T, K>(
  node: NodeViewProps["node"],
): QuestionBlockAttributes<T, K>["userAnswers"] {
  if (learnerAnswerDefaults.has(node)) {
    // SAFETY: keyed by the node, and the only writer is the line below — the

    return learnerAnswerDefaults.get(node) as K;
  }

  // SAFETY: callers check `isQuestionBlock` first, and a block only carries

  const defaults = node.type.spec.attrs?.questionBlockAttributes
    ?.default as QuestionBlockAttributes<T, K>;
  const answer = structuredClone(defaults.userAnswers);
  learnerAnswerDefaults.set(node, answer);
  return answer;
}

export const updateQuestionAttributes = <T, K>(
  props: NodeViewProps,
  newAttributes: Partial<QuestionBlockAttributes<T, K>>,
) => {
  const merged = {
    ...getQuestionAttributes<T, K>(props.node),
    ...newAttributes,
  };

  if ("userAnswers" in newAttributes) merged.achievedPoints = undefined;
  typedUpdateAttributes<QuestionBlock<T, K>, "questionBlockAttributes">(
    props.updateAttributes,
    "questionBlockAttributes",
    merged,
  );
};

export const getQuestionAttributes = <T, K>(
  node: NodeViewProps["node"],
): QuestionBlockAttributes<T, K> => {
  const attrs = getNodeAttributes(node);
  if (!attrs.isQuestionBlock)
    throw new Error("This function can only be used on question blocks");
  // SAFETY: present because `isQuestionBlock` is — the same `questionBlock`

  const qba = attrs.questionBlockAttributes as QuestionBlockAttributes<T, K>;
  if (qba.userAnswers != null) return qba;
  return { ...qba, userAnswers: getLearnerAnswerDefault<T, K>(node) };
};

export const getQuestionBlockAttributes = <T, K, L = object>(
  node: NodeViewProps["node"],
): QuestionBlock<T, K> & L => {
  const attrs = getNodeAttributes(node);
  if (!attrs.isQuestionBlock)
    throw new Error("This function can only be used on question blocks");
  // SAFETY: narrows `id` to non-null, which holds because every question block

  return {
    ...attrs,
    questionBlockAttributes: getQuestionAttributes<T, K>(node),
  } as QuestionBlock<T, K> & L;
};
