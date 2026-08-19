"use client";

import type { Locale } from "@scibly/i18n/constants";
import type { InvitationsPageTranslations } from "./i18n/invitations.types";

import { INVITATION_ORG_QUERY_PARAM } from "@scibly/routes";
import { Input } from "@scibly/ui/components/input";
import { Loader2, Search } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { api } from "@/shared/api/trpc/client";

import { ClearFiltersButtonComponent } from "./components/clear-filters-button";
import { EmptyStateComponent } from "./components/empty-state";
import {
  type Invitation,
  InvitationCardComponent,
} from "./components/invitation-card";

interface InvitationsClientComponentProps {
  t: InvitationsPageTranslations;
  locale: Locale;
}

export const InvitationResults = ({
  invitations,
  filteredInvitations,
  isLoading,
  searchQuery,
  orgParam,
  setSearchQuery,
  t,
  locale,
}: {
  invitations: Invitation[];
  filteredInvitations: Invitation[];
  isLoading: boolean;
  searchQuery: string;
  orgParam: string | null | undefined;
  setSearchQuery: (value: string) => void;
  t: InvitationsPageTranslations;
  locale: Locale;
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-500" />
        <p className="mt-4 text-sm text-neutral-500">{t.loading}</p>
      </div>
    );
  }
  if (invitations.length === 0) {
    return <EmptyStateComponent message={t.emptyState} />;
  }
  if (filteredInvitations.length === 0) {
    return (
      <EmptyStateComponent
        message={t.noMatches}
        action={
          searchQuery || orgParam ? (
            <ClearFiltersButtonComponent
              onClear={() => setSearchQuery("")}
              label={t.clearFilters}
            />
          ) : null
        }
      />
    );
  }
  return (
    <div className="flex flex-col gap-6">
      {filteredInvitations.map((inv) => (
        <InvitationCardComponent
          key={inv.id}
          invitation={inv}
          t={t}
          locale={locale}
        />
      ))}
    </div>
  );
};

export function InvitationsClientComponent({
  t,
  locale,
}: InvitationsClientComponentProps) {
  const searchParams = useSearchParams();
  const orgParam = searchParams?.get(INVITATION_ORG_QUERY_PARAM);

  const { data: invitations = [], isLoading } =
    api.organization.listUserInvitations.useQuery();

  const [searchQuery, setSearchQuery] = useState(() => {
    if (!orgParam) return "";
    const matchedInv = invitations.find((inv) => inv.id === orgParam);
    return (
      matchedInv?.organizationSlug || matchedInv?.organizationName || orgParam
    );
  });

  const filteredInvitations = useMemo(() => {
    if (!searchQuery.trim()) return invitations;

    const query = searchQuery.toLowerCase();
    return invitations.filter(
      (inv) =>
        (inv.organizationName || "").toLowerCase().includes(query) ||
        inv.organizationSlug?.toLowerCase().includes(query) ||
        (inv.organizationId || "").toLowerCase() === query ||
        inv.id.toLowerCase() === query,
    );
  }, [invitations, searchQuery]);

  return (
    <div className="flex w-full flex-col gap-8 pb-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
            {t.title}
          </h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            {t.subtitle}
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-neutral-400" />
          </div>
          <Input
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9"
          />
        </div>
      </div>

      <InvitationResults
        invitations={invitations}
        filteredInvitations={filteredInvitations}
        isLoading={isLoading}
        searchQuery={searchQuery}
        orgParam={orgParam}
        setSearchQuery={setSearchQuery}
        t={t}
        locale={locale}
      />
    </div>
  );
}
