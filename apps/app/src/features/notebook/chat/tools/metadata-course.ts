import type { ToolMetadataRegistry } from "./metadata";

import { truncate } from "./metadata";

export const COURSE_TOOL_METADATA = {
  createCourse: {
    iconId: "book",
    getStepPresentation: ({ input, isDone }) => ({
      label: isDone ? "Created new course" : "Creating new course",
      context: input.title ? truncate(input.title, 72) : undefined,
    }),
  },
  listCourses: {
    iconId: "book",
    getStepPresentation: ({ output, isDone }) => {
      const count = output?.items.length;
      return {
        label: isDone ? "Reviewed your courses" : "Reviewing your courses",
        detail:
          count !== undefined
            ? `${count} course${count === 1 ? "" : "s"} available in this notebook`
            : undefined,
      };
    },
  },
  getCourseById: {
    iconId: "book",
    getStepPresentation: ({ input, output, isDone }) => ({
      label: isDone ? "Opened course overview" : "Opening course overview",
      context: output?.title ? truncate(output.title, 72) : undefined,
      detail: input.courseId ? "Reviewing structure and lessons" : undefined,
    }),
  },
  createLesson: {
    iconId: "book",
    getStepPresentation: ({ input, isDone }) => ({
      label: isDone ? "Added a new lesson" : "Adding a new lesson",
      context: input.title ? truncate(input.title, 72) : undefined,
    }),
  },
  updateLesson: {
    iconId: "edit",
    getStepPresentation: ({ input, isDone }) => ({
      label: isDone ? "Updated lesson details" : "Updating lesson details",
      context: input.title ? truncate(input.title, 72) : undefined,
    }),
  },
  deleteLessons: {
    iconId: "edit",
    getStepPresentation: ({ input, isDone }) => {
      const count = input.lessonIds?.length;
      return {
        label: isDone ? "Removed lessons" : "Removing lessons",
        detail:
          count !== undefined
            ? `${count} lesson${count === 1 ? "" : "s"}`
            : undefined,
        context: input.reason ? truncate(input.reason, 88) : undefined,
      };
    },
  },
  reorderLessons: {
    iconId: "edit",
    getStepPresentation: ({ input, isDone }) => {
      const count = input.lessonIds?.length;
      return {
        label: isDone ? "Reordered lessons" : "Reordering lessons",
        detail:
          count !== undefined
            ? `New order for ${count} lesson${count === 1 ? "" : "s"}`
            : undefined,
      };
    },
  },
} satisfies ToolMetadataRegistry;
