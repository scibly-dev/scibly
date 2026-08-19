import type { NodeViewRenderer } from "@tiptap/core";
import type { Node as ProseMirrorNode, ResolvedPos } from "@tiptap/pm/model";

import { createBlockMarkdownSpec, mergeAttributes, Node } from "@tiptap/core";
import { isChangeOrigin } from "@tiptap/extension-collaboration";
import { Plugin, PluginKey } from "@tiptap/pm/state";

import getDefaultReactBlockAttributes, {
  getNodeAttributes,
} from "@/shared/content/editor/blocks/attributes/get-default-react-block-attributes";
import {
  defaultAnswerData,
  defaultQuestionData,
  type QuestionData,
  STEP_NODE_NAME,
  STEPS_NODE_NAME,
  type UserAnswer,
} from "@/shared/content/editor/blocks/steps/schema";
import { questionBlockSchemaAttribute } from "@/shared/content/editor/html-schema/question-block-schema";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    steps: {
      insertSteps: () => ReturnType;

      addStep: (insertAt?: number) => ReturnType;

      removeStep: (stepPos?: number) => ReturnType;

      openStep: (stepPos: number) => ReturnType;
    };
  }
}

const INITIAL_STEP_COUNT = 3;

const createEmptyStep = () => ({
  type: STEP_NODE_NAME,
  content: [{ type: "paragraph" }],
});

export function findEmptyStep(block: ProseMirrorNode): number | null {
  for (let index = 0; index < block.childCount; index += 1) {
    const step = block.child(index);
    if (step.textContent.trim()) continue;
    let hasMedia = false;
    step.descendants((child) => {
      if (child.isLeaf && !child.isText) hasMedia = true;
    });
    if (!hasMedia) return index + 1;
  }
  return null;
}

function stepDepth($pos: ResolvedPos) {
  for (let depth = $pos.depth; depth > 0; depth -= 1) {
    if ($pos.node(depth).type.name === STEP_NODE_NAME) return depth;
  }
  return null;
}

type StepsNodeOptions = Readonly<{
  nodeView?: NodeViewRenderer;
}>;

const stepsNode = Node.create({
  name: STEPS_NODE_NAME,

  group: "block",

  content: `${STEP_NODE_NAME}+`,

  defining: true,

  isolating: true,

  addAttributes() {
    return getDefaultReactBlockAttributes<QuestionData, UserAnswer>({
      questionBlock: { defaultQuestionData, defaultAnswerData },
    });
  },

  addCommands() {
    return {
      insertSteps:
        () =>
        ({ commands }) =>
          commands.insertContent({
            type: STEPS_NODE_NAME,
            content: Array.from(
              { length: INITIAL_STEP_COUNT },
              createEmptyStep,
            ),
          }),

      addStep:
        (insertAt) =>
        ({ state, chain }) => {
          let at = insertAt;
          if (at === undefined) {
            const { $from } = state.selection;
            const depth = stepDepth($from);
            if (depth === null) return false;
            at = $from.after(depth);
          }
          return chain()
            .insertContentAt(at, createEmptyStep())
            .focus(at + 2)
            .run();
        },

      removeStep:
        (stepPos) =>
        ({ state, chain }) => {
          const $pos =
            stepPos === undefined
              ? state.selection.$from
              : state.doc.resolve(stepPos + 1);
          const depth = stepDepth($pos);
          if (depth === null) return false;

          const isLastStep = $pos.node(depth - 1).childCount === 1;
          const range = isLastStep
            ? { from: $pos.before(depth - 1), to: $pos.after(depth - 1) }
            : { from: $pos.before(depth), to: $pos.after(depth) };

          return chain().deleteRange(range).focus().run();
        },

      openStep:
        (stepPos) =>
        ({ state, tr, dispatch }) => {
          const $pos = state.doc.resolve(stepPos);
          const parent = $pos.parent;
          if (parent.type.name !== STEPS_NODE_NAME) return false;

          const attributes = parent.attrs.questionBlockAttributes;
          const opened = $pos.index() + 1;

          if (opened <= attributes.userAnswers) return false;

          if (dispatch) {
            tr.setNodeAttribute($pos.before(), "questionBlockAttributes", {
              ...attributes,
              userAnswers: opened,
              achievedPoints: undefined,
            });
          }
          return true;
        },
    };
  },

  addProseMirrorPlugins() {
    const { editor } = this;
    return [
      new Plugin({
        key: new PluginKey("stepsSync"),
        appendTransaction: (transactions, _oldState, newState) => {
          if (!editor.isEditable) return null;
          if (transactions.some(isChangeOrigin)) return null;
          if (!transactions.some((transaction) => transaction.docChanged)) {
            return null;
          }

          const { tr } = newState;
          let modified = false;
          newState.doc.descendants((node, pos) => {
            if (node.type.name !== STEPS_NODE_NAME) return true;

            const { questionBlockAttributes: attributes } = getNodeAttributes<{
              questionBlockAttributes: { questionData: QuestionData };
            }>(node);
            const authored = attributes.questionData;
            const questionData: QuestionData = {
              stepCount: node.childCount,
              firstEmptyStep: findEmptyStep(node),
            };
            if (
              authored.stepCount !== questionData.stepCount ||
              authored.firstEmptyStep !== questionData.firstEmptyStep
            ) {
              tr.setNodeAttribute(pos, "questionBlockAttributes", {
                ...attributes,
                questionData,
              });
              modified = true;
            }
            return false;
          });

          return modified ? tr : null;
        },
      }),
    ];
  },

  addKeyboardShortcuts() {
    return {
      /* eslint-disable @typescript-eslint/naming-convention */
      "Mod-Enter": ({ editor }) => editor.commands.addStep(),
      Backspace: ({ editor }) => {
        const { selection } = editor.state;
        if (!selection.empty) return false;
        const depth = stepDepth(selection.$from);
        if (depth === null) return false;

        const step = selection.$from.node(depth);
        if (step.childCount !== 1 || step.firstChild?.nodeSize !== 2) {
          return false;
        }
        return editor.commands.removeStep();
      },
      /* eslint-enable @typescript-eslint/naming-convention */
    };
  },

  addHtmlSchemaAwareness() {
    return {
      tag: "div",
      name: "Steps",
      description:
        "An interactive step-by-step / process block. Contains one or more step divs, numbered automatically. Each step is collapsed until the learner opens it, and a step only unlocks once the one before it has been opened; the scene cannot be finished until every step has been opened. Use for chronologies, procedures, or step-by-step instructions.",
      attributes: [
        {
          attr: "data-type",
          value: STEPS_NODE_NAME,
          description: "Identifies this div as a steps container",
        },
        questionBlockSchemaAttribute(defaultQuestionData),
      ],
    };
  },

  // eslint-disable-next-line @typescript-eslint/naming-convention
  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": STEPS_NODE_NAME }),
      0,
    ];
  },

  parseHTML() {
    return [{ tag: `div[data-type="${STEPS_NODE_NAME}"]` }];
  },

  ...createBlockMarkdownSpec({
    nodeName: STEPS_NODE_NAME,
    name: "steps",
    content: "block",

    allowedAttributes: [],
  }),
});

export function createStepsNode(options: StepsNodeOptions = {}) {
  const nodeView = options.nodeView;
  return stepsNode.extend(
    nodeView
      ? {
          addNodeView() {
            return nodeView;
          },
        }
      : {},
  );
}
