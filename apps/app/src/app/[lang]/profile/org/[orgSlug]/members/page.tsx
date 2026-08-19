import { OrganizationMembersScreen } from "@/features/organizations/members/screen";

export default function OrganizationMembersPage(props: {
  params: Promise<{ lang: string; orgSlug: string }>;
}) {
  return <OrganizationMembersScreen {...props} />;
}
