import { getLocale } from "@scibly/i18n";
import { constructMetadata } from "@scibly/lib";
import {
  INITIAL_MESSAGE_QUERY_PARAM,
  marketingCtaHref,
  parseDemoInitialMessage,
} from "@scibly/routes";
import { type Metadata } from "next";

import { DemoNotebookPageClient } from "@/features/notebook/demo/demo-notebook-page-client";
import { DEMO_INITIAL_MESSAGE } from "@/features/notebook/demo/fixture";
import { getDictionary } from "@/i18n/dictionaries";

export async function generateMetadata(props: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await props.params;
  const t = await getDictionary(lang, "notebook");
  return constructMetadata({
    title: t.demo.metaTitle,
    description: t.demo.metaDescription,
    locale: getLocale(lang, true),
  });
}

export default async function DemoNotebookPage(props: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{
    [key: string]: string | string[] | undefined;
  }>;
}) {
  const { lang } = await props.params;
  const locale = getLocale(lang, true);
  const searchParams = await props.searchParams;
  const initialMessage =
    parseDemoInitialMessage(searchParams[INITIAL_MESSAGE_QUERY_PARAM]) ??
    DEMO_INITIAL_MESSAGE;
  const t = await getDictionary(locale, "notebook");

  return (
    <DemoNotebookPageClient
      greeting={t.demo.greeting}
      initialMessage={initialMessage}
      t={t}
      copy={{
        conversionOffer: t.demo.conversionOffer,
        conversionCta: t.demo.conversionCta,
      }}
      ctaHref={marketingCtaHref(locale)}
      workspaceTitle={t.demo.workspaceTitle}
    />
  );
}
