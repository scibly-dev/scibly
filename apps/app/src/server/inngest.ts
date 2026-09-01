import {
  integrationPoll,
  integrationSync,
} from "@/features/integrations/server";
import {
  knowledgeCollect,
  knowledgeCollectionSync,
  knowledgeExtract,
  knowledgeFunnelRetry,
  knowledgeTriage,
} from "@/features/knowledge/server";

export const inngestFunctions = [
  integrationSync,
  integrationPoll,
  knowledgeCollectionSync,
  knowledgeCollect,
  knowledgeTriage,
  knowledgeExtract,
  knowledgeFunnelRetry,
];
