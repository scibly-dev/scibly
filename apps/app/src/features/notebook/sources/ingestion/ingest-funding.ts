import {
  assertAllowed,
  decideIngestFunding,
  decideNotebookSourceCap,
  decideOwnEndpointGeneration,
} from "@scibly/api/entitlement";
import { type Prisma } from "@scibly/db/client";

// Summary, outline and compaction all reuse the org's own chat model, so an
// org running its own endpoint owes the plan check rather than the balance.
export async function runsOwnTextModel(
  client: Prisma.TransactionClient,
  organizationId: string,
): Promise<boolean> {
  const org = await client.organization.findUnique({
    where: { id: organizationId },
    select: { defaultChatModelId: true },
  });
  return org?.defaultChatModelId != null;
}

// Reads go through the caller's client, so an in-flight transaction's added
// pages still count.
export async function assertOrgCanAffordIngest(
  client: Prisma.TransactionClient,
  organizationId: string,
  sources = 1,
): Promise<void> {
  assertAllowed(
    (await runsOwnTextModel(client, organizationId))
      ? await decideOwnEndpointGeneration(client, organizationId)
      : await decideIngestFunding(
          client,
          organizationId,
          "SOURCE_INGEST",
          sources,
        ),
  );
}

// The notebook's cap is checked first, since a full notebook is fixable
// without spending anything, before the ingest itself is priced.
export async function assertCanAddSources(
  client: Prisma.TransactionClient,
  params: { organizationId: string; notebookId: string; count?: number },
): Promise<void> {
  const requestedCount = params.count ?? 1;
  assertAllowed(
    await decideNotebookSourceCap(client, params.organizationId, {
      notebookId: params.notebookId,
      requestedCount,
    }),
  );
  await assertOrgCanAffordIngest(client, params.organizationId, requestedCount);
}
