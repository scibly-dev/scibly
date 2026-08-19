import { createTRPCRouter } from "@scibly/api/trpc";

import { orgAiModelProcedures } from "./org-ai-model-procedures";
import { orgAiQueryProcedures } from "./org-ai-query-procedures";
import { orgAiSelectionProcedures } from "./org-ai-selection-procedures";

export const orgAiConfigRouter = createTRPCRouter({
  ...orgAiQueryProcedures,
  ...orgAiModelProcedures,
  ...orgAiSelectionProcedures,
});
