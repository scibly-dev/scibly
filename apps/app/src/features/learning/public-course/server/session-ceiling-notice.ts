import { db } from "@scibly/db";
import { getPublicSessionCeilingMailMessages } from "@scibly/email/i18n";
import PublicSessionCeilingMail from "@scibly/email/templates/public-session-ceiling-mail";
import { defaultLocale } from "@scibly/i18n/constants";

import "server-only";
import { notifyOwners } from "@/features/organizations/server";

export async function notifySessionCeilingApproached(
  organizationId: string,
  {
    used,
    limit,
    warnAt,
    periodStart,
  }: { used: number; limit: number; warnAt: number; periodStart: Date },
): Promise<void> {
  await notifyOwners(organizationId, {
    label: "Public session ceiling warning",
    occasion: async () => {
      if (limit === 0 || used < warnAt) return null;

      const { count } = await db.organizationSubscription.updateMany({
        where: {
          organizationId,
          currentPeriodStart: periodStart,
          OR: [
            { sessionCeilingWarnedFor: null },
            { sessionCeilingWarnedFor: { not: periodStart } },
          ],
        },
        data: { sessionCeilingWarnedFor: periodStart },
      });
      return count > 0 ? { used, limit } : null;
    },
    compose: (crossing, organization) => {
      const copy = getPublicSessionCeilingMailMessages(defaultLocale);
      return {
        subject: copy.subject,
        react: PublicSessionCeilingMail({
          url: organization.url,
          organizationName: organization.organizationName,
          used: crossing.used,
          limit: crossing.limit,
          locale: defaultLocale,
        }),
      };
    },
  });
}
