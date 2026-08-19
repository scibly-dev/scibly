"use client";

import type { Member } from "@scibly/db";
import type { DictionaryPages } from "@/i18n/types";

import { getInitials } from "@scibly/lib";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@scibly/ui/components/avatar";
import { Button } from "@scibly/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@scibly/ui/components/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@scibly/ui/components/select";
import { MoreHorizontal } from "lucide-react";

import { type RouterOutputs } from "@/shared/api/trpc/contracts";
import { type Column, DataTable } from "@/shared/ui/components/data-table";

type MemberItem =
  RouterOutputs["organization"]["listMembersAndInvitations"]["items"][number];

interface MemberTableProps {
  t: DictionaryPages["orgMembers"];
  allItems: MemberItem[];
  isLoading: boolean;
  search: string;
  onSearchChange: (val: string) => void;
  filters?: React.ReactNode;
  page: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  onNextPage: () => void;
  onPreviousPage: () => void;
  isFetching: boolean;
  skeletonCount?: number;
  totalCount?: number;

  getRoleText: (role: string) => string;
  handleUpdateRole: (memberId: string, role: Member["role"]) => Promise<void>;
  setRemoveMemberId: (id: string) => void;
  setCancelInvitationId: (id: string) => void;
}

export const MemberIdentityCell = ({ item }: { item: MemberItem }) => (
  <div className="flex items-center gap-3 overflow-hidden">
    <Avatar className="h-8 w-8 flex-shrink-0">
      <AvatarImage src={item.image ?? ""} />
      <AvatarFallback className="bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100">
        {item.name ? getInitials(item.name)[0] : item.email[0].toUpperCase()}
      </AvatarFallback>
    </Avatar>
    <div className="flex min-w-0 flex-1 flex-col">
      <span className="block truncate font-medium text-neutral-900 dark:text-neutral-100">
        {item.name || item.email}
      </span>
      {item.name ? (
        <span className="block truncate text-xs text-neutral-500 dark:text-neutral-400">
          {item.email}
        </span>
      ) : null}
    </div>
  </div>
);

export const MemberRoleCell = ({
  item,
  t,
  getRoleText,
  handleUpdateRole,
}: Pick<MemberTableProps, "t" | "getRoleText" | "handleUpdateRole"> & {
  item: MemberItem;
}) => {
  if (item.status === "invited") {
    return (
      <span className="text-sm text-neutral-500 dark:text-neutral-400">
        {getRoleText(item.role)} ({t.table.statusInvited})
      </span>
    );
  }
  return (
    <Select
      value={item.role}
      onValueChange={(role) => {
        if (role === "owner" || role === "admin" || role === "member") {
          void handleUpdateRole(item.id, role);
        }
      }}
    >
      <SelectTrigger className="h-8 w-[160px] bg-transparent">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="owner">{t.owner}</SelectItem>
        <SelectItem value="admin">{t.admin}</SelectItem>
        <SelectItem value="member">{t.member}</SelectItem>
      </SelectContent>
    </Select>
  );
};

export const MemberActionsCell = ({
  item,
  t,
  setRemoveMemberId,
  setCancelInvitationId,
}: Pick<
  MemberTableProps,
  "t" | "setRemoveMemberId" | "setCancelInvitationId"
> & { item: MemberItem }) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
      >
        <MoreHorizontal className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem
        className="text-red-600 focus:text-red-600 dark:text-red-500 dark:focus:text-red-500"
        onClick={() =>
          item.status === "invited"
            ? setCancelInvitationId(item.id)
            : setRemoveMemberId(item.id)
        }
      >
        {item.status === "invited"
          ? t.invitations.cancel
          : t.table.removeMember}
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

function buildMemberColumns(
  props: Pick<
    MemberTableProps,
    | "t"
    | "getRoleText"
    | "handleUpdateRole"
    | "setRemoveMemberId"
    | "setCancelInvitationId"
  >,
): Column<MemberItem>[] {
  return [
    {
      header: props.t.table.name,
      headerClassName: "w-[50%]",
      cell: (item) => <MemberIdentityCell item={item} />,
    },
    {
      header: props.t.table.role,
      headerClassName: "w-[200px]",
      cell: (item) => <MemberRoleCell item={item} {...props} />,
    },
    {
      header: "",
      headerClassName: "w-[50px]",
      cellClassName: "text-right",
      cell: (item) => <MemberActionsCell item={item} {...props} />,
    },
  ];
}

function getViewingText(
  props: Pick<MemberTableProps, "t" | "page" | "allItems" | "totalCount">,
) {
  const { t, page, allItems, totalCount } = props;
  if (!totalCount || totalCount <= 0) return "";
  const offset = (page - 1) * allItems.length;
  return t.table.viewingMembers
    .replace("{{start}}", String(offset + Math.min(1, allItems.length)))
    .replace("{{end}}", String(offset + allItems.length))
    .replace("{{total}}", String(totalCount));
}

export function MemberTable({
  t,
  allItems,
  isLoading,
  search,
  onSearchChange,
  filters,
  page,
  hasNextPage,
  hasPreviousPage,
  onNextPage,
  onPreviousPage,
  isFetching,
  skeletonCount,
  totalCount,
  getRoleText,
  handleUpdateRole,
  setRemoveMemberId,
  setCancelInvitationId,
}: MemberTableProps) {
  const columns = buildMemberColumns({
    t,
    getRoleText,
    handleUpdateRole,
    setRemoveMemberId,
    setCancelInvitationId,
  });

  return (
    <DataTable
      columns={columns}
      data={allItems}
      isLoading={isLoading}
      isFetching={isFetching}
      skeletonCount={skeletonCount ?? 10}
      keyExtractor={(item) => item.id}
      emptyMessage="No members found."
      heightClass="h-[650px]"
      search={search}
      onSearchChange={onSearchChange}
      searchPlaceholder={t.table.searchPlaceholder || "Search..."}
      filters={filters}
      pagination={{
        viewingText: getViewingText({ t, page, allItems, totalCount }),
        hasNextPage,
        hasPreviousPage,
        onNext: onNextPage,
        onPrevious: onPreviousPage,
      }}
    />
  );
}
