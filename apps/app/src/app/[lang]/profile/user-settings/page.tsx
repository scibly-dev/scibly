import { getLocale } from "@scibly/i18n";

import { UserSettingsScreen } from "@/features/auth/server";

export default async function UserSettingsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  return <UserSettingsScreen locale={getLocale(lang, true)} />;
}
