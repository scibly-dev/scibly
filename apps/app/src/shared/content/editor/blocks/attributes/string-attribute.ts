import type { Node as PMNode } from "@tiptap/pm/model";

export const stringAttribute = (node: PMNode, name: string): string | null =>
  typeof node.attrs[name] === "string" ? node.attrs[name] : null;
