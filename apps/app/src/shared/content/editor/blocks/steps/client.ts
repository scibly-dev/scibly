"use client";

import type { ClientNodeViewBinding } from "@/shared/content/editor/blocks/registry/types";

import { ReactNodeViewRenderer } from "@tiptap/react";

import StepView from "./components/step-view";
import StepsView from "./components/steps-view";
import { STEP_NODE_NAME, STEPS_NODE_NAME } from "./schema";

export const stepsNodeViewBindings = [
  {
    nodeViewKey: STEPS_NODE_NAME,
    nodeView: ReactNodeViewRenderer(StepsView),
  },
  {
    nodeViewKey: STEP_NODE_NAME,
    nodeView: ReactNodeViewRenderer(StepView),
  },
] as const satisfies readonly ClientNodeViewBinding[];
