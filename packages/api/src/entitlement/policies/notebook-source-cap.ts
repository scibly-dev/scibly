import { type Prisma } from "@scibly/db/client";

import { type Decision } from "../decision";
import { resolveSubscribedPlan } from "../policy";

export const decideNotebookSourceCap = async (
  db: Prisma.TransactionClient,
  organizationId: string,
  {
    notebookId,
    requestedCount,
  }: { notebookId: string; requestedCount: number },
): Promise<Decision> => {
  const { plan } = await resolveSubscribedPlan(db, organizationId);
  const limit = plan.sourcesPerNotebook;
  const used = await db.notebookSource.count({ where: { notebookId } });
  const remaining = Math.max(0, limit - used);

  if (requestedCount > remaining) {
    const shortfall = requestedCount - remaining;
    return {
      refusal: {
        applicationCode: "entitlement.source_cap_exhausted",
        message:
          shortfall === 1
            ? "This notebook has room for 1 fewer source than requested. Remove a source or upgrade the plan."
            : `This notebook has room for ${shortfall} fewer sources than requested. Remove sources or upgrade the plan.`,
        details: { shortfall, remainingSources: remaining },
      },
    };
  }

  return { refusal: null };
};
