"use client";

import type { IntegrationProviderId } from "@/features/integrations/contracts";
import type { OrgSettingsPage } from "@/features/organizations/contracts";

import { ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { api } from "@/shared/api/trpc/client";

import { ProviderGrantsDialog } from "./provider-grants-dialog";

const VISIBLE_GRANTS = 4;

export const ProviderGrants = ({
  orgSlug,
  provider,
  t,
}: {
  orgSlug: string;
  provider: IntegrationProviderId;
  t: OrgSettingsPage["integrations"];
}) => {
  const [showAll, setShowAll] = useState(false);
  const utils = api.useUtils();
  const { data, isPending, isError, error } =
    api.integration.listGrants.useQuery({
      orgSlug,
      provider,
    });

  // The server has already dropped the connection by the time this error arrives,
  // so refetching the list is what takes the row off the page.
  const wasRevoked = error?.data?.applicationCode === "integration.revoked";
  const revokedNotice = t.revokedNotice.replace(
    "{provider}",
    t.providers[provider],
  );
  useEffect(() => {
    if (!wasRevoked) return;
    toast.error(revokedNotice, { id: `integration-revoked-${provider}` });
    void utils.integration.list.invalidate({ orgSlug });
  }, [wasRevoked, provider, orgSlug, revokedNotice, utils]);

  if (isPending) {
    return <p className="text-[11px] text-neutral-400">{t.grantsLoading}</p>;
  }
  if (isError) {
    return <p className="text-[11px] text-neutral-400">{t.grantsError}</p>;
  }
  if (data.grants.length === 0) {
    return <p className="text-[11px] text-neutral-400">{t.grantsEmpty}</p>;
  }
  const hidden = data.totalCount - VISIBLE_GRANTS;

  return (
    <div className="flex flex-col gap-1">
      <p className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
        {t.grantsTitle}
      </p>
      <ul className="flex flex-wrap gap-1.5">
        {data.grants.slice(0, VISIBLE_GRANTS).map((grant) => (
          <li key={grant.id}>
            <a
              href={grant.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-md border border-neutral-200 px-2 py-0.5 text-[11px] text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              {grant.name}
              <ExternalLink className="h-2.5 w-2.5" />
            </a>
          </li>
        ))}
        {hidden > 0 ? (
          <li>
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="inline-flex items-center rounded-md border border-neutral-200 px-2 py-0.5 text-[11px] text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              {t.grantsMore.replace("{count}", String(hidden))}
            </button>
          </li>
        ) : null}
      </ul>
      <ProviderGrantsDialog
        open={showAll}
        onOpenChange={setShowAll}
        grants={data.grants}
        totalCount={data.totalCount}
        t={t}
      />
    </div>
  );
};
