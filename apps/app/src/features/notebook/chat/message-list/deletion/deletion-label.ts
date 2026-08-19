import type { NotebookTranslations } from "../../../i18n/notebook.types";

import { formatTemplateCount } from "../utils/format-template-count";

export function deletionLabel(
  isScene: boolean,
  isBatch: boolean,
  count: number,
  cb: NotebookTranslations["studio"]["courseBuilder"],
  completed: boolean,
) {
  const variant = `${completed ? "completed" : "confirm"}-${isScene ? "scene" : "lesson"}-${isBatch ? "batch" : "single"}`;
  switch (variant) {
    case "completed-scene-batch":
      return formatTemplateCount(cb.deletionScenesCompleted, count);
    case "completed-scene-single":
      return cb.deletionSceneCompleted;
    case "completed-lesson-batch":
      return formatTemplateCount(cb.deletionLessonsCompleted, count);
    case "completed-lesson-single":
      return cb.deletionLessonCompleted;
    case "confirm-scene-batch":
      return formatTemplateCount(cb.deletionConfirmScenesTitle, count);
    case "confirm-scene-single":
      return cb.deletionConfirmSceneTitle;
    case "confirm-lesson-batch":
      return formatTemplateCount(cb.deletionConfirmLessonsTitle, count);
    default:
      return cb.deletionConfirmLessonTitle;
  }
}
