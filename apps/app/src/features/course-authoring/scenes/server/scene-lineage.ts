import { AppError } from "@scibly/api/application-error";
import { db, type Prisma } from "@scibly/db";

class SceneLineageService {
  async getLineageForScene(sceneId: string): Promise<string[]> {
    const rows = await db.sceneSourceLineage.findMany({
      where: { sceneId },
      select: { sourceId: true },
    });
    return rows.map((r) => r.sourceId);
  }

  async getSourceIdsBySceneId(
    sceneIds: string[],
  ): Promise<Map<string, string[]>> {
    const sourceIdsBySceneId = new Map<string, string[]>();
    if (sceneIds.length === 0) return sourceIdsBySceneId;

    const lineageRows = await db.sceneSourceLineage.findMany({
      where: { sceneId: { in: sceneIds } },
      select: { sceneId: true, sourceId: true },
    });

    for (const row of lineageRows) {
      const list = sourceIdsBySceneId.get(row.sceneId) ?? [];
      list.push(row.sourceId);
      sourceIdsBySceneId.set(row.sceneId, list);
    }

    return sourceIdsBySceneId;
  }

  async replaceLineage(
    sceneId: string,
    sourceIds: string[],
    tx: Prisma.TransactionClient | typeof db = db,
  ): Promise<void> {
    const uniqueSourceIds = [...new Set(sourceIds)];
    if (uniqueSourceIds.length === 0) {
      throw new AppError({
        code: "BAD_REQUEST",
        applicationCode: "api.bad_request",
        message: "At least one source ID is required for lineage.",
      });
    }

    if (tx === db) {
      await this.validateDraftSceneAndSources(sceneId, uniqueSourceIds);
    }

    await tx.sceneSourceLineage.deleteMany({ where: { sceneId } });
    await tx.sceneSourceLineage.createMany({
      data: uniqueSourceIds.map((sourceId) => ({ sceneId, sourceId })),
    });
  }

  async markSceneFresh(
    sceneId: string,
    tx: Prisma.TransactionClient | typeof db = db,
  ): Promise<void> {
    await tx.scene.update({
      where: { id: sceneId },
      data: {
        isOutdated: false,
        outdatedReason: null,
      },
    });
  }

  async finalizeSceneEdit(sceneId: string, sourceIds: string[]): Promise<void> {
    const uniqueSourceIds = [...new Set(sourceIds)];
    if (uniqueSourceIds.length === 0) {
      throw new AppError({
        code: "BAD_REQUEST",
        applicationCode: "api.bad_request",
        message: "At least one source ID is required for lineage.",
      });
    }

    await this.validateDraftSceneAndSources(sceneId, uniqueSourceIds);

    await db.$transaction(async (tx) => {
      await this.replaceLineage(sceneId, uniqueSourceIds, tx);
      await this.markSceneFresh(sceneId, tx);
    });
  }

  private async validateDraftSceneAndSources(
    sceneId: string,
    uniqueSourceIds: string[],
  ) {
    const scene = await db.scene.findUnique({
      where: { id: sceneId },
      include: {
        lesson: {
          select: {
            courseId: true,
            course: {
              select: {
                organizationId: true,
                notebooks: { select: { id: true } },
              },
            },
          },
        },
      },
    });

    if (!scene) {
      throw new AppError({
        code: "NOT_FOUND",
        applicationCode: "api.not_found",
        message: "Scene not found.",
      });
    }

    if (scene.courseVersionId !== null) {
      throw new AppError({
        code: "BAD_REQUEST",
        applicationCode: "api.bad_request",
        message: "Cannot record lineage on a published scene.",
      });
    }

    const notebookIds = scene.lesson.course.notebooks.map((n) => n.id);

    const validSources =
      notebookIds.length === 0
        ? []
        : await db.notebookSource.findMany({
            where: {
              id: { in: uniqueSourceIds },
              notebookId: { in: notebookIds },
            },
            select: { id: true },
          });

    if (validSources.length !== uniqueSourceIds.length) {
      throw new AppError({
        code: "BAD_REQUEST",
        applicationCode: "api.bad_request",
        message:
          "One or more source IDs are invalid or do not belong to this course's notebook.",
      });
    }

    return scene;
  }
}

export const sceneLineageService = new SceneLineageService();
