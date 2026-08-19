import type { DeepPartial } from "ai";
import type { AppTools, NotebookUITools } from "./index";

import { COURSE_TOOL_METADATA } from "./metadata-course";
import { EDITOR_TOOL_METADATA } from "./metadata-editor";
import { SOURCE_TOOL_METADATA } from "./metadata-source";
import { UX_TOOL_METADATA } from "./metadata-ux";

export type ToolName = keyof AppTools;

export type ToolIconId = "search" | "book" | "compass" | "edit" | "wrench";

export interface ToolStepPresentation {
  label: string;
  detail?: string;
  context?: string;

  contextHref?: string;
}

type ToolInput<N extends ToolName> = DeepPartial<NotebookUITools[N]["input"]>;

export type ToolOutput<N extends ToolName> =
  | NotebookUITools[N]["output"]
  | undefined;

interface ToolStepPresentationContext<N extends ToolName> {
  input: ToolInput<N>;
  output: ToolOutput<N>;
  isDone: boolean;
}

export interface ToolMetadata<N extends ToolName> {
  iconId: ToolIconId;
  getStepPresentation: (
    context: ToolStepPresentationContext<N>,
  ) => ToolStepPresentation;
}

export type ToolMetadataRegistry = {
  [N in ToolName]?: ToolMetadata<N>;
};

export function truncate(text: string, max = 96): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max - 1)}…`;
}

export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function firstHeading(html: string): string | undefined {
  const match = html.match(/<h[1-3][^>]*>([^<]+)</i);
  return match?.[1]?.trim();
}

export function firstSentence(text: string): string | undefined {
  const trimmed = text.trim();
  if (!trimmed) return undefined;
  const match = trimmed.match(/^(.{1,120}?[.!?])(?:\s|$)/);
  return match?.[1]?.trim() ?? truncate(trimmed, 96);
}

const SKILL_DISPLAY_NAMES = new Map([
  ["discovery", "Discovery playbook"],
  ["lesson-design", "Lesson design playbook"],
  ["scene-content", "Scene content playbook"],
  ["batch-flow", "Course build workflow"],
  ["review-check", "Course review checklist"],
  ["educational-visuals", "Educational visuals playbook"],
]);

export function humanSkillName(slug: string): string {
  return SKILL_DISPLAY_NAMES.get(slug) ?? slug.replace(/-/g, " ");
}

export function formatSceneTitles(
  scenes: Array<{ title?: string }>,
  max = 3,
): string | undefined {
  const titles = scenes
    .map((scene) => scene.title?.trim())
    .filter((title): title is string => Boolean(title));
  if (!titles.length) return undefined;

  const shown = titles.slice(0, max).join(", ");
  if (titles.length > max) {
    return `${shown}, +${titles.length - max} more`;
  }
  return shown;
}

export function formatSourceGrounding(
  sourceCount: number | undefined,
): string | undefined {
  if (sourceCount === undefined) return undefined;
  if (sourceCount === 0) return "Not yet linked to source materials";
  if (sourceCount === 1) return "Linked to 1 source document";
  return `Linked to ${sourceCount} source documents`;
}

export function formatSearchSources(
  results: Array<{ sourceName?: string }>,
): string | undefined {
  const names = [
    ...new Set(
      results.map((entry) => entry.sourceName?.trim()).filter(Boolean),
    ),
  ];

  if (!names.length) return undefined;
  if (names.length === 1) return `Found in “${names[0]}”`;
  if (names.length === 2) return `Found in “${names[0]}” and “${names[1]}”`;
  return `Found in ${names.length} documents including “${names[0]}”`;
}

export function describeWrittenContent(html: string): string | undefined {
  const lower = html.toLowerCase();
  if (
    lower.includes("questionblock") ||
    lower.includes("multiple-choice") ||
    lower.includes("question-block")
  ) {
    return "Includes an interactive practice question";
  }
  if (lower.includes("cloze") || lower.includes("drag")) {
    return "Includes an interactive exercise";
  }
  if (/<(?:ul|ol)\b/.test(html)) {
    return "Includes a structured list for learners";
  }
  return undefined;
}

export const TOOL_METADATA_REGISTRY: ToolMetadataRegistry = {
  ...SOURCE_TOOL_METADATA,
  ...COURSE_TOOL_METADATA,
  ...EDITOR_TOOL_METADATA,
  ...UX_TOOL_METADATA,
};
