import type { ToolMetadataRegistry } from "./metadata";

import {
  describeWrittenContent,
  firstHeading,
  firstSentence,
  formatSceneTitles,
  formatSourceGrounding,
  stripHtml,
  truncate,
} from "./metadata";

export const EDITOR_TOOL_METADATA = {
  insertContent: {
    iconId: "edit",
    getStepPresentation: ({ input, output, isDone }) => {
      const html = input.html ?? output?.html ?? "";
      const plain = stripHtml(html);
      const heading = html ? firstHeading(html) : undefined;

      return {
        label: isDone ? "Wrote lesson content" : "Writing lesson content",
        context: heading ?? (plain ? firstSentence(plain) : undefined),
        detail: [
          describeWrittenContent(html),
          formatSourceGrounding(input.sourceIds?.length),
          output?.success === false ? output.error : undefined,
        ]
          .filter(Boolean)
          .join(" · "),
      };
    },
  },
  getSceneContent: {
    iconId: "book",
    getStepPresentation: ({ input, output, isDone }) => {
      const html = output?.html ?? "";
      const plain = stripHtml(html);
      const heading = html ? firstHeading(html) : undefined;

      return {
        label: isDone
          ? "Reviewed existing lesson content"
          : "Reviewing existing lesson content",
        context: input.reason
          ? truncate(input.reason, 88)
          : (heading ?? (plain ? firstSentence(plain) : undefined)),
        detail: formatSourceGrounding(output?.sourceIds.length),
      };
    },
  },
  getEditorSchema: {
    iconId: "wrench",
    getStepPresentation: ({ isDone }) => ({
      label: isDone
        ? "Prepared the content editor"
        : "Preparing the content editor",
      detail: "Checks what blocks and layouts can be used before writing",
    }),
  },
  listScenes: {
    iconId: "book",
    getStepPresentation: ({ output, isDone }) => {
      const scenes = output ?? [];
      const outdatedCount = scenes.filter((scene) => scene.isOutdated).length;

      return {
        label: isDone ? "Reviewed lesson scenes" : "Reviewing lesson scenes",
        context: formatSceneTitles(scenes),
        detail: [
          scenes.length
            ? `${scenes.length} scene${scenes.length === 1 ? "" : "s"} in this lesson`
            : undefined,
          outdatedCount
            ? `${outdatedCount} may need a refresh after source changes`
            : undefined,
        ]
          .filter(Boolean)
          .join(" · "),
      };
    },
  },
  createScene: {
    iconId: "edit",
    getStepPresentation: ({ input, isDone }) => ({
      label: isDone ? "Added a new lesson scene" : "Adding a new lesson scene",
      context: input.title ? truncate(input.title, 72) : undefined,
    }),
  },
  updateScene: {
    iconId: "edit",
    getStepPresentation: ({ input, isDone }) => ({
      label: isDone ? "Updated scene details" : "Updating scene details",
      context: input.updates?.title
        ? truncate(input.updates.title, 72)
        : undefined,
    }),
  },
  deleteScenes: {
    iconId: "edit",
    getStepPresentation: ({ input, isDone }) => {
      const count = input.scenes?.length;
      return {
        label: isDone ? "Removed lesson scenes" : "Removing lesson scenes",
        detail:
          count !== undefined
            ? `${count} scene${count === 1 ? "" : "s"}`
            : undefined,
        context: input.reason ? truncate(input.reason, 88) : undefined,
      };
    },
  },
  reorderScenes: {
    iconId: "edit",
    getStepPresentation: ({ input, isDone }) => {
      const count = input.sceneIds?.length;
      return {
        label: isDone ? "Reordered lesson scenes" : "Reordering lesson scenes",
        detail:
          count !== undefined
            ? `New order for ${count} scene${count === 1 ? "" : "s"}`
            : undefined,
      };
    },
  },
  setSceneLineage: {
    iconId: "edit",
    getStepPresentation: ({ input, isDone }) => ({
      label: isDone
        ? "Linked content to source materials"
        : "Linking content to source materials",
      detail: formatSourceGrounding(input.sourceIds?.length),
    }),
  },
} satisfies ToolMetadataRegistry;
