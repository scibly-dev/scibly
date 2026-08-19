import type { Node, NodeViewRenderer } from "@tiptap/core";
import type { EditorSchemaExtensionEntry, TiptapExtension } from "./types";

export function extensionEntry(
  extension: TiptapExtension,
): EditorSchemaExtensionEntry {
  return { extension };
}

export function nodeEntry(
  extension: Node,
  withNodeView: (nodeView: NodeViewRenderer) => Node,
): EditorSchemaExtensionEntry {
  return { extension, nodeViewKey: extension.name, withNodeView };
}
