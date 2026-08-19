import type { NodeViewProps } from "@tiptap/core";

function typedUpdateAttributes<T extends object, K extends keyof T>(
  updateFunc: NodeViewProps["updateAttributes"],
  attribute: K,
  value: T[K],
): void;

function typedUpdateAttributes<T extends object>(
  updateFunc: NodeViewProps["updateAttributes"],
  attributes: Partial<T>,
): void;

function typedUpdateAttributes<T extends object, K extends keyof T>(
  updateFunc: NodeViewProps["updateAttributes"],
  attributeOrAttributes: K | Partial<T>,
  value?: T[K],
): void {
  if (typeof attributeOrAttributes === "string") {
    updateFunc({ [attributeOrAttributes]: value });
  } else {
    // SAFETY: the overloads above admit a `K` or a `Partial<T>`, and every `K`

    updateFunc(attributeOrAttributes as Partial<T>);
  }
}
export default typedUpdateAttributes;
