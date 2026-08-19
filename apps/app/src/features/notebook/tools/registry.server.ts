import type { NotebookRuntimeContext } from "@/features/notebook/tools/runtime-context";

import "server-only";
import { buildCourseAuthoringNotebookTools } from "@/features/course-authoring/server";
import { buildIntegrationNotebookTools } from "@/features/integrations/server";
import { buildLearningNotebookTools } from "@/features/learning/server";
import {
  buildImageNotebookTools,
  buildSourceNotebookTools,
} from "@/features/notebook/server";
import { buildOrganizationNotebookTools } from "@/features/organizations/server";

import { CLIENT_ONLY_NOTEBOOK_TOOLS } from "../chat/tools/client-tool-definitions";
import { buildSkillTools, type SkillMetadata } from "../skills";

export async function buildToolRegistry(
  ctx: NotebookRuntimeContext,
  skills: SkillMetadata[],
) {
  return {
    ...buildCourseAuthoringNotebookTools(ctx),
    ...buildOrganizationNotebookTools(ctx),
    ...buildLearningNotebookTools(ctx),
    ...buildSourceNotebookTools(ctx),
    ...buildIntegrationNotebookTools(ctx),
    ...buildImageNotebookTools(ctx),
    ...CLIENT_ONLY_NOTEBOOK_TOOLS,
    ...buildSkillTools(skills),
  };
}
