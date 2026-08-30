import {
  integrationPoll,
  integrationSync,
} from "@/features/integrations/server";
import {
  knowledgeCollect,
  knowledgeCollectionSync,
} from "@/features/knowledge/server";

export const inngestFunctions = [
  integrationSync,
  integrationPoll,
  knowledgeCollectionSync,
  knowledgeCollect,
];
