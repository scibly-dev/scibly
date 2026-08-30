import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { HintBlockAttributes } from "@/shared/content/editor/blocks/hint/node";

import { Extension } from "@tiptap/core";
import { Plugin, PluginKey, type Transaction } from "@tiptap/pm/state";

import { getNodeAttributes } from "@/shared/content/editor/blocks/attributes/get-default-react-block-attributes";
import { INLINE_HINT_NODE_NAME } from "@/shared/content/editor/blocks/hint/schema";

const countWords = (text?: string): number => {
  if (!text) return 0;
  return text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
};

// Inline hints hold their text in an attribute rather than in child text
// nodes, so `descendants` never reaches it.
const hintContent = (node: ProseMirrorNode): string =>
  node.type.name === INLINE_HINT_NODE_NAME
    ? (getNodeAttributes<HintBlockAttributes>(node).content ?? "")
    : "";

// Exported as plain functions so anything holding a ProseMirror node — including
// the headless server writer, which has no `Editor` — counts the same way.
export function countCharacters(node: ProseMirrorNode): number {
  let characterCount = 0;

  node.content.descendants((node) => {
    if (node.isText) {
      characterCount += node.text?.length ?? 0;
    } else {
      characterCount += hintContent(node).length;
    }
  });
  return characterCount;
}

export function countBlocks(node: ProseMirrorNode): number {
  let blockCount = 0;

  node.nodesBetween(0, node.content.size, (node) => {
    if (node.isBlock) {
      blockCount++;
    }
  });

  return blockCount;
}

interface EditorCountOptions {
  charLimit: number | null | undefined;
  blockLimit: number | null | undefined;
}

export interface EditorCountStorage {
  characters: (options?: { node?: ProseMirrorNode }) => number;
  words: (options?: { node?: ProseMirrorNode }) => number;
  blocks: (options?: { node?: ProseMirrorNode }) => number;
  maxCharacters: number;
  maxBlocks: number;
}

declare module "@tiptap/core" {
  interface Storage {
    editorCount: EditorCountStorage;
  }
}

function checkLimit(oldSize: number, newSize: number, limit: number) {
  if (newSize <= limit) {
    return true;
  }

  const limitAlreayExceeded = oldSize > limit && newSize > limit;

  if (limitAlreayExceeded && newSize <= oldSize) {
    return true;
  }

  if (limitAlreayExceeded && newSize > oldSize) {
    return false;
  }
}

function getOldNewCount(
  storageFunc: (options?: { node?: ProseMirrorNode }) => number,
  oldDoc: ProseMirrorNode,
  newDoc: ProseMirrorNode,
) {
  return {
    oldCount: storageFunc({ node: oldDoc }),
    newCount: storageFunc({ node: newDoc }),
  };
}

function deleteExceedingRange(
  transaction: Transaction,
  charLimit?: number,
  blockLimit?: number,
  isCharLimitExceeded?: boolean,
  isBlockLimitExceeded?: boolean,
) {
  const to = transaction.selection.$head.pos;
  let from = to;
  let nodeTextLength = 0;

  if (charLimit && isCharLimitExceeded) {
    let text = "";
    transaction.doc.nodesBetween(
      0,
      transaction.doc.content.size,
      (node, nodePos) => {
        if (text.length <= charLimit && node.isText && node.text) {
          nodeTextLength = node.text.length;
          text += node.text;
          from = nodePos;
        }
      },
    );
    let over = 0;
    if (text.length > charLimit) {
      over = text.length - charLimit;
    }
    from += nodeTextLength - over;
  } else if (blockLimit && isBlockLimitExceeded) {
    let blockCount = 0;
    transaction.doc.nodesBetween(
      0,
      transaction.doc.content.size,
      (node, nodePos) => {
        if (blockCount <= blockLimit && node.isBlock) {
          blockCount++;
          from = nodePos;
        }
      },
    );
  }

  transaction.deleteRange(from, to);
}

function checkUpdatedDoc(
  transaction: Transaction,
  storage: EditorCountStorage,
  type: "characters" | "blocks",
  limit: number,
) {
  const updatedSize = storage[type]({
    node: transaction.doc,
  });

  return updatedSize <= limit;
}

export const EditorCount = Extension.create<
  EditorCountOptions,
  EditorCountStorage
>({
  name: "editorCount",

  addOptions() {
    return {
      charLimit: null,
      blockLimit: null,
    };
  },

  addStorage() {
    return {
      maxCharacters: this.options.charLimit ?? 0,
      maxBlocks: this.options.blockLimit ?? 0,
      characters: () => 0,
      words: () => 0,
      blocks: () => 0,
    };
  },

  onBeforeCreate() {
    this.storage.characters = (options) =>
      countCharacters(options?.node ?? this.editor.state.doc);

    this.storage.words = (options) => {
      const node = options?.node ?? this.editor.state.doc;
      let wordCount = 0;

      node.content.descendants((node) => {
        if (node.isText) {
          wordCount += countWords(node.text);
        } else {
          wordCount += countWords(hintContent(node));
        }
      });
      return wordCount;
    };

    this.storage.blocks = (options) =>
      countBlocks(options?.node ?? this.editor.state.doc);
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("characterCount"),
        filterTransaction: (transaction, state) => {
          const { charLimit, blockLimit } = this.options;

          if (!transaction.docChanged) return true;

          const isCharLimitSet =
            charLimit !== null && charLimit !== undefined && charLimit > 0;
          const isBlockLimitSet =
            blockLimit !== null && blockLimit !== undefined && blockLimit > 0;

          if (!isCharLimitSet && !isBlockLimitSet) return true;

          let isCharLimitExceeded = false;
          let isBlockLimitExceeded = false;

          if (isCharLimitSet) {
            const counts = getOldNewCount(
              this.storage.characters,
              state.doc,
              transaction.doc,
            );
            const isAllowed = checkLimit(
              counts.oldCount,
              counts.newCount,
              charLimit,
            );
            isCharLimitExceeded = !isAllowed;
            if (isAllowed === false) return false;
          }

          if (isBlockLimitSet) {
            const counts = getOldNewCount(
              this.storage.blocks,
              state.doc,
              transaction.doc,
            );
            const isAllowed = checkLimit(
              counts.oldCount,
              counts.newCount,
              blockLimit,
            );
            isBlockLimitExceeded = !isAllowed;
            if (isAllowed === false) return false;
          }

          if (isCharLimitExceeded || isBlockLimitExceeded) {
            const isPaste = !!transaction.getMeta("paste");

            if (!isPaste) {
              return false;
            }
            if (isBlockLimitSet && isBlockLimitExceeded) {
              deleteExceedingRange(
                transaction,
                undefined,
                blockLimit,
                undefined,
                isBlockLimitExceeded,
              );

              const isAllowed = checkUpdatedDoc(
                transaction,
                this.storage,
                "blocks",
                blockLimit,
              );
              if (!isAllowed) return false;
            }

            if (isCharLimitSet && isCharLimitExceeded) {
              deleteExceedingRange(
                transaction,
                charLimit,
                undefined,
                isCharLimitExceeded,
              );
              const isAllowed = checkUpdatedDoc(
                transaction,
                this.storage,
                "characters",
                charLimit,
              );
              if (!isAllowed) return false;
            }
          }

          return true;
        },
      }),
    ];
  },
});

export default EditorCount;
