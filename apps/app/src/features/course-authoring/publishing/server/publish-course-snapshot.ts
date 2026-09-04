import type { CourseVersion } from "@scibly/db";
import type { PracticeGradingManifest } from "@/shared/content/practice/grade-practice-submission";

import { AppError } from "@scibly/api/application-error";
import { Prisma } from "@scibly/db";
import { randomUUID } from "crypto";

import "server-only";
import { buildPublishedSceneArtifacts } from "@/shared/content/editor/server";
import {
  summarizePublishedGradingManifest,
  summarizePublishedPracticeManifest,
} from "@/shared/content/learning/published-scene-summary";
import { validatePublishableContent } from "@/shared/content/server";

function omitObjectKeys<T extends object, K extends keyof T>(
  object: T,
  keys: readonly K[],
): Omit<T, K> {
  const omitted = new Set<PropertyKey>(keys);
  // SAFETY: `Object.fromEntries` always types its result `{ [k: string]: … }`.
  return Object.fromEntries(
    Object.entries(object).filter(([key]) => !omitted.has(key)),
  ) as Omit<T, K>;
}

async function loadDraftLessons(
  tx: Prisma.TransactionClient,
  courseId: string,
) {
  return tx.lesson.findMany({
    where: { courseId, courseVersionId: null },
    orderBy: { order: "asc" },
    include: {
      scenes: { where: { courseVersionId: null }, orderBy: { order: "asc" } },
    },
  });
}

type DraftLesson = Awaited<ReturnType<typeof loadDraftLessons>>[number];

function assertDraftChanged(
  courseUpdatedAt: Date,
  draftLessons: DraftLesson[],
  latestVersion: { publishedAt: Date } | null,
) {
  if (!latestVersion) return;
  let latestDraftUpdate = courseUpdatedAt.getTime();
  for (const lesson of draftLessons) {
    latestDraftUpdate = Math.max(latestDraftUpdate, lesson.updatedAt.getTime());
    for (const scene of lesson.scenes) {
      latestDraftUpdate = Math.max(
        latestDraftUpdate,
        scene.updatedAt.getTime(),
      );
    }
  }
  if (latestDraftUpdate <= latestVersion.publishedAt.getTime()) {
    throw new AppError({
      code: "BAD_REQUEST",
      applicationCode: "api.bad_request",
      message: "No changes have been made since the last published version.",
      details: { code: "NO_CHANGES" },
    });
  }
}

type DraftScene = DraftLesson["scenes"][number];

function toPublishedSceneCreateInput(
  scene: DraftScene,
  lessonId: string,
  courseVersionId: string,
): Prisma.SceneCreateManyInput {
  const sceneFields = omitObjectKeys(scene, [
    "id",
    "lessonId",
    "createdAt",
    "updatedAt",
    "courseVersionId",
    "sourceSceneId",
    "isOutdated",
    "outdatedReason",
    "learnerContent",
    "gradingManifest",
    "practiceHtml",
    "practiceSolution",
    "practiceExplain",
  ] as const);
  const base = {
    ...sceneFields,
    id: randomUUID(),
    lessonId,
    courseVersionId,
    sourceSceneId: scene.id,
    integration: sceneFields.integration ?? Prisma.DbNull,
    isOutdated: false,
    outdatedReason: null,
  };

  if (scene.kind === "PRACTICE") {
    // SAFETY: `writePractice` wrote all three columns as JSON, and the publish gate refused an empty practiceHtml.
    const solution =
      scene.practiceSolution as PracticeGradingManifest["solution"];
    const summary = summarizePublishedPracticeManifest(scene.sp, solution);
    return {
      ...base,
      // SAFETY: the publish gate already refused an empty practiceHtml.
      learnerContent: scene.practiceHtml as Prisma.InputJsonValue,
      // SAFETY: `writePractice` only ever writes JSON through these columns.
      gradingManifest: {
        solution,
        explain: scene.practiceExplain,
      } as Prisma.InputJsonValue,
      hasQuestions: summary.hasQuestions,
      maxSp: summary.maxSp,
    };
  }

  let artifacts: ReturnType<typeof buildPublishedSceneArtifacts>;
  try {
    artifacts = buildPublishedSceneArtifacts(scene.documentState);
  } catch (error) {
    console.error("Failed to build published scene artifacts", scene.id, error);
    throw new AppError({
      code: "INTERNAL_SERVER_ERROR",
      applicationCode: "api.internal_server_error",
      message: `Failed to process scene "${scene.title}". Please try again.`,
    });
  }
  const summary = summarizePublishedGradingManifest(
    scene.sp,
    artifacts.gradingManifest,
  );
  return {
    ...base,
    // SAFETY: both are built in-process by `buildPublishedSceneArtifacts`, never learner input.
    learnerContent: artifacts.learnerContent as Prisma.InputJsonValue,
    // SAFETY: as above.
    gradingManifest: artifacts.gradingManifest as Prisma.InputJsonValue,
    hasQuestions: summary.hasQuestions,
    maxSp: summary.maxSp,
  };
}

