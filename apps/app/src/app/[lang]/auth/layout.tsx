import type { Metadata } from "next";

import { constructMetadata } from "@scibly/lib";
import { SciblyPostHogProvider } from "@scibly/observability/provider";

import { AuthShell } from "@/features/auth/server";

export const metadata: Metadata = constructMetadata({
  title: "Authentifizierung",
  description:
    "Melde dich bei scibly an, registriere dich oder setze dein Passwort zurück, um mit interaktiven Kursen zu starten.",
  keywords: [
    "Scibly Login",
    "Scibly Registrierung",
    "Corporate Learning",
    "Learning Plattform",
  ],
});

export default async function AuthLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}>) {
  const { lang } = await params;
  return (
    <SciblyPostHogProvider surface="app">
      <AuthShell lang={lang}>{children}</AuthShell>
    </SciblyPostHogProvider>
  );
}
