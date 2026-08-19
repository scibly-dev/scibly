import type { CourseEntity, CourseMutationEvent } from "@scibly/showcase";
import type { NotebookRuntimeContext } from "@/features/notebook/server";

import { tool } from "ai";
import { z } from "zod";

import { serializeToolResult } from "@/shared/ai/tools/serialize-tool-result";

import {
  createLessonSchema,
  listLessonsSchema,
  updateLessonSchema,
} from "../courses/api/course.schema";
import { writeCourseDelta } from "./tool-context";

// Includes the auto-created Introduction scene's id/title so the builder can
// target it immediately, without a round trip to look it up (JF8).
export function lessonCreatedDelta(params: {
  courseId: string;
  lesson: CourseEntity;
  scenes: readonly CourseEntity[];
}): CourseMutationEvent {
  const [introduction] = params.scenes;
  return {
    type: "lesson-created",
    lesson: { id: params.lesson.id, title: params.lesson.title },
    courseId: params.courseId,
    scene: introduction && {
      id: introduction.id,
      title: introduction.title,
    },
  };
}

const reorderLessonsInputSchema = z.object({
  courseId: z.string().describe("The ID of the course."),
  lessonIds: z
    .array(z.string())
    .describe("Lesson IDs in the desired display order."),
});

export function buildLessonTools(context: NotebookRuntimeContext) {
  return {
    listLessons: tool({
      description: "List draft lessons for a specific course.",
      inputSchema: listLessonsSchema,
      execute: async (input) =>
        serializeToolResult(await context.caller.course.listLessons(input)),
    }),
    createLesson: tool({
      description:
        "Create a new lesson inside an existing course. " +
        "Each new lesson automatically includes one empty Introduction scene at order 0. " +
        "After creating a lesson, call listScenes, then populate the Introduction scene with insertContent before createScene adds more scenes.",
      inputSchema: createLessonSchema,
      execute: async (input) => {
        const lesson = await context.caller.course.createLesson(input);
        const scenes = await context.caller.scene.getLessonScenes({
          lessonId: lesson.id,
        });
        writeCourseDelta(
          context,
          lessonCreatedDelta({ courseId: input.courseId, lesson, scenes }),
        );
        return serializeToolResult({ lesson, scenes });
      },
    }),
    updateLesson: tool({
      description:
        "Update a lesson's metadata: title, description, icon, or estimated duration.",
      inputSchema: updateLessonSchema,
      execute: async (input) => {
        const lesson = await context.caller.course.updateLesson(input);
        writeCourseDelta(context, {
          type: "lesson-updated",
          lesson,
          courseId: input.courseId,
        });
        return serializeToolResult(lesson);
      },
    }),
    reorderLessons: tool({
      description:
        "Reorder lessons within a course by specifying the new ordered list of lesson IDs.",
      inputSchema: reorderLessonsInputSchema,
      execute: async (input) => {
        const result = await context.caller.course.updateLessonOrder(input);
        writeCourseDelta(context, {
          type: "lessons-reordered",
          lessonIds: input.lessonIds,
          courseId: input.courseId,
        });
        return result;
      },
    }),
  };
}
