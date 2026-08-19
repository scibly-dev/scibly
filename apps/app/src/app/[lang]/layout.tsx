import { ErrorBoundaryWrapper } from "@scibly/ui/components/error-boundary-wrapper";
import { Toaster } from "@scibly/ui/components/sonner";

import { getDictionary } from "@/i18n/dictionaries";
import Providers from "@/shared/api/provider";

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
  const { errorBoundaryTitle, errorBoundaryRetryLabel } = await getDictionary(
    lang,
    "appRoutes",
  );

  return (
    <div data-locale={lang}>
      {/* `<html>` is one segment above, where the locale isn't a param yet. */}
      <script
        dangerouslySetInnerHTML={{
          __html: `document.documentElement.lang=${JSON.stringify(lang)}`,
        }}
      />
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
