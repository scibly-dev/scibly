import {
  assertAllowed,
  chargeAiGeneration,
  decideOwnEndpointGeneration,
  type GenerationCharge,
} from "@scibly/api/entitlement";

import "server-only";

import { notifyAllowanceThresholdCrossed } from "./allowance-warning-notice";
import { notifyAfterResponding } from "./notify-owners";

export async function fundGeneration<T>(
  params: Parameters<typeof chargeAiGeneration>[0] & {
    ownEndpoint: boolean;
  },
  operation: (charge: GenerationCharge | null) => Promise<T>,
): Promise<T> {
  if (params.ownEndpoint) {
    await assertGenerationAllowed({
      db: params.db,
      organizationId: params.organizationId,
    });
    return operation(null);
  }
  return chargeGenerationAndWarn(params, operation);
}

export async function chargeGenerationAndWarn<T>(
  params: Parameters<typeof chargeAiGeneration>[0],
  operation: (charge: GenerationCharge) => Promise<T>,
): Promise<T> {
  const result = await chargeAiGeneration(params, operation);
  notifyAfterResponding(() =>
    notifyAllowanceThresholdCrossed(params.organizationId),
  );
  return result;
}

export async function assertGenerationAllowed(params: {
  db: Parameters<typeof decideOwnEndpointGeneration>[0];
  organizationId: string;
}): Promise<void> {
  assertAllowed(
    await decideOwnEndpointGeneration(params.db, params.organizationId),
  );
}
