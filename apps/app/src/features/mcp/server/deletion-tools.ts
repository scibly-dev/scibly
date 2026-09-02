import type { McpServer } from "@modelcontextprotocol/server";

import { z } from "zod";

import "server-only";
import {
  deleteCourse,
  deleteDraftLessons,
  deleteDraftScenes,
  deletionIdsSchema,
  deletionReasonSchema,
  getCourse,
  resolveLessonDeletion,
  resolveSceneDeletion,
} from "@/features/course-authoring/server";

import { registerApprovedTool } from "./approval";
import { readable, text } from "./tool-response";

const UNDONE = "nothing was deleted";

const reasonSchema = deletionReasonSchema
  .optional()
  .describe(
    "Why this should go, shown to the author in the approval. Provide one whenever the author did not ask for the deletion in so many words.",
  );

function idsSchema(noun: string, listTool: string) {
  return deletionIdsSchema.describe(
    `Draft ${noun} IDs, exactly as ${listTool} returned them.`,
  );
}

type MissingIds = Partial<
  Record<"missingSceneIds" | "missingLessonIds", string[]>
>;

function refuse(message: string, missing?: MissingIds) {
  return text({ success: false, ...missing, message });
}

function unresolved(
  resolution: { course: { id: string }; missing: string[] } | null,
  courseId: string,
  noun: "scene" | "lesson",
  listTool: string,
) {
  const retry = `Call ${listTool} and retry with the exact ids.`;
  if (!resolution) {
    return refuse(`No draft ${noun}s match those ids. ${retry}`);
  }
  if (resolution.course.id !== courseId) {
    return refuse(
      `Those ${noun}s are in course ${resolution.course.id}, not ${courseId}. ` +
        "Retry naming the course they are actually in.",
    );
  }
  if (resolution.missing.length > 0) {
    const key = noun === "scene" ? "missingSceneIds" : "missingLessonIds";
    return refuse(
      `Not draft ${noun}s in this course: ${resolution.missing.join(", ")}. ${retry}`,
      { [key]: resolution.missing },
    );
  }
  return null;
}

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

function withReason(lines: string[], reason: string | undefined): string {
  // Flattened to one line so the model's words cannot pose as the server's framing.
  const note = reason?.replace(/\s+/gu, " ").trim();
  return [...lines, ...(note ? ["", `Reason: ${note}`] : [])].join("\n");
}

export function registerDeletionTools(server: McpServer, userId: string) {
  registerApprovedTool(
    server,
    {
      name: "deleteScenes",
      description:
        "Permanently delete one or more draft scenes. " +
        "Pass every scene in one call — the author approves them together, and one approval beats five. " +
        "Use the exact scene `id` from listScenes; a lesson cannot be emptied, so reach for deleteLessons when the whole lesson should go.",
      inputSchema: z.object({
        courseId: z.string().describe("The course these scenes belong to."),
        sceneIds: idsSchema("scene", "listScenes"),
        reason: reasonSchema,
      }),
      annotations: { destructiveHint: true, idempotentHint: false },
      undone: UNDONE,
    },
    async ({ courseId, sceneIds, reason }) => {
      const ids = [...new Set(sceneIds)];
      const resolved = await readable("deleteScenes", () =>
        resolveSceneDeletion(userId, ids),
      );
      const refusal = unresolved(resolved, courseId, "scene", "listScenes");
      if (refusal) return refusal;

      const { course, found } = resolved!;
      const byLesson = new Map<string, { title: string; scenes: string[] }>();
      for (const scene of found) {
        const lesson = byLesson.get(scene.lessonId) ?? {
          title: scene.lessonTitle || "Untitled lesson",
          scenes: [],
        };
        lesson.scenes.push(scene.sceneTitle || "Untitled scene");
        byLesson.set(scene.lessonId, lesson);
      }

      return {
        courseId,
        ids,
        message: withReason(
          [
            `Permanently delete ${plural(found.length, "scene")} from "${course.title}"? This cannot be undone.`,
            "",
            ...[...byLesson.values()].flatMap((lesson) => [
              lesson.title,
              ...lesson.scenes.map((title) => `  - ${title}`),
            ]),
          ],
          reason,
        ),
        run: () =>
          readable("deleteScenes", () => deleteDraftScenes(userId, ids)),
      };
    },
  );

  registerApprovedTool(
    server,
    {
      name: "deleteLessons",
      description:
        "Permanently delete one or more lessons and every draft scene inside them. " +
        "Pass every lesson in one call — the author approves them together. " +
        "This is also how a lesson's last scene goes: deleteScenes cannot empty a lesson.",
      inputSchema: z.object({
        courseId: z.string().describe("The course these lessons belong to."),
        lessonIds: idsSchema("lesson", "listLessons"),
        reason: reasonSchema,
      }),
      annotations: { destructiveHint: true, idempotentHint: false },
      undone: UNDONE,
    },
    async ({ courseId, lessonIds, reason }) => {
      const ids = [...new Set(lessonIds)];
      const resolved = await readable("deleteLessons", () =>
        resolveLessonDeletion(userId, ids),
      );
      const refusal = unresolved(resolved, courseId, "lesson", "listLessons");
      if (refusal) return refusal;

      const { course, found } = resolved!;
      return {
        courseId,
        ids,
        message: withReason(
          [
            `Permanently delete ${plural(found.length, "lesson")} from "${course.title}"? Every scene inside goes too, and this cannot be undone.`,
            "",
            ...found.map(
              (lesson) =>
                `  - ${lesson.lessonTitle || "Untitled lesson"} (${plural(lesson.sceneCount, "scene")})`,
            ),
          ],
          reason,
        ),
        run: () =>
          readable("deleteLessons", () =>
            deleteDraftLessons(userId, { courseId, lessonIds: ids }),
          ),
      };
    },
  );

  registerApprovedTool(
    server,
    {
      name: "deleteCourse",
      description:
        "Permanently delete an entire course: every lesson and scene, every published version, and every enrollment with the progress attached to it. " +
        "This is not how a draft is tidied up — reach for deleteLessons unless the whole course is meant to stop existing.",
      inputSchema: z.object({
        courseId: z.string().describe("The course to delete."),
        reason: reasonSchema,
      }),
      annotations: { destructiveHint: true, idempotentHint: false },
      undone: UNDONE,
    },
    async ({ courseId, reason }) => {
      const course = await readable("deleteCourse", () =>
        getCourse(userId, courseId),
      );

      const published = course.versions[0];
      return {
        courseId,
        message: withReason(
          [
            `Permanently delete the whole course "${course.title}"? This cannot be undone.`,
            "",
            `  - ${plural(course._count.lessons, "draft lesson")} and every scene inside them`,
            ...(published
              ? [
                  `  - every published version, up to version ${published.version}`,
                ]
              : []),
            ...(course._count.enrollments > 0
              ? [
                  `  - ${plural(course._count.enrollments, "enrolled learner")}, losing all recorded progress`,
                ]
              : []),
            ...(course.allowAnonymous
              ? ["  - the public link, and any page embedding this course"]
              : []),
          ],
          reason,
        ),
        run: () =>
          readable("deleteCourse", () => deleteCourse(userId, courseId)),
      };
    },
  );
}
