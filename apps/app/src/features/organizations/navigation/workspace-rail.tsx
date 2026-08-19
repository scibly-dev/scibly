"use client";

import { getInitials } from "@scibly/lib";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@scibly/ui/components/avatar";
import { cn } from "@scibly/ui/utils";
import { Plus, User } from "lucide-react";
import { memo } from "react";

import { type Organization } from "./types";

type WorkspaceRailProps = {
  userName: string;
  userImage: string | null;
  organizations: Organization[];
  activeWorkspace:
    | { type: "personal" }
    | { type: "organization"; orgId: string; slug: string };
  onSelectPersonal: () => void;
  onSelectOrg: (orgId: string) => void;
  onCreateOrg: () => void;
};

export const PersonalWorkspaceButton = ({
  userName,
  userImage,
  isActive,
  onSelect,
}: {
  userName: string;
  userImage: string | null;
  isActive: boolean;
  onSelect: () => void;
}) => (
  <button
    onClick={onSelect}
    className={cn(
      "group relative mb-3 flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200",
      "ease-press transition-[translate,box-shadow,background-color] duration-100 active:translate-y-[2px] active:shadow-none",
      isActive
        ? "bg-[#0066FF] text-white shadow-[0_2px_0_0_#0046ad,inset_0_1px_0_rgba(255,255,255,0.28)]"
        : "bg-ground text-ink-soft border-edge hover:text-ink border-2 shadow-[0_2px_0_0_var(--color-lip)] hover:bg-white",
    )}
    aria-label="Personal workspace"
    title="Persönlicher Bereich"
  >
    {userImage ? (
      <Avatar className="h-10 w-10 rounded-xl">
        <AvatarImage src={userImage} alt={userName} />
        <AvatarFallback className="rounded-xl bg-transparent text-xs">
          {getInitials(userName)[0]}
        </AvatarFallback>
      </Avatar>
    ) : (
      <User className="h-4 w-4" />
    )}
    {isActive ? (
      <div className="absolute -left-[14px] h-5 w-1 rounded-r-full bg-[#0066FF]" />
    ) : null}
  </button>
);

export const OrganizationWorkspaceButton = ({
  organization,
  isActive,
  onSelect,
}: {
  organization: Organization;
  isActive: boolean;
  onSelect: () => void;
}) => (
  <button
    onClick={onSelect}
    className={cn(
      "group relative flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200",
      "ease-press transition-[translate,box-shadow,background-color] duration-100 active:translate-y-[2px] active:shadow-none",
      isActive
        ? "bg-[#0066FF] text-white shadow-[0_2px_0_0_#0046ad,inset_0_1px_0_rgba(255,255,255,0.28)]"
        : "bg-ground text-ink-soft border-edge hover:text-ink border-2 shadow-[0_2px_0_0_var(--color-lip)] hover:bg-white",
    )}
    aria-label={`Organization: ${organization.name}`}
    title={organization.name}
  >
    {organization.logo ? (
      <Avatar className="h-10 w-10 rounded-xl">
        <AvatarImage src={organization.logo} alt={organization.name} />
        <AvatarFallback className="rounded-xl bg-transparent text-xs">
          {getInitials(organization.name)[0]}
        </AvatarFallback>
      </Avatar>
    ) : (
      <span className="text-xs font-semibold">
        {getInitials(organization.name)[0]}
      </span>
    )}
    {isActive ? (
      <div className="absolute -left-[14px] h-5 w-1 rounded-r-full bg-[#0066FF]" />
    ) : null}
  </button>
);

export const WorkspaceRail = memo(
  ({
    userName,
    userImage,
    organizations,
    activeWorkspace,
    onSelectPersonal,
    onSelectOrg,
    onCreateOrg,
  }: WorkspaceRailProps) => {
    const isPersonalActive = activeWorkspace.type === "personal";

    return (
      <div className="border-hairline flex h-full w-[60px] flex-col items-center border-r bg-white py-4">
        <PersonalWorkspaceButton
          userName={userName}
          userImage={userImage}
          isActive={isPersonalActive}
          onSelect={onSelectPersonal}
        />
        <div className="bg-hairline mx-auto mb-3 h-px w-6" />
        <div className="flex flex-1 flex-col items-center gap-2 overflow-y-auto">
          {organizations.map((org) => {
            const isActive =
              activeWorkspace.type === "organization" &&
              activeWorkspace.orgId === org.id;
            return (
              <OrganizationWorkspaceButton
                key={org.id}
                organization={org}
                isActive={isActive}
                onSelect={() => onSelectOrg(org.id)}
              />
            );
          })}
        </div>
        {/* Matches the server's organizationLimit of 1. */}
        {organizations.length === 0 && (
          <button
            onClick={onCreateOrg}
            className="border-hairline text-ink-faint hover:text-ink mt-3 flex h-10 w-10 items-center justify-center rounded-xl border-2 border-dashed transition-colors duration-200 hover:border-[#b9d7ff]"
            aria-label="Create organization"
            title="Organisation erstellen"
          >
            <Plus className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  },
);

WorkspaceRail.displayName = "WorkspaceRail";
export default WorkspaceRail;
