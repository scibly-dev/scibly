"use client";

import type { DictionaryPages } from "@/i18n/types";

import { Button } from "@scibly/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@scibly/ui/components/dropdown-menu";
import { CircleCheck, CircleDashed, Filter, UserCheck, X } from "lucide-react";

interface MemberControlsProps {
  t: DictionaryPages["orgMembers"];
  search: string;
  setSearch: (val: string) => void;
  roleFilter: string;
  setRoleFilter: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: "all" | "active" | "invited") => void;
}

type FilterControlsProps = Pick<
  MemberControlsProps,
  "t" | "roleFilter" | "setRoleFilter" | "statusFilter" | "setStatusFilter"
>;

function setValidStatus(
  value: string,
  setter: MemberControlsProps["setStatusFilter"],
) {
  if (value === "all" || value === "active" || value === "invited") {
    setter(value);
  }
}

export const FilterPicker = (props: FilterControlsProps) => {
  const activeCount =
    (props.roleFilter !== "all" ? 1 : 0) +
    (props.statusFilter !== "all" ? 1 : 0);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="h-9 gap-2 border-dashed bg-white/50 hover:bg-white/80 dark:bg-neutral-900/50 dark:hover:bg-neutral-900/80"
        >
          <Filter className="h-4 w-4" />
          {props.t.table.filter}
          {activeCount > 0 ? (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-neutral-900 text-xs font-medium text-white dark:bg-white dark:text-neutral-900">
              {activeCount}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[200px]">
        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <UserCheck className="mr-2 h-4 w-4" />
              <span>{props.t.table.role}</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuRadioGroup
                  value={props.roleFilter}
                  onValueChange={props.setRoleFilter}
                >
                  <DropdownMenuRadioItem value="all">
                    {props.t.table.allRoles}
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="owner">
                    {props.t.owner}
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="admin">
                    {props.t.admin}
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="member">
                    {props.t.member}
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <CircleDashed className="mr-2 h-4 w-4" />
              <span>{props.t.table.status}</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuRadioGroup
                  value={props.statusFilter}
                  onValueChange={(value) =>
                    setValidStatus(value, props.setStatusFilter)
                  }
                >
                  <DropdownMenuRadioItem value="all">
                    {props.t.table.allStatuses}
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="active">
                    {props.t.table.statusActive}
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="invited">
                    {props.t.table.statusInvited}
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const StatusFilterPill = (props: FilterControlsProps) => {
  if (props.statusFilter === "all") return null;
  return (
    <div className="flex h-8 items-center rounded-lg border border-neutral-200 bg-white/80 text-sm shadow-sm backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/80">
      <div className="flex h-full items-center gap-2 border-r border-neutral-200 pr-2 pl-3.5 font-medium text-neutral-700 dark:border-neutral-800 dark:text-neutral-300">
        <CircleDashed className="h-3.5 w-3.5 text-neutral-500" />
        {props.t.table.status}
      </div>
      <div className="flex h-full items-center border-r border-neutral-200 bg-neutral-50/50 px-2 text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900/30">
        {props.t.table.is}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger className="flex h-full items-center gap-1.5 border-r border-neutral-200 px-3 font-medium outline-none hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800">
          <CircleCheck className="h-3.5 w-3.5 text-green-500" />
          {props.statusFilter === "active"
            ? props.t.table.statusActive
            : props.t.table.statusInvited}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuRadioGroup
            value={props.statusFilter}
            onValueChange={(value) =>
              setValidStatus(value, props.setStatusFilter)
            }
          >
            <DropdownMenuRadioItem value="active">
              {props.t.table.statusActive}
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="invited">
              {props.t.table.statusInvited}
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <button
        onClick={() => props.setStatusFilter("all")}
        className="flex h-full items-center justify-center rounded-r-lg pr-3 pl-2 text-neutral-400 outline-none hover:text-neutral-900 dark:hover:text-neutral-100"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

export const RoleFilterPill = (props: FilterControlsProps) => {
  if (props.roleFilter === "all") return null;
  const roleText =
    props.roleFilter === "owner"
      ? props.t.owner
      : props.roleFilter === "admin"
        ? props.t.admin
        : props.t.member;
  return (
    <div className="flex h-8 items-center rounded-lg border border-neutral-200 bg-white/80 text-sm shadow-sm backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/80">
      <div className="flex h-full items-center gap-2 border-r border-neutral-200 pr-2 pl-3.5 font-medium text-neutral-700 dark:border-neutral-800 dark:text-neutral-300">
        <UserCheck className="h-3.5 w-3.5 text-neutral-500" />
        {props.t.table.role}
      </div>
      <div className="flex h-full items-center border-r border-neutral-200 bg-neutral-50/50 px-2 text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900/30">
        {props.t.table.is}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger className="flex h-full items-center gap-1.5 border-r border-neutral-200 px-3 font-medium outline-none hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800">
          <UserCheck className="h-3.5 w-3.5 text-neutral-500" />
          {roleText}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuRadioGroup
            value={props.roleFilter}
            onValueChange={props.setRoleFilter}
          >
            <DropdownMenuRadioItem value="owner">
              {props.t.owner}
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="admin">
              {props.t.admin}
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="member">
              {props.t.member}
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <button
        onClick={() => props.setRoleFilter("all")}
        className="flex h-full items-center justify-center rounded-r-lg pr-3 pl-2 text-neutral-400 outline-none hover:text-neutral-900 dark:hover:text-neutral-100"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

export function MemberControls({
  t,
  roleFilter,
  setRoleFilter,
  statusFilter,
  setStatusFilter,
}: MemberControlsProps) {
  const activeFiltersCount =
    (roleFilter !== "all" ? 1 : 0) + (statusFilter !== "all" ? 1 : 0);
  const filterProps = {
    t,
    roleFilter,
    setRoleFilter,
    statusFilter,
    setStatusFilter,
  };

  return (
    <>
      <FilterPicker {...filterProps} />
      {activeFiltersCount > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <StatusFilterPill {...filterProps} />
          <RoleFilterPill {...filterProps} />
        </div>
      ) : null}
    </>
  );
}
