import type { Locale } from "@scibly/i18n/constants";

import { defaultLocale } from "@scibly/i18n/constants";
import * as React from "react";

import { OwnerNoticeMail } from "../components/owner-notice-mail";
import { getPublicSessionCeilingMailMessages } from "../i18n";

interface PublicSessionCeilingMailProps {
  url: string;
  organizationName: string;
  used: number;
  limit: number;
  locale?: Locale;
}

export default function PublicSessionCeilingMail({
  url,
  organizationName,
  used,
  limit,
  locale = defaultLocale,
}: PublicSessionCeilingMailProps): React.ReactElement {
  const t = getPublicSessionCeilingMailMessages(locale);

  return (
    <OwnerNoticeMail
      url={url}
      organizationName={organizationName}
      logoAlt={t.logoAlt}
      preview={t.preview(organizationName)}
      heading={t.heading}
      bodyIntro={t.bodyIntro(organizationName, used, limit)}
      consequence={t.consequence}
      buttonLabel={t.manageButton}
      footer={t.footer}
    />
  );
}
