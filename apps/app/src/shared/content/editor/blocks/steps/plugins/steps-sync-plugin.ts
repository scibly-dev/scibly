import type { AuthorDocumentEditor } from "@/shared/content/editor/documents/author-document-editor";

import { isChangeOrigin } from "@tiptap/extension-collaboration";
import { Plugin, PluginKey } from "@tiptap/pm/state";

import { getNodeAttributes } from "@/shared/content/editor/blocks/attributes/get-default-react-block-attributes";
import {
  findEmptyStep,
  type QuestionData,
  STEPS_NODE_NAME,
} from "@/shared/content/editor/blocks/steps/schema";

/** Remote y-sync transactions are skipped so the derivation runs once, on the
 * peer that made the edit. */
export function createStepsSyncPlugin(editor: AuthorDocumentEditor): Plugin {
  return new Plugin({
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
  });
}
