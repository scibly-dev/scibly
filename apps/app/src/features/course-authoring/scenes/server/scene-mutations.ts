import type { Prisma } from "@scibly/db";

import { AppError } from "@scibly/api/application-error";
import { db } from "@scibly/db";
import { SceneAnimation, SceneKind, SceneVibe } from "@scibly/db/enums";
import { encodeHtmlBytes } from "@scibly/lib";

import { sceneLineageService } from "@/features/course-authoring/scenes/server/scene-lineage";
import { requireOrgMember } from "@/features/organizations/server";
import { DEFAULT_SCENE_SP } from "@/shared/content/learning/scene-sp";

import { getNextDraftSceneOrder } from "../../ordering/server/ordering";
import { requireDraftLesson } from "./scene-access";
import { mapAuthoringScene } from "./scene-mapping";

export async function createDraftScene(
  userId: string,
  input: {
    lessonId: string;
    title?: string;
    sourceIds?: string[];
    kind?: SceneKind;
  },
) {
  const lesson = await requireDraftLesson(db, input.lessonId, userId);
  const kind = input.kind ?? SceneKind.DOCUMENT;
  const newScene = await db.$transaction(async (tx) => {
    const order = await getNextDraftSceneOrder(tx, input.lessonId);
    return tx.scene.create({
      data: {
        lessonId: input.lessonId,
        order,
        title: input.title ?? "New Scene",
        vibe: SceneVibe.NEUTRAL,
        animation: SceneAnimation.FADE,
        sp: DEFAULT_SCENE_SP,
        kind,
        documentState:
          kind === SceneKind.DOCUMENT
            ? Buffer.from(encodeHtmlBytes("<p></p>"))
            : undefined,
      },
    });
  });

  if (input.sourceIds?.length) {
    await sceneLineageService.replaceLineage(newScene.id, input.sourceIds);
  }
  return { ...mapAuthoringScene(newScene), courseId: lesson.courseId };
}

async function loadCloneSource(sceneId: string) {
  return db.scene.findUnique({
    where: { id: sceneId },
    include: { lesson: { include: { course: true } } },
  });
}

type CloneSource = NonNullable<Awaited<ReturnType<typeof loadCloneSource>>>;

async function createSceneClone(source: CloneSource) {
  return db.$transaction(async (tx) => {
    const siblings = await tx.scene.findMany({
      where: { lessonId: source.lessonId, courseVersionId: null },
      orderBy: { order: "asc" },
      select: { id: true, order: true },
    });
    const insertOrder = source.order + 1;
    await Promise.all(
      siblings
        .filter((scene) => scene.order >= insertOrder)
        .map((scene) =>
          tx.scene.update({
            where: { id: scene.id },
            data: { order: scene.order + 1 },
          }),
        ),
    );
    const created = await tx.scene.create({
      data: {
        lessonId: source.lessonId,
        order: insertOrder,
        title: `${source.title} (Copy)`,
        kind: source.kind,
        vibe: source.vibe,
        animation: source.animation,
        sp: source.sp,
        isOutdated: source.isOutdated,
        outdatedReason: source.outdatedReason,
        integration: source.integration ?? undefined,
        documentState: source.documentState
          ? Buffer.from(source.documentState)
          : undefined,
        learnerContent: source.learnerContent ?? undefined,
        gradingManifest: source.gradingManifest ?? undefined,
        practiceHtml: source.practiceHtml,
        practiceSolution: source.practiceSolution ?? undefined,
        practiceExplain: source.practiceExplain,
      },
    });
    const lineageRows = await tx.sceneSourceLineage.findMany({
      where: { sceneId: source.id },
      select: { sourceId: true },
    });
    if (lineageRows.length > 0) {
      await tx.sceneSourceLineage.createMany({
        data: lineageRows.map((row) => ({
          sceneId: created.id,
          sourceId: row.sourceId,
        })),
      });
    }
    return created;
  });
}

export async function cloneDraftScene(userId: string, sceneId: string) {
  const source = await loadCloneSource(sceneId);
  if (!source) {
    throw new AppError({
      code: "NOT_FOUND",
      applicationCode: "api.not_found",
      message: "Scene not found.",
    });
  }
  await requireOrgMember(
    source.lesson.course.organizationId,
    userId,
    "admin_or_owner",
  );
  if (source.courseVersionId != null || source.lesson.courseVersionId != null) {
    throw new AppError({
      code: "BAD_REQUEST",
      applicationCode: "api.bad_request",
      message: "Cannot clone a published scene.",
    });
  }

  const clonedScene = await createSceneClone(source);

  return {
    ...mapAuthoringScene(clonedScene),
    courseId: source.lesson.courseId,
  };
}