function publishedSceneData(
  draftLessons: DraftLesson[],
  lessonIdByDraftId: Map<string, string>,
  courseVersionId: string,
) {
  const publishedScenes: Prisma.SceneCreateManyInput[] = [];
  for (const lesson of draftLessons) {
    for (const scene of lesson.scenes) {
      publishedScenes.push(
        toPublishedSceneCreateInput(
          scene,
          lessonIdByDraftId.get(lesson.id)!,
          courseVersionId,
        ),
      );
    }
  }
  return publishedScenes;
}

export async function publishCourseSnapshot(
  tx: Prisma.TransactionClient,
  course: { id: string; updatedAt: Date },
  publishedById: string,
  options: { supersedePrevious: boolean; force?: boolean },
): Promise<CourseVersion> {
  const draftLessons = await loadDraftLessons(tx, course.id);

  const validationFailure = validatePublishableContent(draftLessons, options);
  if (validationFailure) {
    throw new AppError({
      code: "BAD_REQUEST",
      applicationCode: "api.bad_request",
      message: validationFailure.message,
      details: {
        code: validationFailure.code,
        params: validationFailure.params,
        questions: validationFailure.questions,
      },
    });
  }

  const latestVersion = await tx.courseVersion.findFirst({
    where: { courseId: course.id },
    orderBy: { version: "desc" },
    select: { id: true, version: true, publishedAt: true },
  });

  assertDraftChanged(course.updatedAt, draftLessons, latestVersion);

  const newVersion = await tx.courseVersion.create({
    data: {
      courseId: course.id,
      version: (latestVersion?.version ?? 0) + 1,
      publishedById,
    },
  });

  const lessonIdByDraftId = new Map(
    draftLessons.map((lesson) => [lesson.id, randomUUID()]),
  );
  await tx.lesson.createMany({
    data: draftLessons.map((lesson) => ({
      ...omitObjectKeys(lesson, [
        "id",
        "createdAt",
        "updatedAt",
        "scenes",
      ] as const),
      id: lessonIdByDraftId.get(lesson.id)!,
      courseVersionId: newVersion.id,
      sourceLessonId: lesson.id,

      // SAFETY: `?? undefined` has already removed the only value the write
      design: (lesson.design ?? undefined) as Prisma.InputJsonValue | undefined,
    })),
  });

  const publishedScenes = publishedSceneData(
    draftLessons,
    lessonIdByDraftId,
    newVersion.id,
  );
  await tx.scene.createMany({ data: publishedScenes });

  if (options.supersedePrevious && latestVersion) {
    await tx.courseVersion.updateMany({
      where: {
        courseId: course.id,
        version: { lte: latestVersion.version },
      },
      data: { superseded: true },
    });
  }

  return newVersion;
}
