import { ErrorBoundaryWrapper } from "@scibly/ui/components/error-boundary-wrapper";

import { Footer } from "@/app/[lang]/components/footer";
import { Navbar } from "@/app/[lang]/components/navbar";
import { SiteBackdrop } from "@/app/[lang]/components/site-backdrop";
import { getFullDictionary } from "@/i18n/dictionaries";

interface LangLayoutProps {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}

export default async function LangLayout({
  children,
  params,
}: LangLayoutProps) {
  const { lang } = await params;
  const dict = await getFullDictionary(lang);

  return (
    <ErrorBoundaryWrapper>
      <div className="relative flex min-h-dvh flex-col">
        <SiteBackdrop />
        <div className="relative z-10 flex min-h-dvh flex-col">
          <a
            href="#main-content"
            className="sr-only rounded-full bg-[#0066FF] px-5 py-2.5 text-[14px] font-semibold text-white no-underline focus-visible:not-sr-only focus-visible:fixed focus-visible:top-3 focus-visible:left-3 focus-visible:z-50"
          >
            {dict.home.navbar.skipToContent}
          </a>
          <Navbar t={dict.home.navbar} />
          <div id="main-content" tabIndex={-1} className="flex flex-1 flex-col">
            {children}
          </div>
          <Footer t={dict.home.footer} />
        </div>
      </div>
    </ErrorBoundaryWrapper>
  );
}
