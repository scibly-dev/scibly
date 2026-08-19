import type { Node as PMNode } from "@tiptap/pm/model";
import type { ResolvedPos, Slice } from "@tiptap/pm/model";
import type { EditorView } from "@tiptap/pm/view";

import { NodeSelection, Plugin } from "@tiptap/pm/state";

import { GUIDE_CHARACTER_NODE_NAME } from "@/shared/content/editor/blocks/guide-character/schema";
import { wrapSliceForOrderedListDrop } from "@/shared/content/editor/extensions/global-drag-handle/plugins/list-drop-fix";
import { getDraggingNodeSelection } from "@/shared/content/editor/extensions/global-drag-handle/state/dragging-state";
import { trackListSourceTypeFromDragTarget } from "@/shared/content/editor/extensions/global-drag-handle/state/list-context";
import { isInsideGuideSpeech } from "@/shared/content/editor/extensions/global-drag-handle/utils/dom-guards";

type GuideExtractContext = {
  guidePos: number;
  nodePos: number;
  nodeSize: number;
};

let pendingGuideExtract: GuideExtractContext | null = null;

function findGuideCharacterDepth($pos: {
  depth: number;
  node: (depth: number) => { type: { name: string } };
}): number | null {
  for (let depth = $pos.depth; depth > 0; depth -= 1) {
    if ($pos.node(depth).type.name === GUIDE_CHARACTER_NODE_NAME) {
      return depth;
    }
  }
  return null;
}

function isDirectGuideChild($pos: ResolvedPos): boolean {
  const guideDepth = findGuideCharacterDepth($pos);
  return guideDepth != null && $pos.depth === guideDepth + 1;
}

function createGuideExtractContext(
  view: EditorView,
  node: PMNode,
  pos: number,
): GuideExtractContext | null {
  if (pos < 0 || node.type.name === GUIDE_CHARACTER_NODE_NAME) {
    return null;
  }

  const $pos = view.state.doc.resolve(pos);
  const guideDepth = findGuideCharacterDepth($pos);
  if (guideDepth == null || !isDirectGuideChild($pos)) {
    return null;
  }

  return {
    guidePos: $pos.before(guideDepth),
    nodePos: pos,
    nodeSize: node.nodeSize,
  };
}

export function trackGuideExtractFromDragTarget(
  view: EditorView,
  node: PMNode,
  pos: number,
) {
  pendingGuideExtract = createGuideExtractContext(view, node, pos);
}

function clearGuideExtractContext() {
  pendingGuideExtract = null;
}

function resolveGuideExtractContext(
  view: EditorView,
): GuideExtractContext | null {
  const draggingSelection = getDraggingNodeSelection(view);
  if (draggingSelection) {
    const fromSelection = createGuideExtractContext(
      view,
      draggingSelection.node,
      draggingSelection.from,
    );
    if (fromSelection) {
      return fromSelection;
    }
  }

  return pendingGuideExtract;
}

function resolveBlockInsertPos($pos: ResolvedPos): number {
  if ($pos.depth === 0) {
    return $pos.pos;
  }

  for (let depth = $pos.depth; depth > 0; depth -= 1) {
    const node = $pos.node(depth);
    if (node.isBlock && node.type.name !== GUIDE_CHARACTER_NODE_NAME) {
      return $pos.before(depth);
    }
  }

  return $pos.before(1);
}

function performGuideExtractDrop(
  view: EditorView,
  slice: Slice,
  context: GuideExtractContext,
  insertPos: number,
) {
  const guideNode = view.state.doc.nodeAt(context.guidePos);
  if (!guideNode || guideNode.type.name !== GUIDE_CHARACTER_NODE_NAME) {
    return false;
  }

  const { nodePos, nodeSize } = context;
  let tr = view.state.tr.delete(nodePos, nodePos + nodeSize);
  const mappedInsertPos = tr.mapping.map(insertPos, -1);
  tr = tr.insert(mappedInsertPos, slice.content);
  view.dispatch(tr.scrollIntoView());
  return true;
}

export function createGuideExtractDropPlugin() {
  return new Plugin({
    props: {
      handleDOMEvents: {
        dragstart(view) {
          const { selection } = view.state;
          if (selection instanceof NodeSelection) {
            trackGuideExtractFromDragTarget(
              view,
              selection.node,
              selection.from,
            );
          }
          return false;
        },
        dragend() {
          clearGuideExtractContext();
          return false;
        },
      },
      handleDrop(view, event, slice) {
        if (!slice?.size) {
          return false;
        }

        const context = resolveGuideExtractContext(view);
        if (!context) {
          return false;
        }

        const coords = { x: event.clientX, y: event.clientY };
        if (isInsideGuideSpeech(coords)) {
          clearGuideExtractContext();
          return false;
        }

        const draggingSelection = getDraggingNodeSelection(view);
        if (draggingSelection) {
          trackListSourceTypeFromDragTarget(
            view,
            draggingSelection.node,
            draggingSelection.from,
          );
        }

        const preparedSlice = wrapSliceForOrderedListDrop(view, event, slice);

        const guideNode = view.state.doc.nodeAt(context.guidePos);
        if (!guideNode) {
          clearGuideExtractContext();
          return false;
        }

        const dropPos = view.posAtCoords({
          left: coords.x,
          top: coords.y,
        });
        let insertPos = context.guidePos + guideNode.nodeSize;

        if (dropPos) {
          const $drop = view.state.doc.resolve(dropPos.pos);
          const dropGuideDepth = findGuideCharacterDepth($drop);
          const dropInsideSameGuide =
            dropGuideDepth != null &&
            $drop.before(dropGuideDepth) === context.guidePos;

          if (dropInsideSameGuide) {
            insertPos = context.guidePos + guideNode.nodeSize;
          } else {
            insertPos = resolveBlockInsertPos($drop);
          }
        }

        const handled = performGuideExtractDrop(
          view,
          preparedSlice,
          context,
          insertPos,
        );
        clearGuideExtractContext();
        return handled;
      },
    },
  });
}
