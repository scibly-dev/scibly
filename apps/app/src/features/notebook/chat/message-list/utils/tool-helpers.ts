import type { IconProps } from "@scibly/ui/components/icon";
import type { NotebookMessage } from "@/features/notebook/chat/contracts";
import type { NotebookUITools } from "@/features/notebook/chat/tools/index";
import type {
  ToolMetadata,
  ToolName,
} from "@/features/notebook/chat/tools/metadata";
import type { NotebookToolPart } from "@/features/notebook/chat/tools/tool-parts";
import type { DeletionToolPart } from "../deletion/deletion.types";
import type { MultipleChoiceQuestionInvocation } from "../multiple-choice/multiple-choice.types";
import type { UnparsedUxCall } from "../shared/unparsed-ux-call";

import { getStaticToolName, isStaticToolUIPart } from "ai";

import { isApprovalGatedTool } from "@/features/notebook/chat/tools/client-tool-definitions";
import {
  TOOL_METADATA_REGISTRY,
  type ToolIconId,
  type ToolStepPresentation,
} from "@/features/notebook/chat/tools/metadata";
import {
  getToolParts,
  isToolPartDone,
} from "@/features/notebook/chat/tools/tool-parts";
import { parseAskMultipleChoiceInput } from "@/features/notebook/chat/tools/ux-tools";

import { hasMeaningfulMultipleChoiceAnswer } from "../multiple-choice/multiple-choice-utils";
import { findPendingInNewestTurn } from "../shared/newest-assistant-turn";
import { findUnparsedUxCall } from "../shared/unparsed-ux-call";

export {
  getInvalidPlanInvocationForPart,
  getPendingPlanInvocation,
  getPlanInvocationForPart,
  getPlanInvocations,
  getVisiblePlanInvocations,
} from "../planning/plan-tool-helpers";

const TOOL_ICON_NAMES = {
  search: "Search",
  book: "BookOpen",
  compass: "Compass",
  edit: "FilePenLine",
  wrench: "Wrench",
} as const satisfies Record<ToolIconId, IconProps["name"]>;

export function getToolIconName(toolName: ToolName): IconProps["name"] {
  const iconId = TOOL_METADATA_REGISTRY[toolName]?.iconId ?? "wrench";
  return TOOL_ICON_NAMES[iconId];
}

function toolMetadata(toolName: ToolName) {
  // SAFETY: TypeScript cannot carry the registry's per-tool input correlation

  return TOOL_METADATA_REGISTRY[toolName] as ToolMetadata<ToolName> | undefined;
}

function getToolStepPresentation(part: NotebookToolPart): ToolStepPresentation {
  const isDone = isToolPartDone(part);
  const toolName = getStaticToolName<NotebookUITools>(part);

  return (
    toolMetadata(toolName)?.getStepPresentation({
      input: part.input ?? {},
      output: part.output,
      isDone,
    }) ?? {
      label: isDone
        ? `Executed tool ${toolName}`
        : `Executing tool ${toolName}...`,
    }
  );
}

export interface GroupedToolStep {
  key: string;
  toolName: ToolName;
  count: number;
  isDone: boolean;
  presentation: ToolStepPresentation;
}

export function groupConsecutiveToolSteps(
  toolParts: NotebookToolPart[],
): GroupedToolStep[] {
  const groups: GroupedToolStep[] = [];

  for (const part of toolParts) {
    const toolName = getStaticToolName<NotebookUITools>(part);
    const isDone = isToolPartDone(part);
    const presentation = getToolStepPresentation(part);
    const last = groups[groups.length - 1];

    if (
      last &&
      last.toolName === toolName &&
      last.isDone === isDone &&
      last.presentation.label === presentation.label
    ) {
      last.count += 1;
      last.presentation = {
        ...presentation,
        detail: [presentation.detail, `${last.count}× in this run`]
          .filter(Boolean)
          .join(" · "),
      };
      continue;
    }

    groups.push({
      key: part.toolCallId,
      toolName,
      count: 1,
      isDone,
      presentation,
    });
  }

  return groups;
}

export function isInlineDeletionConfirmationPart(
  part: NotebookMessage["parts"][number],
): part is DeletionToolPart {
  return (
    isStaticToolUIPart(part) &&
    isApprovalGatedTool(getStaticToolName<NotebookUITools>(part)) &&
    part.state !== "input-streaming"
  );
}

function getMultipleChoiceInvocations(
  message?: NotebookMessage,
): MultipleChoiceQuestionInvocation[] {
  const invocations: MultipleChoiceQuestionInvocation[] = [];

  for (const part of getToolParts(message)) {
    if (part.type !== "tool-askMultipleChoice") continue;

    if (part.state === "input-streaming") continue;

    const parsed = parseAskMultipleChoiceInput(part.input);
    if (!parsed) continue;

    invocations.push({
      toolCallId: part.toolCallId,
      questions: parsed.questions,

      isAnswered: isToolPartDone(part),
      answer: part.state === "output-available" ? part.output : undefined,
    });
  }

  return invocations;
}

export function getMultipleChoiceInvocationForPart(
  message: NotebookMessage | undefined,
  toolCallId: string | undefined,
): MultipleChoiceQuestionInvocation | null {
  if (!message || !toolCallId) return null;

  return (
    getMultipleChoiceInvocations(message).find(
      (invocation) => invocation.toolCallId === toolCallId,
    ) ?? null
  );
}

function getVisibleMultipleChoiceInvocations(
  message?: NotebookMessage,
): MultipleChoiceQuestionInvocation[] {
  return getMultipleChoiceInvocations(message).filter(
    (invocation) =>
      !invocation.isAnswered ||
      hasMeaningfulMultipleChoiceAnswer(invocation.answer),
  );
}

export function getPendingMultipleChoiceInvocation(
  messages: NotebookMessage[],
): MultipleChoiceQuestionInvocation | null {
  return findPendingInNewestTurn(messages, getVisibleMultipleChoiceInvocations);
}

export function getInvalidMultipleChoiceInvocationForPart(
  message: NotebookMessage | undefined,
  toolCallId: string | undefined,
): UnparsedUxCall | null {
  if (getMultipleChoiceInvocationForPart(message, toolCallId)) return null;

  return findUnparsedUxCall(message, toolCallId, "askMultipleChoice");
}
