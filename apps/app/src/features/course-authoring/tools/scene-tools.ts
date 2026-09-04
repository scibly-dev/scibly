import type { NotebookRuntimeContext } from "@/features/notebook/server";

import { tool } from "ai";
import { z } from "zod";

import { EDITOR_SCHEMA } from "@/shared/content/editor/html-schema/generated/schema";

import {
  createSceneSchema,
  getLessonScenesSchema,
  reorderScenesSchema,
  setSceneLineageSchema,
  updateSceneSchema,
} from "../scenes/api/scene.schema";
import { writeCourseDelta } from "./tool-context";

const LIST_SCENES_DESCRIPTION =
  "List all scenes for a given lesson, ordered by their display position. " +
  "Every draft lesson includes a default empty Introduction scene at order 0. " +
  "Always call this after createLesson before adding content — reuse that scene with insertContent/updateScene instead of creating a duplicate first scene. " +
  "Check the returned scene count before deleteScenes: a lesson with one scene cannot be emptied — use deleteLessons instead (never deleteScenes). " +
  "Each scene includes isOutdated — when true, the scene cites sources that changed and the course is not fully up to date.";
const CREATE_SCENE_DESCRIPTION =
  "Create a new scene in a lesson. The new scene is appended after all existing scenes. " +
  "Every lesson already has a default Introduction scene at order 0 — call listScenes first and populate that scene before creating additional ones. " +
  "This tool is strictly for scene structure and metadata creation. Write the content afterwards: " +
  "insertContent for a DOCUMENT scene, writePractice for a PRACTICE one.";
const SET_LINEAGE_DESCRIPTION =
  "Record which notebook sources ground a draft scene's current content and mark the scene fresh (clears isOutdated). " +
  "Only call after insertContent actually rewrote the scene — never to dismiss outdated scenes without updating content. " +
  "If insertContent succeeds but returns lineageWarning, call this with the same sceneId and sourceIds — do not re-insert content.";

export function buildSceneTools(context: NotebookRuntimeContext) {
  return {
    listScenes: tool({
      description: LIST_SCENES_DESCRIPTION,
      inputSchema: getLessonScenesSchema,
      execute: async (input) => context.caller.scene.getLessonScenes(input),
    }),
    createScene: tool({
      description: CREATE_SCENE_DESCRIPTION,
      inputSchema: createSceneSchema,
      execute: async (input) => {
        const scene = await context.caller.scene.createScene(input);
        writeCourseDelta(context, {
          type: "scene-created",
          scene,
          lessonId: input.lessonId,
          courseId: scene.courseId,
        });
        return scene;
      },
    }),
    updateScene: tool({
      description:
        "Update an existing scene's metadata (title, vibe, animation, sp, etc.). " +
        "Provide only the fields you want to change. " +
        "This tool is strictly for metadata updates. To read or edit scene content, use getSceneContent or insertContent.",
      inputSchema: updateSceneSchema,
      execute: async (input) => {
        const scene = await context.caller.scene.updateScene(input);
        writeCourseDelta(context, {
          type: "scene-updated",
          scene,
          lessonId: scene.lessonId,
          courseId: scene.courseId,
        });
        return scene;
      },
    }),
    reorderScenes: tool({
      description:
        "Reorder scenes within a lesson by specifying the new ordered list of scene IDs.",
      inputSchema: reorderScenesSchema,
      execute: async (input) => {
        const result = await context.caller.scene.reorderScenes(input);
        writeCourseDelta(context, {
          type: "scenes-reordered",
          sceneIds: input.sceneIds,
          lessonId: input.lessonId,
          courseId: result.courseId,
        });
        return result;
      },
    }),
    setSceneLineage: tool({
      description: SET_LINEAGE_DESCRIPTION,
      inputSchema: setSceneLineageSchema,
      execute: async (input) => {
        const result = await context.caller.scene.setSceneLineage({
          ...input,
          notebookId: context.notebookId,
        });
        writeCourseDelta(context, {
          type: "invalidation-updated",
          courseId: result.courseId,
          lessonIds: [result.lessonId],
        });
        return result;
      },
    }),
    getEditorSchema: tool({
      description:
        "Get the HTML schema of the currently active rich-text editor. " +
        "You MUST call this BEFORE using insertContent to know which HTML tags and attributes are allowed.",
      inputSchema: z.object({}),
      execute: async () => ({ schema: EDITOR_SCHEMA }),
    }),
  };
}
