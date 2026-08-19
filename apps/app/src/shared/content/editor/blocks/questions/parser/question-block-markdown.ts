import {
  createAtomBlockMarkdownSpec,
  createInlineMarkdownSpec,
} from "@tiptap/core";

import {
  defaultQuestionBlockAttributes,
  type QuestionBlockAttributes,
} from "@/shared/content/editor/blocks/attributes/default-question-block-attributes";

function parseShortcodeAttrs(attrString: string) {
  const attrs = new Map<string, string>();
  const regex = /(\w+)=(?:"([^"]*)"|'([^']*)')/g;
  let match = regex.exec(attrString);
  while (match !== null) {
    const [, key, doubleQuoted, singleQuoted] = match;
    attrs.set(key!, (doubleQuoted ?? singleQuoted)!);
    match = regex.exec(attrString);
  }
  return attrs;
}

/** The mirror of `serializeAttributes`: string answers go into the shortcode
 * raw, every other `K` goes in as JSON. */
function parseUserAnswer<K>(raw: string | undefined, fallback: K): K {
  if (raw === undefined) return fallback;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = raw;
  }
  // SAFETY: a hand-written shortcode can put anything here, and still doesn't

  return parsed as K;
}

export type QuestionBlockMarkdownConfig<T, K> = {
  nodeName: string;

  name: string;

  isBlock?: boolean;
  defaultQuestionData: T;

  defaultAnswerData: K;

  serializeQuestionData: (questionData: T) => Record<string, string>;
  parseQuestionData: (attrs: ReadonlyMap<string, string>) => T;
};

export function createQuestionBlockMarkdownSpec<T, K>(
  config: QuestionBlockMarkdownConfig<T, K>,
) {
  const {
    nodeName,
    name,
    isBlock,
    defaultQuestionData,
    defaultAnswerData,
    serializeQuestionData,
    parseQuestionData,
  } = config;

  const specConfig = {
    nodeName,
    name,
    selfClosing: true,

    parseAttributes: (attrString: string) => {
      const attrs = parseShortcodeAttrs(attrString);

      const userAnswers = parseUserAnswer(
        attrs.get("userAnswer"),
        defaultAnswerData,
      );

      return {
        isQuestionBlock: true,
        questionBlockAttributes: {
          ...defaultQuestionBlockAttributes,
          optional: attrs.get("optional") === "true",
          questionData: parseQuestionData(attrs),
          userAnswers,
          maxPoints:
            Number(attrs.get("maxPoints")) > 0
              ? Number(attrs.get("maxPoints"))
              : undefined,
          achievedPoints:
            attrs.get("achievedPoints") === undefined
              ? undefined
              : Number(attrs.get("achievedPoints")),
        },
      };
    },

    serializeAttributes: (attrs: {
      questionBlockAttributes?: QuestionBlockAttributes<T, K>;
    }) => {
      const qba = attrs.questionBlockAttributes;
      if (!qba) return "";

      const questionData = qba.questionData ?? defaultQuestionData;
      const userAnswer = qba.userAnswers ?? defaultAnswerData;

      const questionAttrs = serializeQuestionData(questionData);
      const parts = Object.entries(questionAttrs).map(
        ([k, v]) => `${k}="${v}"`,
      );

      if (qba.optional) {
        parts.push(`optional="true"`);
      }
      if (qba.maxPoints !== undefined) {
        parts.push(`maxPoints="${qba.maxPoints}"`);
      }
      if (qba.achievedPoints !== undefined) {
        parts.push(`achievedPoints="${qba.achievedPoints}"`);
      }
      if (
        userAnswer !== defaultAnswerData &&
        userAnswer !== null &&
        userAnswer !== undefined
      ) {
        const serialized =
          typeof userAnswer === "string"
            ? userAnswer
            : JSON.stringify(userAnswer);
        if (serialized) {
          if (serialized.includes('"')) {
            parts.push(`userAnswer='${serialized}'`);
          } else {
            parts.push(`userAnswer="${serialized}"`);
          }
        }
      }

      return parts.join(" ");
    },
  };

  if (isBlock) {
    return createAtomBlockMarkdownSpec(specConfig);
  }
  return createInlineMarkdownSpec(specConfig);
}
