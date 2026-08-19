import type { NodeViewProps } from "@tiptap/core";

import {
  EditableState,
  getNodeAttributes,
} from "@/shared/content/editor/blocks/attributes/get-default-react-block-attributes";

const isBlockEditable = (
  isEditorEditable: boolean,
  node: NodeViewProps["node"],
): boolean => {
  const attrs = getNodeAttributes(node);
  return isEditorEditable || attrs.isEditable === EditableState.Editable;
};

export default isBlockEditable;
