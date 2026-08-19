import type { Locale } from "@scibly/i18n/constants";

import { defaultLocale } from "@scibly/i18n/constants";
import * as React from "react";
import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Row,
  Section,
  Tailwind,
  Text,
} from "react-email";

import { COMPANY_NAME, LOGO_URL } from "../consts";
import { getResetPasswordMailMessages } from "../i18n";
import { TYPE_TO_MAIL_MAP } from "../types";

const SUPPORT_EMAIL = TYPE_TO_MAIL_MAP.support;

const tailwindConfig = {
  theme: {
    extend: {
      colors: {
        fg: "#111111",
        "fg-2": "#3c3c43",
        "fg-muted": "#86868b",
        surface: "#ffffff",
        "surface-2": "#f5f5f7",
      },
    },
  },
};

export default function ResetPasswordMail({
  url,
  name,
  locale = defaultLocale,
}: {
  url: string;
  name: string;
  locale?: Locale;
}) {
  const t = getResetPasswordMailMessages(locale);

  return (
    <Tailwind config={tailwindConfig}>
      <Html>
        <Head />
        <Preview>{t.preview(COMPANY_NAME)}</Preview>
        <Body className="m-0 bg-surface-2 font-sans">
          <Container className="mx-auto my-10 max-w-[600px]">
            <Section className="px-10 pb-0 pt-0">
              <Row>
                <Column className="w-1/2 py-2 align-middle">
                  <Img
                    src={LOGO_URL}
                    alt={t.logoAlt}
                    width="72"
                    className="block"
                  />
                </Column>
                <Column className="w-1/2 py-2 align-middle text-right">
                  <Text className="m-0 text-[13px] text-fg-muted">
                    {COMPANY_NAME}
                  </Text>
                </Column>
              </Row>
            </Section>

            <Section className="mt-4 rounded-lg bg-surface px-10 py-14 text-center">
              <Text className="m-0 mb-5 text-[12px] font-medium uppercase tracking-widest text-fg-muted">
                {t.resetButton}
              </Text>

              <Heading className="m-0 mb-4 text-[32px] font-semibold leading-tight tracking-tight text-fg">
                {t.greeting(name)}
              </Heading>

              <Text className="mx-auto m-0 mb-8 text-[16px] leading-relaxed text-fg-muted">
                {t.bodyIntro(COMPANY_NAME)}
              </Text>

              <Button
                href={url}
                className="inline-block rounded-full bg-fg px-8 py-3 text-[14px] font-semibold text-white no-underline"
              >
                {t.resetButton} →
              </Button>
            </Section>

            <Section className="px-10 py-8 text-center">
              <Text className="m-0 mb-2 text-[12px] leading-relaxed text-fg-muted">
                {t.ignoreHint}
              </Text>
              <Text className="m-0 text-[12px] leading-relaxed text-fg-muted">
                {t.footer(SUPPORT_EMAIL)}
              </Text>
            </Section>
          </Container>
        </Body>
      </Html>
    </Tailwind>
  );
}
