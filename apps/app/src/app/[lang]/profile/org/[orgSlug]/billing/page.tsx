import { OrganizationBillingScreen } from "@scibly/ee-organizations-billing/screen";

export default function OrganizationBillingPage(props: {
  params: Promise<{ lang: string; orgSlug: string }>;
}) {
  return <OrganizationBillingScreen {...props} />;
}
