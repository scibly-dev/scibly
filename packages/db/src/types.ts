import type { Member as PrismaMember } from "../schema/generated/prisma/client";

export const MEMBER_ROLES = ["owner", "admin", "member"] as const;

export type MemberRole = (typeof MEMBER_ROLES)[number];

export function toMemberRole(role: string): MemberRole {
  return MEMBER_ROLES.find((known) => known === role) ?? "member";
}

export type Member = Omit<PrismaMember, "role"> & {
  role: MemberRole;
};
