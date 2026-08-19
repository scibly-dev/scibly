import { OrganizationSettingsScreen } from "@/features/organizations/settings/screen";

export default function OrganizationSettingsPage(props: {
  params: Promise<{ lang: string; orgSlug: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return <OrganizationSettingsScreen {...props} />;
}
