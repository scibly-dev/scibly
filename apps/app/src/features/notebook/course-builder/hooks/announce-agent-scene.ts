"use client";

import { useCourseBuilderStore } from "../course-builder-store";

interface SceneLocationClient {
  scene: {
    getSceneLocation: {
      fetch: (input: { sceneId: string }) => Promise<{
        scene: { id: string; title: string };
        lesson: { id: string; title: string };
        course: { id: string; title: string };
      } | null>;
    };
  };
}

export async function announceAgentScene(
  sceneId: string,
  client: SceneLocationClient,
): Promise<void> {
  const { activeScene, agentTarget, agentTouched } =
    useCourseBuilderStore.getState();
  if (activeScene?.id === sceneId || agentTarget?.scene?.id === sceneId) return;

  try {
    const location = await client.scene.getSceneLocation.fetch({ sceneId });
    if (!location) return;
    agentTouched({
      course: location.course,
      lesson: location.lesson,
      scene: location.scene,
    });
  } catch {}
}
