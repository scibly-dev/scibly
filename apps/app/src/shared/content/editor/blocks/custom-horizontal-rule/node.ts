import type { NodeViewRenderer } from "@tiptap/core";

import { isNodeSelection, mergeAttributes, nodeInputRule } from "@tiptap/core";
import { HorizontalRule as BaseHorizontalRule } from "@tiptap/extension-horizontal-rule";
import { NodeSelection, TextSelection } from "@tiptap/pm/state";

import { CUSTOM_HR_NODE } from "@/shared/content/editor/blocks/custom-horizontal-rule/schema";

interface HorizontalRuleOptions {
  HTMLAttributes: Record<string, string | number | boolean>;
}

const pdfStyles = `width: 100%; height: 2px; cursor: default; background-color: var(--editor-primary-color, rgb(229,231,235)); opacity: 0.5; outline: none; border: none; padding: 0; margin-top: 10px; margin-bottom: 10px;`;

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    horizontalRule: {
      setHorizontalRule: () => ReturnType;
    };
  }
}

const horizontalRuleNode = BaseHorizontalRule.extend<HorizontalRuleOptions>({
  name: CUSTOM_HR_NODE,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  group: "block",

  parseHTML() {
    return [{ tag: "hr" }];
  },

  parseMarkdown(token, helpers) {
    return helpers.createNode(CUSTOM_HR_NODE);
  },

  // eslint-disable-next-line @typescript-eslint/naming-convention
  renderHTML({ HTMLAttributes }) {
    return ["hr", mergeAttributes(HTMLAttributes, { style: pdfStyles })];
  },

  addHtmlSchemaAwareness() {
    return {
      tag: "hr",
      name: "Horizontal Rule",
      description:
        "A thematic break rendered as a horizontal divider line between content sections.",
    };
  },

  addCommands() {
    return {
      setHorizontalRule:
        () =>
        ({ chain, state }) => {
          const { selection } = state;
          const { $from: $originFrom, $to: $originTo } = selection;

          const currentChain = chain();

          if ($originFrom.parentOffset === 0) {
            currentChain.insertContentAt(
              {
                from: Math.max($originFrom.pos - 1, 0),
                to: $originTo.pos,
              },
              {
                type: this.name,
              },
            );
          } else if (isNodeSelection(selection)) {
            currentChain.insertContentAt($originTo.pos, {
              type: this.name,
            });
          } else {
            currentChain.insertContent({ type: this.name });
          }

          return currentChain

            .command(({ tr, dispatch }) => {
              if (dispatch) {
                const { $to } = tr.selection;
                const posAfter = $to.end();

                if ($to.nodeAfter) {
                  if ($to.nodeAfter.isTextblock) {
                    tr.setSelection(TextSelection.create(tr.doc, $to.pos + 1));
                  } else if ($to.nodeAfter.isBlock) {
                    tr.setSelection(NodeSelection.create(tr.doc, $to.pos));
                  } else {
                    tr.setSelection(TextSelection.create(tr.doc, $to.pos));
                  }
                } else {
                  const node =
                    $to.parent.type.contentMatch.defaultType?.create();

                  if (node) {
                    tr.insert(posAfter, node);
                    tr.setSelection(TextSelection.create(tr.doc, posAfter + 1));
                  }
                }

                tr.scrollIntoView();
              }

              return true;
            })
            .run();
        },
    };
  },
  addInputRules() {
    return [
      nodeInputRule({
        find: /^(?:---|—-|___\s|\*\*\*\s)$/,
        type: this.type,
      }),
    ];
  },
});

export function createHorizontalRuleNode(
  options: Readonly<{ nodeView?: NodeViewRenderer }> = {},
) {
  const nodeView = options.nodeView;
  return horizontalRuleNode.extend(
    nodeView
      ? {
          addNodeView() {
            return nodeView;
          },
        }
      : {},
  );
}
