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
        urgent: "#b42318",
      },
    },
  },
};

interface OwnerNoticeMailProps {
  url: string;
  organizationName: string;
  logoAlt: string;
  preview: string;
  heading: string;
  bodyIntro: string;
  consequence: string;
  buttonLabel: string;
  footer: (supportEmail: string) => string;

  urgent?: boolean;
}

export function OwnerNoticeMail({
  url,
  organizationName,
  logoAlt,
  preview,
  heading,
  bodyIntro,
  consequence,
  buttonLabel,
  footer,
  urgent = false,
}: OwnerNoticeMailProps): React.ReactElement {
  return (
    <Tailwind config={tailwindConfig}>
      <Html>
        <Head />
        <Preview>{preview}</Preview>
        <Body className="m-0 bg-surface-2 font-sans">
          <Container className="mx-auto my-10 max-w-[600px]">
            <Section className="px-10 pb-0 pt-0">
              <Row>
                <Column className="w-1/2 py-2 align-middle">
                  <Img
                    src={LOGO_URL}
                    alt={logoAlt}
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
                {organizationName}
              </Text>

              <Heading
                className={`m-0 mb-4 text-[32px] font-semibold leading-tight tracking-tight ${
                  urgent ? "text-urgent" : "text-fg"
                }`}
              >
                {heading}
              </Heading>

              <Text className="mx-auto m-0 mb-4 text-[16px] leading-relaxed text-fg-2">
                {bodyIntro}
              </Text>

              <Text className="mx-auto m-0 mb-8 text-[16px] leading-relaxed text-fg-muted">
                {consequence}
              </Text>

              <Button
                href={url}
                className={`inline-block rounded-full px-8 py-3 text-[14px] font-semibold text-white no-underline ${
                  urgent ? "bg-urgent" : "bg-fg"
                }`}
              >
                {buttonLabel} →
              </Button>
            </Section>

            <Section className="px-10 py-8 text-center">
              <Text className="m-0 text-[12px] leading-relaxed text-fg-muted">
                {footer(SUPPORT_EMAIL)}
              </Text>
            </Section>
          </Container>
        </Body>
      </Html>
    </Tailwind>
  );
}
