import { OrganizationInvitationsScreen } from "@/features/organizations/invitations/screen";

export default function InvitationsPage(props: {
  params: Promise<{ lang: string }>;
}) {
  return <OrganizationInvitationsScreen {...props} />;
}
