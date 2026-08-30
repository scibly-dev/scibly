import { createTRPCRouter } from "@scibly/api/trpc";

import { knowledgeTopicProcedures } from "./knowledge-topic-procedures";

export const knowledgeRouter = createTRPCRouter({
  ...knowledgeTopicProcedures,
});
