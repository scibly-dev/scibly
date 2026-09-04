import type { PublishArtifacts } from "@/shared/content/contracts";
import type { PracticeGradingManifest } from "@/shared/content/practice/grade-practice-submission";

import { getCanvasSceneAvailableSp, sumPracticeSolutionSp } from "./scene-sp";

type PublishedScenePointSummary = {
  hasQuestions: boolean;
  maxSp: number;
};

export function summarizePublishedGradingManifest(
  sp: number | null | undefined,
  gradingManifest: PublishArtifacts["gradingManifest"],
): PublishedScenePointSummary {
  const questionSp = gradingManifest.reduce(
    (total, block) => total + (block.sp ?? 0),
    0,
  );
  return {
    hasQuestions: gradingManifest.length > 0,
    maxSp: getCanvasSceneAvailableSp(sp, questionSp),
  };
}

export function summarizePublishedPracticeManifest(
  sp: number | null | undefined,
  solution: PracticeGradingManifest["solution"],
): PublishedScenePointSummary {
  return {
    hasQuestions: Object.keys(solution ?? {}).length > 0,
    maxSp: getCanvasSceneAvailableSp(sp, sumPracticeSolutionSp(solution)),
  };
}
