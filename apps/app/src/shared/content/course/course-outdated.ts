import { type Prisma } from "@scibly/db";

export function outdatedDraftSceneWhere(
  courseId: string,
): Prisma.SceneWhereInput {
  return {
    isOutdated: true,
    courseVersionId: null,
    lesson: { courseId },
  };
}
