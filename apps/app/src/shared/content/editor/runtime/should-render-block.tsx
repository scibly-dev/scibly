import type { Editor, NodeViewProps } from "@tiptap/core";
import type { ComponentType, JSX } from "react";

import isEqual from "react-fast-compare";

type BlockProps = NodeViewProps | { nodeViewProps: NodeViewProps };

function getEditor(props: BlockProps): Editor {
  return "editor" in props ? props.editor : props.nodeViewProps.editor;
}

// Hides an empty block in readonly mode so a teacher-forgotten placeholder
// (e.g. an unused image/video block) isn't editable by learners — a UX guard, not a security boundary.
function shouldRenderBlock<T, V = null, K extends BlockProps = NodeViewProps>(
  initialState: T,
  currentState: T | V,
  nodeViewProps: K,
  BlockComponent: ComponentType<K>,
): JSX.Element | null {
  const isEmpty = isEqual(initialState, currentState);
  if (isEmpty && !getEditor(nodeViewProps).isEditable) return null;

  return <BlockComponent {...nodeViewProps} />;
}

export default shouldRenderBlock;
