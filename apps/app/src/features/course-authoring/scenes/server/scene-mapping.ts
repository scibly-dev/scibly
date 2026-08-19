import type { Scene as PrismaScene } from "@scibly/db";

import { sceneIntegrationSchema } from "@/shared/content/course/scene-validation";

type SceneWithLineage = PrismaScene & {
  sourceLineages?: Array<{
    source: { id: string; name: string; type: string };
  }>;
};

export function mapAuthoringScene(scene: SceneWithLineage) {
  return {
    id: scene.id,
    lessonId: scene.lessonId,
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
