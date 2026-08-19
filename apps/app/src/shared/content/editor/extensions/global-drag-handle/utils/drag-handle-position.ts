import { type Middleware, offset, type VirtualElement } from "@floating-ui/dom";

import {
  getDragHandleEditor,
  getDragHandleTarget,
} from "@/shared/content/editor/extensions/global-drag-handle/state/selection-bridge";

const LIST_HANDLE_COLUMN_PADDING = 12;

const LIST_TARGET_TYPES = new Set([
  "listItem",
  "orderedList",
  "bulletList",
  "taskItem",
  "taskList",
]);

function resolveDragHandleReferenceElement(
  dom: Element,
  nodeTypeName: string,
): Element {
  if (nodeTypeName.startsWith("custom-")) {
    const nodeViewWrapper = dom.closest("[data-node-view-wrapper]");
    if (nodeViewWrapper instanceof Element) {
      return nodeViewWrapper;
    }

    const reactRenderer = dom.closest(".react-renderer");
    if (reactRenderer instanceof Element) {
      return reactRenderer;
    }
  }

  return dom;
}

function resolveListOffsetReference(dom: Element): Element {
  const listItem = dom.closest("li");
  if (listItem instanceof Element) {
    return listItem;
  }

  const listRoot = dom.closest("ol, ul");
  if (listRoot instanceof Element) {
    return listRoot;
  }

  return dom;
}

function isListDragTarget(nodeTypeName: string, dom: Element | null): boolean {
  if (LIST_TARGET_TYPES.has(nodeTypeName)) {
    return true;
  }

  return dom instanceof Element && dom.closest("li, ol, ul") != null;
}

function getListHandleMainAxisOffset(
  reference: Element,
  editorDom: Element,
): number {
  const referenceRect = reference.getBoundingClientRect();
  const editorRect = editorDom.getBoundingClientRect();
  const inset =
    referenceRect.left - editorRect.left + LIST_HANDLE_COLUMN_PADDING;

  return Math.max(0, inset);
}

export function getDragHandleVirtualElement(): VirtualElement | null {
  const target = getDragHandleTarget();
  const editor = getDragHandleEditor();
  if (!target || !editor) return null;

  const dom = editor.view.nodeDOM(target.pos);
  if (!(dom instanceof Element)) return null;

  const reference = resolveDragHandleReferenceElement(
    dom,
    target.node.type.name,
  );
  const rect = reference.getBoundingClientRect();

  return {
    getBoundingClientRect: () => rect,
    getClientRects: () => [rect],
  };
}

export function getDragHandleOffsetMiddleware(): Middleware {
  return offset(() => {
    const target = getDragHandleTarget();
    const editor = getDragHandleEditor();
    if (!target || !editor) {
      return { mainAxis: 0, crossAxis: 0 };
    }

    const dom = editor.view.nodeDOM(target.pos);
    if (!(dom instanceof Element)) {
      return { mainAxis: 0, crossAxis: 0 };
    }

    if (!isListDragTarget(target.node.type.name, dom)) {
      return { mainAxis: 0, crossAxis: 0 };
    }

    const listReference = resolveListOffsetReference(dom);

    return {
      mainAxis: getListHandleMainAxisOffset(listReference, editor.view.dom),
      crossAxis: 0,
    };
  });
}
