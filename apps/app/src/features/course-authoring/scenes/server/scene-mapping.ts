import type { Prisma } from "@scibly/db";

import { sceneIntegrationSchema } from "@/shared/content/course/scene-validation";

/** The eleven columns `mapAuthoringScene` keeps — never the content blobs. */
export const authoringSceneSelect = {
  id: true,
  lessonId: true,
  kind: true,
  title: true,
  vibe: true,
  animation: true,
  sp: true,
  order: true,
  isOutdated: true,
  outdatedReason: true,
  integration: true,
} satisfies Prisma.SceneSelect;

type SceneWithLineage = Prisma.SceneGetPayload<{
  select: typeof authoringSceneSelect;
}> & {
  sourceLineages?: Array<{
    source: { id: string; name: string; type: string };
  }>;
};

export function mapAuthoringScene(scene: SceneWithLineage) {
  return {
    id: scene.id,
    lessonId: scene.lessonId,
    kind: scene.kind,
    title: scene.title,
    vibe: scene.vibe,
    animation: scene.animation,
    sp: scene.sp,
    order: scene.order,
    isOutdated: scene.isOutdated,
    outdatedReason: scene.outdatedReason,
    sources:
      scene.sourceLineages?.map((row) => ({
        id: row.source.id,
        name: row.source.name,
        type: row.source.type,
      })) ?? [],
    integration: scene.integration
      ? sceneIntegrationSchema.parse(scene.integration)
      : undefined,
  };
}
