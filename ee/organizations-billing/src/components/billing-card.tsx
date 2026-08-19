"use client";

import type { OrgBillingPage } from "../i18n/org-billing.types";

import { authClient } from "@scibly/auth/client";
import { routes } from "@scibly/routes";
import { Button } from "@scibly/ui/components/button";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { api } from "@/shared/api/trpc/client";
import { SettingsCard } from "@/shared/ui/settings-card";

import { PlanGrid } from "./plan-grid";

export function BillingCard({
  orgId,
  orgSlug,
  lang,
  t,
}: {
  orgId: string;
  orgSlug: string;
  lang: string;
  t: OrgBillingPage["plan"];
}) {
  const { data: status, isLoading } = api.billing.getStatus.useQuery({
    orgSlug,
  });
  const [isPortalPending, setIsPortalPending] = useState(false);

  const returnUrl = routes.app.profile.org(orgSlug).billing;

  const openBillingPortal = async () => {
    setIsPortalPending(true);
    try {
      await authClient.subscription.billingPortal({
        referenceId: orgId,
        customerType: "organization",
        returnUrl,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t.portalFailed);
    } finally {
      setIsPortalPending(false);
    }
  };

  if (isLoading || !status) {
    return <SettingsCard title={t.title} description={t.description} />;
  }

  if (status.plan === "INTERNAL") {
    return <SettingsCard title={t.title} description={t.internalDescription} />;
  }

  const isSubscribed =
    status.hasStripeCustomer &&
    (status.status === "ACTIVE" || status.status === "PAST_DUE");

  if (isSubscribed) {
    return (
      <SettingsCard title={t.title} description={t.activeDescription}>
        <Button onClick={openBillingPortal} disabled={isPortalPending}>
          <span className="pointer-events-none flex items-center gap-2">
            {isPortalPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : null}
            {t.managePortalButton}
          </span>
        </Button>
      </SettingsCard>
    );
  }

  return (
    <SettingsCard title={t.title} description={t.description}>
      <PlanGrid orgId={orgId} lang={lang} t={t} returnUrl={returnUrl} />
    </SettingsCard>
  );
}
