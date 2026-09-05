import type { NotebookRuntimeContext } from "@/features/notebook/server";

import { tool } from "ai";
import { z } from "zod";

import { readAgentProse } from "@/shared/ai/agent-prose";

import {
  getPracticeSchema,
  validatePracticeSchema,
  writePracticeSchema,
} from "../scenes/api/scene.schema";

export function buildPracticeTools(context: NotebookRuntimeContext) {
  return {
    getPracticeContract: tool({
      description:
        "Get the contract for PRACTICE scenes: the injected SDK (window.scibly), the solution schema, " +
        "the self-test hook, when a scene needs no submit at all, the CDN allowlist and a worked example. " +
        "You MUST call this BEFORE using writePractice to know the SDK your app must call.",
      inputSchema: z.object({}),
      execute: async () => ({
        contract: await readAgentProse("practice-contract.md"),
      }),
    }),
    getPractice: tool({
      description:
        "Read a PRACTICE scene's current html, solution, explanation and validation status.",
      inputSchema: getPracticeSchema,
      execute: async (input) => context.caller.scene.getPractice(input),
    }),
    writePractice: tool({
      description:
        "Write a PRACTICE scene's html, solution and explanation, replacing all three at once. " +
        "The html must be an app the learner operates — something they drag, aim, build or run, " +
        "that reacts visibly on every interaction, and — when it has a solution — shows the graded " +
        "result in place via window.scibly.onGraded. Pass solution: null for an exploratory scene " +
        "the learner just plays with; it then needs no submit and no Submit button. Question text plus " +
        "<input> fields and a Submit button is not a practice scene; that belongs in a DOCUMENT " +
        "scene's question block. " +
        "Call getPracticeContract first if you have not already.",
      inputSchema: writePracticeSchema,
      execute: async (input) => context.caller.scene.writePractice(input),
    }),
    validatePractice: tool({
      description:
        "Grade a payload against a PRACTICE scene's stored solution, the same way a learner's " +
        "submit(work) would be graded, and report whether the scene is publishable. Pass " +
        "window.__sciblySelfTest()'s return value as work to check the app awards full marks. " +
        "`problems` comes back with exactly what publishCourse would refuse this scene for, so " +
        "an empty list plus full marks means the scene is done.",
      inputSchema: validatePracticeSchema,
      execute: async (input) => context.caller.scene.validatePractice(input),
    }),
  };
}
