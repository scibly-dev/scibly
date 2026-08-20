"use client";

import { setAnalyticsContext } from "@scibly/observability/event-context";
import { useParams } from "next/navigation";
import { useEffect } from "react";

import { api } from "@/shared/api/trpc/client";

/** Held by the observability package rather than PostHog's own store, which it clears on every `reset()` — including the ones cookieless mode triggers on its own. */
export function AnalyticsArea() {
  const orgSlug = useParams<{ orgSlug?: string }>().orgSlug ?? null;
  const orgsQuery = api.organization.listMyOrgs.useQuery();
  const org = orgsQuery.data?.find((o) => o.slug === orgSlug) ?? null;

  useEffect(() => {
    // Don't call an organization route personal just because the list is still in flight.
    if (orgSlug !== null && !org) return;

    setAnalyticsContext(
      org
        ? {
            area: "organization",
            org_id: org.id,
            org_name: org.name,
            role: org.role,
          }
        : { area: "personal" },
    );
  }, [org, orgSlug]);

  return null;
}
