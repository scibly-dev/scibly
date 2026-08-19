import type { Prisma } from "@scibly/db";

import "server-only";
import { requirePublishedSceneMaxSp } from "@/shared/content/learning/scene-sp";

const learnerSceneManifestSelect = {
  id: true,
  animation: true,
  hasQuestions: true,
  maxSp: true,
} satisfies Prisma.SceneSelect;

export function createLearnerLessonSelect(courseVersionId: string) {
  return {
    id: true,
    title: true,
    description: true,
    icon: true,
    estimatedTimeToCompleteMinutes: true,
    design: true,
    scenes: {
      where: { courseVersionId },
      orderBy: { order: "asc" },
      select: learnerSceneManifestSelect,
    },
  } satisfies Prisma.LessonSelect;
}

type LearnerLessonRecord = Prisma.LessonGetPayload<{
  select: ReturnType<typeof createLearnerLessonSelect>;
}>;

export function mapLearnerLessons(lessons: readonly LearnerLessonRecord[]) {
  return lessons.map((lesson) => {
    let maxSp = 0;
    const scenes = lesson.scenes.map((scene) => {
      maxSp += requirePublishedSceneMaxSp(scene.maxSp, scene.id);
      return {
        id: scene.id,
        animation: scene.animation,

        design: lesson.design,
        kind: scene.hasQuestions
          ? ("assessment" as const)
          : ("content" as const),
      };
    });
    return {
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      icon: lesson.icon,
      estimatedTimeToCompleteMinutes: lesson.estimatedTimeToCompleteMinutes,
      scenes,
      maxSp,
    };
  });
}
