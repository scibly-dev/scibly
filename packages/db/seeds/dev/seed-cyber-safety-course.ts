import type {
  Prisma,
  PrismaClient,
} from "../../schema/generated/prisma/client.js";

import { courseEntityIds, cyberSafetyCourse } from "@scibly/course-content";
import { encodeHtmlBytes } from "@scibly/lib/collab";

import publishedContentFixture from "./cyber-safety-published-content.json";

const publishedContent: Record<
  string,
  {
    learnerContent: Prisma.InputJsonValue;
    gradingManifest: { sp?: number }[];
  }
> = publishedContentFixture;

type SeedCyberSafetyCourseOptions = {
  orgSlug: string;

  organizationId?: string;

  publishedById?: string;
};

export const seedCyberSafetyCourse = async (
  prisma: PrismaClient,
  options: SeedCyberSafetyCourseOptions,
) => {
  const { orgSlug, organizationId, publishedById } = options;

  const org =
    (await prisma.organization.findUnique({ where: { slug: orgSlug } })) ??
    (organizationId
      ? await prisma.organization.findUnique({ where: { id: organizationId } })
      : null);

  if (!org) {
    console.warn(
      `⚠ Skipping cyber-safety course seed: org slug "${orgSlug}"` +
        (organizationId ? ` / id ${organizationId}` : "") +
        " not found.",
    );
    return;
  }

  let resolvedPublisherId = publishedById;
  if (!resolvedPublisherId) {
    const owner = await prisma.member.findFirst({
      where: {
        organizationId: org.id,
        role: { in: ["owner", "admin"] },
      },
      orderBy: { createdAt: "asc" },
      select: { userId: true },
    });
    resolvedPublisherId = owner?.userId;
  }

  if (!resolvedPublisherId) {
    console.warn(
      `⚠ Skipping cyber-safety course seed: no publisher for org "${org.slug}".`,
    );
    return;
  }

  const publisher = await prisma.user.findUnique({
    where: { id: resolvedPublisherId },
    select: { id: true },
  });

  if (!publisher) {
    console.warn(
      `⚠ Skipping cyber-safety course seed: publisher ${resolvedPublisherId} not found.`,
    );
    return;
  }

  const ids = courseEntityIds(cyberSafetyCourse);
  const courseId = ids.courseId;
  const versionId = `version_${courseId}_v1`;

  await prisma.$transaction(async (tx) => {
    const existing = await tx.course.findUnique({ where: { id: courseId } });
    if (existing) {
      console.log(`Clearing existing cyber-safety course (${courseId})...`);
      await tx.course.delete({ where: { id: courseId } });
    }

    await tx.course.create({
      data: {
        id: courseId,
        organizationId: org.id,
        title: cyberSafetyCourse.title,
        description: cyberSafetyCourse.description,
        category: cyberSafetyCourse.category,
        tags: [...cyberSafetyCourse.tags],
        thumbnail: cyberSafetyCourse.thumbnail ?? null,
        allowAnonymous: true,
      },
    });

    const draftLessons: Array<{
      id: string;
      title: string;
      description: string | null;
      order: number;
      estimatedTimeToCompleteMinutes: number;
      scenes: Array<{
        id: string;
        title: string;
        order: number;
        sp: number;
        documentState: Uint8Array<ArrayBuffer>;
        learnerContent: Prisma.InputJsonValue;
        gradingManifest: Prisma.InputJsonValue;
        hasQuestions: boolean;
        maxSp: number;
      }>;
    }> = [];

    for (const lesson of cyberSafetyCourse.lessons) {
      const lessonId = ids.lessonId(lesson.key);
      const scenes = lesson.scenes.map((scene) => {
        const key = `${lesson.key}/${scene.key}`;
        const published = publishedContent[key];
        if (!published) {
          throw new Error(`No published content for scene ${key}`);
        }
        const { gradingManifest } = published;
        const sp = scene.sp ?? 5;
        return {
          id: ids.sceneId(lesson.key, scene.key),
          title: scene.title,
          order: scene.order,
          sp,
          documentState: Uint8Array.from(encodeHtmlBytes(scene.html)),
          learnerContent: published.learnerContent,
          gradingManifest,
          hasQuestions: gradingManifest.length > 0,

          maxSp: gradingManifest.reduce(
            (total, block) => total + (block.sp ?? 0),
            sp,
          ),
        };
      });

      draftLessons.push({
        id: lessonId,
        title: lesson.title,
        description: lesson.description,
        order: lesson.order,
        estimatedTimeToCompleteMinutes: lesson.estimatedTimeToCompleteMinutes,
        scenes,
      });

      await tx.lesson.create({
        data: {
          id: lessonId,
          courseId,
          title: lesson.title,
          description: lesson.description,
          order: lesson.order,
          estimatedTimeToCompleteMinutes: lesson.estimatedTimeToCompleteMinutes,
          courseVersionId: null,
        },
      });

      for (const scene of scenes) {
        await tx.scene.create({
          data: {
            id: scene.id,
            lessonId,
            title: scene.title,
            order: scene.order,
            sp: scene.sp,
            documentState: scene.documentState,
            courseVersionId: null,
          },
        });
      }
    }

    await tx.courseVersion.create({
      data: {
        id: versionId,
        courseId,
        version: 1,
        publishedById: publisher.id,
        publishedAt: new Date(),
        superseded: false,
      },
    });

    for (const lesson of draftLessons) {
      const publishedLessonId = `pub_${lesson.id}`;
      await tx.lesson.create({
        data: {
          id: publishedLessonId,
          courseId,
          title: lesson.title,
          description: lesson.description,
          order: lesson.order,
          estimatedTimeToCompleteMinutes: lesson.estimatedTimeToCompleteMinutes,
          courseVersionId: versionId,
          sourceLessonId: lesson.id,
        },
      });

      for (const scene of lesson.scenes) {
        await tx.scene.create({
          data: {
            id: `pub_${scene.id}`,
            lessonId: publishedLessonId,
            title: scene.title,
            order: scene.order,
            sp: scene.sp,
            documentState: scene.documentState,
            learnerContent: scene.learnerContent,
            gradingManifest: scene.gradingManifest,
            hasQuestions: scene.hasQuestions,
            maxSp: scene.maxSp,
            courseVersionId: versionId,
            sourceSceneId: scene.id,
          },
        });
      }
    }
  });

  const lessonCount = cyberSafetyCourse.lessons.length;
  const sceneCount = cyberSafetyCourse.lessons.reduce(
    (n, l) => n + l.scenes.length,
    0,
  );

  console.log(
    `✓ Cyber-safety course seeded + published: ${courseId} (${lessonCount} lessons, ${sceneCount} scenes)`,
  );
  console.log(`  Public: /public/courses/${courseId}`);
  console.log(`  Org: /profile/org/${orgSlug}/courses/${courseId}`);
};
