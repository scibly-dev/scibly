import { db } from "@scibly/db";

import "server-only";
import { sceneLineageService } from "@/features/course-authoring/scenes/server/scene-lineage";
import { resolveNotebook } from "@/features/notebook/server";
import { outdatedDraftSceneWhere } from "@/shared/content/course/course-outdated";

import { requireCourseAdmin } from "../../../access/server/policy";

export async function getOutdatedScenes(userId: string, courseId: string) {
  await requireCourseAdmin(courseId, userId);
  const [scenes, linkedNotebook] = await Promise.all([
    db.scene.findMany({
      where: outdatedDraftSceneWhere(courseId),
      select: {
        id: true,
        title: true,
        lessonId: true,
        outdatedReason: true,
      },
      orderBy: [{ lesson: { order: "asc" } }, { order: "asc" }],
    }),
    db.notebook.findFirst({
      where: { courseId },
      select: { id: true },
    }),
  ]);
  const sourceIdsBySceneId = await sceneLineageService.getSourceIdsBySceneId(
    scenes.map((scene) => scene.id),
  );
  const scenesWithLineage = scenes.map((scene) => ({
    sceneId: scene.id,
    lessonId: scene.lessonId,
    title: scene.title,
    outdatedReason: scene.outdatedReason,
    sourceIds: sourceIdsBySceneId.get(scene.id) ?? [],
  }));
  return {
    hasOutdatedScenes: scenesWithLineage.length > 0,
    outdatedSceneCount: scenesWithLineage.length,
    linkedNotebookId: linkedNotebook?.id ?? null,
    scenes: scenesWithLineage,
  };
}

export async function getStaleSourcesForNotebook(
  userId: string,
  notebookId: string,
): Promise<{ staleSourceIds: string[] }> {
  const { notebook } = await resolveNotebook(notebookId, userId);
  if (!notebook.courseId) return { staleSourceIds: [] };

  const lineageRows = await db.sceneSourceLineage.findMany({
    where: {
      source: { notebookId },
      scene: { isOutdated: true, courseVersionId: null },
    },
    select: { sourceId: true },
    distinct: ["sourceId"],
  });
  return { staleSourceIds: lineageRows.map((row) => row.sourceId) };
}
