"use client";

import type { Member } from "@scibly/db";
import type { DictionaryPages } from "@/i18n/types";

import { authClient } from "@scibly/auth/client";
import { Button } from "@scibly/ui/components/button";
import { useState } from "react";
import { toast } from "sonner";
import { useDebounce } from "use-debounce";

import { api } from "@/shared/api/trpc/client";
import { usePagination } from "@/shared/ui/hooks/use-pagination";

import { MEMBERS_PAGE_SIZE } from "../constants";
import { CancelInvitationDialog } from "./modals/cancel-invitation-dialog";
import { InviteMemberModal } from "./modals/invite-member-modal";
import { RemoveMemberDialog } from "./modals/remove-member-dialog";
import { MemberControls } from "./table/member-controls";
import { MemberTable } from "./table/member-table";

type MembersTranslations = DictionaryPages["orgMembers"];

function useMemberFilters() {
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 300);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "invited"
  >("all");
  const pagination = usePagination({ pageSize: MEMBERS_PAGE_SIZE });
  const updateSearch = (value: string) => {
    setSearch(value);
    pagination.setPage(1);
  };
  const updateRole = (value: string) => {
    setRoleFilter(value);
    pagination.setPage(1);
  };
  const updateStatus = (value: "all" | "active" | "invited") => {
    setStatusFilter(value);
    pagination.setPage(1);
  };
  return {
    debouncedSearch,
    pagination,
    roleFilter,
    search,
    statusFilter,
    updateRole,
    updateSearch,
    updateStatus,
  };
}

function useMembersListController(t: MembersTranslations, orgId: string) {
  const trpcUtils = api.useUtils();
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [cancelInvitationId, setCancelInvitationId] = useState<string | null>(
    null,
  );
  const [removeMemberId, setRemoveMemberId] = useState<string | null>(null);
  const filters = useMemberFilters();
  const { cursor, pageSize, getPaginationProps } = filters.pagination;

  const { data, isLoading, isFetching } =
    api.organization.listMembersAndInvitations.useQuery({
      organizationId: orgId,
      limit: pageSize,
      cursor,
      search: filters.debouncedSearch,
      role: filters.roleFilter,
      status: filters.statusFilter,
    });

  const allItems = data?.items || [];
  const paginationProps = getPaginationProps(
    data?.totalCount,
    !!data?.nextCursor,
  );

  const handleUpdateRole = async (memberId: string, role: Member["role"]) => {
    const { error } = await authClient.organization.updateMemberRole({
      memberId,
      role,
      organizationId: orgId,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(t.updateRoleSuccess);
      void trpcUtils.organization.listMembersAndInvitations.invalidate({
        organizationId: orgId,
      });
    }
  };

  const getRoleText = (role: string) => {
    if (role === "owner") return t.owner;
    if (role === "admin") return t.admin;
    return t.member;
  };

  const expectedSkeletonCount = paginationProps.totalCount
    ? Math.max(
        1,
        Math.min(pageSize, paginationProps.totalCount - paginationProps.cursor),
      )
    : pageSize;
  return {
    allItems,
    cancelInvitationId,
    expectedSkeletonCount,
    getRoleText,
    handleRoleFilterChange: filters.updateRole,
    handleSearchChange: filters.updateSearch,
    handleStatusFilterChange: filters.updateStatus,
    handleUpdateRole,
    inviteModalOpen,
    isFetching,
    isLoading,
    paginationProps,
    removeMemberId,
    roleFilter: filters.roleFilter,
    search: filters.search,
    setCancelInvitationId,
    setInviteModalOpen,
    setRemoveMemberId,
    statusFilter: filters.statusFilter,
  };
}

export const MemberDialogs = ({
  controller,
  orgId,
  t,
}: {
  controller: ReturnType<typeof useMembersListController>;
  orgId: string;
  t: MembersTranslations;
}) => (
  <>
    <InviteMemberModal
      open={controller.inviteModalOpen}
      onOpenChange={controller.setInviteModalOpen}
      orgId={orgId}
      t={t}
    />
    <RemoveMemberDialog
      memberId={controller.removeMemberId}
      orgId={orgId}
      onClose={() => controller.setRemoveMemberId(null)}
      t={t}
    />
    <CancelInvitationDialog
      invitationId={controller.cancelInvitationId}
      orgId={orgId}
      onClose={() => controller.setCancelInvitationId(null)}
      t={t}
    />
  </>
);

export function MembersListComponent({
  t,
  orgId,
}: {
  t: MembersTranslations;
  orgId: string;
}) {
  const controller = useMembersListController(t, orgId);
  const pagination = controller.paginationProps;
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h2 className="text-foreground text-xl font-semibold tracking-tight">
          {t.title}
        </h2>
        <div className="flex items-center gap-3">
          <Button
            className="px-6 shadow-sm"
            onClick={() => controller.setInviteModalOpen(true)}
          >
            {t.inviteMember}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <MemberTable
          t={t}
          allItems={controller.allItems}
          isLoading={controller.isLoading}
          search={controller.search}
          onSearchChange={controller.handleSearchChange}
          filters={
            <MemberControls
              t={t}
              search={controller.search}
              setSearch={controller.handleSearchChange}
              roleFilter={controller.roleFilter}
              setRoleFilter={controller.handleRoleFilterChange}
              statusFilter={controller.statusFilter}
              setStatusFilter={controller.handleStatusFilterChange}
            />
          }
          page={pagination.page}
          hasNextPage={pagination.hasNextPage}
          hasPreviousPage={pagination.hasPreviousPage}
          onNextPage={pagination.onNextPage}
          onPreviousPage={pagination.onPreviousPage}
          isFetching={controller.isFetching}
          skeletonCount={controller.expectedSkeletonCount}
          totalCount={pagination.totalCount}
          getRoleText={controller.getRoleText}
          handleUpdateRole={controller.handleUpdateRole}
          setRemoveMemberId={controller.setRemoveMemberId}
          setCancelInvitationId={controller.setCancelInvitationId}
        />
      </div>
      <MemberDialogs controller={controller} orgId={orgId} t={t} />
    </div>
  );
}
