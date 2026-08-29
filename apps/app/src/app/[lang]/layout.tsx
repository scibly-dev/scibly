import { getLocale } from "@scibly/i18n";
import { ErrorBoundaryWrapper } from "@scibly/ui/components/error-boundary-wrapper";
import { Toaster } from "@scibly/ui/components/sonner";

import { getDictionary } from "@/i18n/dictionaries";
import Providers from "@/shared/api/provider";

import { HtmlLang } from "./html-lang";

export async function generateStaticParams() {
  return [{ lang: "en" }, { lang: "de" }];
}

export default async function LangLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}>) {
  const { lang } = await params;
  // The proxy already redirects anything else away, but the route param is the boundary and nothing downstream should have to trust it.
  const locale = getLocale(lang, true);
  const { errorBoundaryTitle, errorBoundaryRetryLabel } = await getDictionary(
    locale,
    "appRoutes",
  );

  return (
    <div data-locale={locale}>
      <HtmlLang lang={locale} />
      <ErrorBoundaryWrapper
        title={errorBoundaryTitle}
        retryLabel={errorBoundaryRetryLabel}
      >
        <Toaster richColors />
        <Providers>{children}</Providers>
      </ErrorBoundaryWrapper>
    </div>
  );
}
