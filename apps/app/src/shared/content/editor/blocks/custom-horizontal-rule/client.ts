"use client";

import type { NodeViewRenderer } from "@tiptap/core";
import type { ClientNodeViewBinding } from "@/shared/content/editor/blocks/registry/types";

import { CUSTOM_HR_NODE } from "./schema";

const horizontalRuleNodeView: NodeViewRenderer = () => {
  const wrapper = document.createElement("div");
  wrapper.classList.add(CUSTOM_HR_NODE);
  const hr = document.createElement("hr");
  wrapper.append(hr);

  wrapper.style.cssText = `width: 100%; height: 48px; cursor: default; position:relative; display:flex; align-items: center; justify-content: center; margin-top: 8px; margin-bottom: 8px;`;
  hr.style.cssText = `width: 60%; height: 2px; border-radius: 2px; cursor: default; border: none; background-color: var(--editor-primary-color, rgb(229,231,235)); opacity: 0.3;`;

  return {
    dom: wrapper,
  };
};

export const horizontalRuleNodeViewBindings = [
  {
    nodeViewKey: CUSTOM_HR_NODE,
    nodeView: horizontalRuleNodeView,
  },
] as const satisfies readonly ClientNodeViewBinding[];
