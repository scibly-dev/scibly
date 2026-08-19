import { claimAllowanceWarning } from "@scibly/api/entitlement";
import { db } from "@scibly/db";
import { getAllowanceWarningMailMessages } from "@scibly/email/i18n";
import AllowanceWarningMail from "@scibly/email/templates/allowance-warning-mail";
import { defaultLocale } from "@scibly/i18n/constants";

import "server-only";

import { notifyOwners } from "./notify-owners";

export async function notifyAllowanceThresholdCrossed(
  organizationId: string,
): Promise<void> {
  await notifyOwners(organizationId, {
    label: "Allowance warning",
    occasion: () => claimAllowanceWarning(db, organizationId),
    compose: (warning, organization) => {
      const copy = getAllowanceWarningMailMessages(defaultLocale);
      return {
        subject: copy.byLevel[warning.threshold].subject,
        react: AllowanceWarningMail({
          url: organization.url,
          organizationName: organization.organizationName,
          threshold: warning.threshold,
          remaining: warning.remaining,
          allowance: warning.allowance,
          locale: defaultLocale,
        }),
      };
    },
  });
}
