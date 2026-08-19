import { getLocale } from "@scibly/i18n";

import { getFullDictionary } from "@/i18n/dictionaries";

import { InvitationsClientComponent } from "./invitations-client";

export async function OrganizationInvitationsScreen(props: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await props.params;
  const dict = await getFullDictionary(lang);

  return (
    <InvitationsClientComponent
      t={dict.invitations}
      locale={getLocale(lang, true)}
    />
  );
}
