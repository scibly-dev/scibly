"use client";

import type { Locale } from "@scibly/i18n/constants";
import type { InvitationsPageTranslations } from "../i18n/invitations.types";

import { toMemberRole } from "@scibly/db/types";
import { INVITATION_ORG_QUERY_PARAM, routes } from "@scibly/routes";
import { Button } from "@scibly/ui/components/button";
import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { api } from "@/shared/api/trpc/client";
import { type RouterOutputs } from "@/shared/api/trpc/contracts";
import { useNavigationTransition } from "@/shared/ui/hooks/use-navigation-transition";
import { SettingsCard } from "@/shared/ui/settings-card";

import { useWorkspaceStore } from "../../navigation/workspace-store";

export type Invitation =
  RouterOutputs["organization"]["listUserInvitations"][number];

function useInvitationActions(inv: Invitation, t: InvitationsPageTranslations) {
  const router = useRouter();
  const { isNavigating, navigate } = useNavigationTransition();
  const searchParams = useSearchParams();
  const selectOrganization = useWorkspaceStore((s) => s.selectOrganization);
  const trpcUtils = api.useUtils();
  const acceptMutation = api.organization.acceptInvitation.useMutation();
  const rejectMutation = api.organization.rejectInvitation.useMutation();
  const clearUrlParam = () => {
    if (searchParams?.get(INVITATION_ORG_QUERY_PARAM)) {
      router.replace(routes.app.profile.invitations());
    }
  };
  const accept = () => {
    acceptMutation.mutate(
      { invitationId: inv.id },
      {
        onSuccess: async (data) => {
          toast.success(t.toast.accepted);
          await Promise.all([
            trpcUtils.organization.listUserInvitations.invalidate(),
            trpcUtils.organization.listMyOrgs.invalidate(),
          ]);
          clearUrlParam();
          if (!data?.member) return;
          const slug = inv.organizationSlug || inv.organizationId;
          const role = toMemberRole(data.member.role);
          selectOrganization(inv.organizationId, slug, role);
          navigate(routes.app.profile.org(slug).default(role));
        },
        onError: (error) => toast.error(error.message || t.toast.failedAccept),
      },
    );
  };
  const reject = () => {
    rejectMutation.mutate(
      { invitationId: inv.id },
      {
        onSuccess: () => {
          toast.success(t.toast.rejected);
          void trpcUtils.organization.listUserInvitations.invalidate();
          clearUrlParam();
        },
        onError: (error) => toast.error(error.message || t.toast.failedReject),
      },
    );
  };
  return { accept, acceptMutation, isNavigating, reject, rejectMutation };
}

export const InvitationDescription = ({
  inv,
  t,
  locale,
}: {
  inv: Invitation;
  t: InvitationsPageTranslations;
  locale: Locale;
}) => {
  const formattedCreatedDate = new Date(inv.createdAt).toLocaleDateString(
    locale,
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    },
  );
  const formattedExpiresDate = new Date(inv.expiresAt).toLocaleDateString(
    locale,
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    },
  );
  return (
    <span className="mt-1 flex flex-col gap-1">
      <span>
        {inv.inviterEmail
          ? t.card.invitedByAs
              .replace("{{email}}", inv.inviterEmail)
              .replace("{{role}}", inv.role ?? "")
          : t.card.invitedAs.replace("{{role}}", inv.role ?? "")}
      </span>
      <span className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
        <span>{t.card.sent.replace("{{date}}", formattedCreatedDate)}</span>
        <span>&bull;</span>
        <span
          className={
            inv.isExpired ? "font-medium text-red-500 dark:text-red-400" : ""
          }
        >
          {t.card.expires.replace("{{date}}", formattedExpiresDate)}
        </span>
      </span>
    </span>
  );
};

export function InvitationCardComponent({
  invitation: inv,
  t,
  locale,
}: {
  invitation: Invitation;
  t: InvitationsPageTranslations;
  locale: Locale;
}) {
  const { accept, acceptMutation, isNavigating, reject, rejectMutation } =
    useInvitationActions(inv, t);

  const isAccepting = acceptMutation.isPending || isNavigating;
  const isPending = isAccepting || rejectMutation.isPending;

  return (
    <SettingsCard
      contentLayout="row"
      title={
        <span className="flex items-center gap-2">
          <span>{inv.organizationName || t.card.unknownOrg}</span>
          {inv.organizationSlug && (
            <span className="rounded-md bg-neutral-100 px-1.5 py-0.5 text-xs font-normal text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
              @{inv.organizationSlug}
            </span>
          )}
        </span>
      }
      description={<InvitationDescription inv={inv} t={t} locale={locale} />}
    >
      <div className="flex items-center gap-3">
        <Button onClick={reject} disabled={isPending} variant="outline">
          {t.card.decline}
        </Button>
        <Button
          onClick={accept}
          disabled={isPending}
          className="min-w-24 gap-2"
        >
          {isAccepting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            t.card.accept
          )}
        </Button>
      </div>
    </SettingsCard>
  );
}
