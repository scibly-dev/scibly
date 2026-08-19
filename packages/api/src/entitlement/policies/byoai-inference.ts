import { type Prisma } from "@scibly/db/client";

import { type Decision } from "../decision";
import { resolveSubscribedPlan } from "../policy";
import { judgeGenerationLapse } from "./generation-lapse";
import { judgePlanFeature, type PlanFeature } from "./plan-feature";

const BYOAI_GENERATION: PlanFeature = {
  includedIn: (limits) => limits.byoai,
  applicationCode: "entitlement.byoai_generation_withdrawn",
  whenLapsed: null,
  whenNotInPlan: (requiredPlan) =>
    `Generating on your own AI endpoint is included from the ${requiredPlan} plan upwards, so this turn cannot run there anymore. Upgrade to ${requiredPlan} to point generations at your own key again — until then they run on ours and are charged to the organization's balance.`,
};

// A downgrade leaves CHAT rows resolvable by explicit id, so the plan must be re-checked here or a client naming one directly gets free turns.
export const decideOwnEndpointGeneration = async (
  db: Prisma.TransactionClient,
  organizationId: string,
): Promise<Decision> => {
  const resolved = await resolveSubscribedPlan(db, organizationId);
  const byoai = judgePlanFeature(resolved, BYOAI_GENERATION);
  return byoai.refusal ? byoai : judgeGenerationLapse(resolved);
};