async function loadDeletionScenes(sceneIds: string[]) {
  // Selected field by field: `include` would drag every scene's Yjs `documentState` blob into memory just to delete the row.
  return db.scene.findMany({
    where: { id: { in: sceneIds } },
    select: {
      id: true,
      lessonId: true,
      courseVersionId: true,
      lesson: {
        select: {
          courseId: true,
          courseVersionId: true,
          course: { select: { organizationId: true } },
        },
      },
    },
  });
}

type DeletionScene = Awaited<ReturnType<typeof loadDeletionScenes>>[number];

async function lastSceneConflict(
  tx: Prisma.TransactionClient,
  scenes: DeletionScene[],
) {
  const deletesPerLesson = new Map<string, number>();
  for (const scene of scenes) {
    deletesPerLesson.set(
      scene.lessonId,
      (deletesPerLesson.get(scene.lessonId) ?? 0) + 1,
    );
  }
  const draftCounts = await tx.scene.groupBy({
    by: ["lessonId"],
    where: {
      lessonId: { in: [...deletesPerLesson.keys()] },
      courseVersionId: null,
    },
    _count: { id: true },
  });
  const draftCountByLesson = new Map(
    draftCounts.map((row) => [row.lessonId, row._count.id]),
  );
  for (const [lessonId, deleteCount] of deletesPerLesson) {
    if ((draftCountByLesson.get(lessonId) ?? 0) - deleteCount < 1) {
      return lessonId;
    }
  }
  return undefined;
}

export async function deleteDraftScenes(
  userId: string,
  sceneIdsInput: readonly string[],
) {
  const sceneIds = [...new Set(sceneIdsInput)];
  const scenes = await loadDeletionScenes(sceneIds);

  for (const organizationId of new Set(
    scenes.map((scene) => scene.lesson.course.organizationId),
  )) {
    await requireOrgMember(organizationId, userId, "admin_or_owner");
  }

  const foundIds = new Set(scenes.map((scene) => scene.id));
  const missingSceneIds = sceneIds.filter((id) => !foundIds.has(id));
  if (missingSceneIds.length > 0) {
    return {
      success: false as const,
      code: "NOT_FOUND" as const,
      deleted: [] as const,
      missingSceneIds,
      message:
        "Deletion aborted — none of the scenes were removed. " +
        `Scene IDs not found: ${missingSceneIds.join(", ")}. ` +
        "Call listScenes to verify current scene IDs, then retry deleteScenes with corrected IDs.",
    };
  }

  const publishedSceneIds = scenes
    .filter(
      (scene) =>
        scene.courseVersionId != null || scene.lesson.courseVersionId != null,
    )
    .map((scene) => scene.id);
  if (publishedSceneIds.length > 0) {
    return {
      success: false as const,
      code: "PUBLISHED_SCENE" as const,
      deleted: [] as const,
      missingSceneIds: [] as const,
      publishedSceneIds,
      message: "Cannot delete a published scene.",
    };
  }

  let result;
  try {
    result = await db.$transaction(
      async (tx) => {
        const lessonId = await lastSceneConflict(tx, scenes);
        if (lessonId) {
          return { conflict: "LAST_SCENE" as const, lessonId };
        }

        const sceneIdsToDelete = scenes.map((scene) => scene.id);
        await tx.scene.deleteMany({
          where: { id: { in: sceneIdsToDelete }, courseVersionId: null },
        });
        const stillPresentIds = new Set(
          (
            await tx.scene.findMany({
              where: { id: { in: sceneIdsToDelete } },
              select: { id: true },
            })
          ).map((scene) => scene.id),
        );
        const deleted = scenes
          .filter((scene) => !stillPresentIds.has(scene.id))
          .map((scene) => ({
            sceneId: scene.id,
            lessonId: scene.lessonId,
            courseId: scene.lesson.courseId,
          }));
        await tx.lesson.updateMany({
          where: {
            id: { in: [...new Set(deleted.map((scene) => scene.lessonId))] },
          },
          data: {},
        });
        return { conflict: undefined, deleted };
      },
      { isolationLevel: "Serializable" },
    );
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2034"
    ) {
      return {
        success: false as const,
        code: "CONFLICT" as const,
        deleted: [] as const,
        missingSceneIds: [] as const,
        message:
          "Another deletion ran against the same lesson at the same time. Retry deleteScenes.",
      };
    }
    throw error;
  }

  if (result.conflict === "LAST_SCENE") {
    return {
      success: false as const,
      code: "LAST_SCENE" as const,
      deleted: [] as const,
      missingSceneIds: [] as const,
      lessonId: result.lessonId,
      message:
        "Cannot delete the only scene in a lesson. Use deleteLesson to remove the entire lesson instead.",
    };
  }

  return {
    success: true as const,
    deleted: result.deleted,
  };
}
