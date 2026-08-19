import type { NotebookChatTranslations } from "../chat/i18n/chat.types";
import type { NotebookCourseBuilderTranslations } from "../course-builder/i18n/course-builder.types";
import type { NotebookDemoTranslations } from "../demo/i18n/demo.types";
import type { NotebookInfographicTranslations } from "../infographic/i18n/infographic.types";
import type { NotebookMediaTranslations } from "../media/i18n/media.types";
import type { NotebookSourcesTranslations } from "../sources/i18n/sources.types";
import type { NotebookPageTranslations } from "../workspace/i18n/workspace.types";

export interface NotebookTranslations {
  page: NotebookPageTranslations;
  demo: NotebookDemoTranslations;
  sources: NotebookSourcesTranslations;
  mediaLibrary: NotebookMediaTranslations;
  chat: NotebookChatTranslations;
  studio: NotebookCourseBuilderTranslations & NotebookInfographicTranslations;
}
