import { AppError } from "@scibly/api/application-error";
import {
  assertAllowed,
  decideByoaiConfiguration,
} from "@scibly/api/entitlement";
import { db } from "@scibly/db";

import { decryptApiKey } from "@/lib/crypto/api-key";
import { assertSafeByoaiOutboundUrl } from "@/lib/network/ssrf-guard";

export async function assertByoaiConfigurationAllowed<T>(
  orgId: string,
  actorId: string,
  configure: () => Promise<T>,
): Promise<T> {
  assertAllowed(await decideByoaiConfiguration(db, orgId));
  return configure();
}

export async function assertSafeByoaiBaseUrl(baseUrl: string): Promise<void> {
  try {
    await assertSafeByoaiOutboundUrl(baseUrl);
  } catch (error) {
    throw new AppError({
      code: "BAD_REQUEST",
      applicationCode: "api.bad_request",
      message:
        error instanceof Error
          ? error.message
          : "Private or internal URLs are not allowed.",
    });
  }
}

export async function resolveProbeApiKey(
  orgId: string,
  apiKey: string | undefined,
  existingModelId: string | undefined,
): Promise<string> {
  if (apiKey?.trim()) return apiKey.trim();
  if (!existingModelId) {
    throw new AppError({
      code: "BAD_REQUEST",
      applicationCode: "api.bad_request",
      message: "API key is required.",
    });
  }
  const existing = await db.organizationAIModel.findFirst({
    where: { id: existingModelId, organizationId: orgId },
    select: { apiKeyEncrypted: true },
  });
  if (!existing) throw new Error("Model not found.");
  return decryptApiKey(existing.apiKeyEncrypted);
}

export async function recordModelTestResult(
  modelId: string,
  orgId: string,
  ok: boolean,
) {
  await db.organizationAIModel.updateMany({
    where: { id: modelId, organizationId: orgId },
    data: {
      lastTestStatus: ok ? "OK" : "FAILED",
      lastTestedAt: new Date(),
    },
  });
}
