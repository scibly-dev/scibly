import type { NodeViewProps } from "@tiptap/core";

import { isUrl } from "@/lib/utils";
import {
  defaultMediaAttributes,
  type MediaBlockAttributes,
} from "@/shared/content/editor/blocks/attributes/default-media-attributes";
import {
  defaultQuestionBlockAttributes,
  type QuestionBlockAttributes,
} from "@/shared/content/editor/blocks/attributes/default-question-block-attributes";
import { normalizeMediaSrc } from "@/shared/content/editor/media/utils/normalize-media-src";

export enum EditableState {
  Editable = "editable",

  NotEditable = "not_editable",

  Default = "default",
}

export type BaseReactBlockAttributes = {
  id: string | null;
  isEditable: EditableState;
  isQuestionBlock: boolean;
  isResizable: boolean;
};

export type ReactBlockAttributes<
  T = unknown,
  K = unknown,
> = BaseReactBlockAttributes & {
  mediaBlockAttributes?: MediaBlockAttributes;
  questionBlockAttributes?: QuestionBlockAttributes<T, K>;
};

export const getNodeAttributes = <T = unknown>(
  node: NodeViewProps["node"],
): ReactBlockAttributes & T => {
  // SAFETY: ProseMirror types `attrs` as `Record<string, any>` and fills every

  return node.attrs as ReactBlockAttributes & T;
};

type LearnerState = QuestionBlockAttributes<unknown, unknown>;

function parseJsonAttribute<V extends object>(
  defaultValue: V,
  raw: string | null,
): V {
  if (!raw) return defaultValue;

  // SAFETY: the blob is what `renderHTML` below wrote for this same attribute.

  const parsed = JSON.parse(raw) as Partial<V>;
  // SAFETY: spreading `Partial<V>` over `V` leaves every key of `V` set.
  const merged = { ...defaultValue, ...parsed } as V;
  // SAFETY: a claim about `V` that the `in` check below tests before using —

  const questionDefaults = defaultValue as LearnerState;

  if (
    "userAnswers" in questionDefaults &&
    // SAFETY: same claim, on the value that was parsed against those defaults.
    (parsed as Partial<LearnerState>).userAnswers == null
  ) {
    // SAFETY: guarded by the `in` check — `merged` carries `defaultValue`'s

    (merged as LearnerState).userAnswers = structuredClone(
      questionDefaults.userAnswers,
    );
  }

  return merged;
}

function createJsonAttribute<V extends object>(
  nodeAttrKey: string,
  htmlAttrName: string,
  defaultValue: V,
  fallbackParser?: (element: HTMLElement) => V | undefined,
) {
  return {
    [nodeAttrKey]: {
      default: defaultValue,
      parseHTML: (element: HTMLElement) => {
        const fallback = fallbackParser?.(element);
        if (fallback !== undefined) return fallback;

        const data = element.getAttribute(htmlAttrName);
        return parseJsonAttribute(defaultValue, data);
      },
      renderHTML: (attributes: Record<string, V>) => ({
        [htmlAttrName]: JSON.stringify(attributes[nodeAttrKey]),
      }),
    },
  };
}

type BlockAttributeOptions<T = never, K = never> = {
  canTeacherChangeEditableState?: boolean;

  isResizable?: boolean;

  hasMediaAttributes?: boolean;

  questionBlock?: {
    defaultQuestionData: T;
    defaultAnswerData: K;
  };
};

export default function getDefaultReactBlockAttributes<T = never, K = never>(
  options: BlockAttributeOptions<T, K> = {},
) {
  const {
    canTeacherChangeEditableState = false,
    isResizable = false,
    hasMediaAttributes = false,
    questionBlock,
  } = options;

  const includeMediaAttributes = isResizable || hasMediaAttributes;

  const isEditable = canTeacherChangeEditableState
    ? EditableState.Editable
    : EditableState.Default;

  return {
    id: { default: null },
    isEditable: { default: isEditable },
    isQuestionBlock: { default: !!questionBlock },
    isResizable: { default: isResizable },

    // eslint-disable-next-line anti-slop/no-conditional-empty-object-spread -- Tiptap registers every key `addAttributes` returns, so an absent block's attribute must be absent, not present and undefined.
    ...(includeMediaAttributes
      ? createJsonAttribute(
          "mediaBlockAttributes",
          "data-media-attributes",
          { ...defaultMediaAttributes },
          (element) => {
            const rawSrc = element.getAttribute("src");
            const src = rawSrc ? normalizeMediaSrc(rawSrc) : null;
            if (src && isUrl(src)) {
              return {
                ...structuredClone(defaultMediaAttributes),
                src,
                width:
                  element.getAttribute("width") ?? defaultMediaAttributes.width,
                height:
                  element.getAttribute("height") ??
                  defaultMediaAttributes.height,
              };
            }
            return undefined;
          },
        )
      : {}),

    // eslint-disable-next-line anti-slop/no-conditional-empty-object-spread -- absent, not undefined; see above
    ...(questionBlock
      ? createJsonAttribute<QuestionBlockAttributes<T, K>>(
          "questionBlockAttributes",
          "questionblock-data",
          {
            ...defaultQuestionBlockAttributes,
            questionData: structuredClone(questionBlock.defaultQuestionData),
            userAnswers: structuredClone(questionBlock.defaultAnswerData),
          },
        )
      : {}),
  };
}
