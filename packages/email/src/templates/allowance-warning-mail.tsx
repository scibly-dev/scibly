import type { Locale } from "@scibly/i18n/constants";
import type { AllowanceWarningLevel } from "../i18n/messages";

import { defaultLocale } from "@scibly/i18n/constants";
import * as React from "react";

import { OwnerNoticeMail } from "../components/owner-notice-mail";
import { getAllowanceWarningMailMessages } from "../i18n";

interface AllowanceWarningMailProps {
  url: string;
  organizationName: string;

  threshold: AllowanceWarningLevel;

  remaining: number;
  allowance: number;
  locale?: Locale;
}

export default function AllowanceWarningMail({
  url,
  organizationName,
  threshold,
  remaining,
  allowance,
  locale = defaultLocale,
}: AllowanceWarningMailProps): React.ReactElement {
  const { byLevel, footer, logoAlt } = getAllowanceWarningMailMessages(locale);
  const t = byLevel[threshold];

  return (
    <OwnerNoticeMail
      url={url}
      organizationName={organizationName}
      logoAlt={logoAlt}
      preview={t.preview(organizationName)}
      heading={t.heading}
      bodyIntro={t.bodyIntro(organizationName, remaining, allowance)}
      consequence={t.consequence}
      buttonLabel={t.manageButton}
      footer={footer}
      urgent={threshold === 95}
    />
  );
}

AllowanceWarningMail.PreviewProps = {
  url: "https://app.scibly.com/profile/org/acme-university/billing",
  organizationName: "Acme University",
  threshold: 95,
  remaining: 50,
  allowance: 1000,
} satisfies AllowanceWarningMailProps;
