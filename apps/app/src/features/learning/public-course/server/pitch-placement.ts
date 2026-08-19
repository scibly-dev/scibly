import type { ResolvedPlan } from "@scibly/api/entitlement";
import type { mapLearnerLessons } from "../../course-player/server/learner-course";

type LearnerLessonManifest = ReturnType<typeof mapLearnerLessons>[number];

export type PitchSceneManifest = {
  id: string;
  animation: "FADE";
  design: null;
  kind: "pitch";
};

export type PublicLessonManifest = Omit<LearnerLessonManifest, "scenes"> & {
  scenes: (LearnerLessonManifest["scenes"][number] | PitchSceneManifest)[];
};

export function needsPitchScenes(resolved: ResolvedPlan | null): boolean {
  if (!resolved) return true;
  return !resolved.plan.adFreePublicCourses || resolved.lapsed;
}

const SCENES_PER_PITCH = 6;

export function injectPitchScenes(
  lessons: readonly LearnerLessonManifest[],
): PublicLessonManifest[] {
  let pitchCount = 0;
  const nextPitch = (): PitchSceneManifest => ({
    id: `pitch-${++pitchCount}`,
    animation: "FADE",
    design: null,
    kind: "pitch",
  });
  return lessons.map((lesson) => {
    const scenes: PublicLessonManifest["scenes"] = [];
    let sinceLastPitch = 0;
    for (const [index, scene] of lesson.scenes.entries()) {
      scenes.push(scene);
      sinceLastPitch += 1;
      const isLessonEnd = index === lesson.scenes.length - 1;
      if (isLessonEnd || sinceLastPitch === SCENES_PER_PITCH) {
        scenes.push(nextPitch());
        sinceLastPitch = 0;
      }
    }
    return { ...lesson, scenes };
  });
}
