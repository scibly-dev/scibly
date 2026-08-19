import { getSession } from "@scibly/auth/session";
import { constructMetadata } from "@scibly/lib";
import { SciblyPostHogProvider } from "@scibly/observability/provider";
import { routes } from "@scibly/routes";
import { ErrorBoundaryWrapper } from "@scibly/ui/components/error-boundary-wrapper";
import { type Metadata } from "next";
import { redirect } from "next/navigation";

import { ProfileShell } from "@/features/organizations/client";
import { getFullDictionary } from "@/i18n/dictionaries";
import { ProductAnalytics } from "@/shared/analytics/product-analytics";
import { api, HydrateClient } from "@/shared/api/trpc/server";

export const metadata: Metadata = constructMetadata({
  title: "Profilbereich",
  description:
    "Verwalte dein Konto, deine Kurse und deine Einstellungen in Scibly.",
  noIndex: true,
});

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}>) {
  const [{ lang }, session] = await Promise.all([params, getSession()]);

  if (!session?.user) {
    redirect(routes.app.auth.clearSession);
  }

  void api.organization.listMyOrgs.prefetch();

  const dict = await getFullDictionary(lang);

  return (
    <SciblyPostHogProvider surface="app">
      <ProductAnalytics />
      <HydrateClient>
        <ErrorBoundaryWrapper>
          <ProfileShell
            user={{
              name: session.user.name,
              username: session.user.username,
              image: session.user.image,
            }}
            paymentLapse={dict.orgBilling.paymentLapse}
          >
            <ErrorBoundaryWrapper>{children}</ErrorBoundaryWrapper>
          </ProfileShell>
        </ErrorBoundaryWrapper>
      </HydrateClient>
    </SciblyPostHogProvider>
  );
}
