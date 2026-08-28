import {
  integrationPoll,
  integrationSync,
} from "@/features/integrations/server";

export const inngestFunctions = [integrationSync, integrationPoll];
