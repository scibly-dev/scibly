import type { NotebookRuntimeContext } from "@/features/notebook/server";

import { buildCourseTools } from "./course-tools";
import { buildLessonTools } from "./lesson-tools";
import { buildPracticeTools } from "./practice-tools";
import { buildReviewTools } from "./review-tools";
import { buildSceneTools } from "./scene-tools";

export function buildCourseAuthoringNotebookTools(
  context: NotebookRuntimeContext,
) {
  return {
    ...buildCourseTools(context),
    ...buildLessonTools(context),
    ...buildSceneTools(context),
    ...buildPracticeTools(context),
    ...buildReviewTools(context),
  };
}
