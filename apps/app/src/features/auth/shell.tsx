import { ErrorBoundaryWrapper } from "@scibly/ui/components/error-boundary-wrapper";
import LanguageSwitcher from "@scibly/ui/components/language-switcher";
import Logo, { COMPANY_NAME } from "@scibly/ui/marketing/logo";
import { cacheLife } from "next/cache";
import Image from "next/image";

import { env } from "@/env";
import { getFullDictionary } from "@/i18n/dictionaries";
import { BrandBackdrop } from "@/shared/ui/brand-backdrop";

// Cached forever: the year is not request data, so reading it inline would make
// every auth page unprerenderable.
async function getCurrentYear() {
  "use cache";
  cacheLife("max");
  return new Date().getFullYear();
}

export async function AuthShell(
  props: Readonly<{
    children: React.ReactNode;
    lang: string;
  }>,
) {
  const { children } = props;
  const { lang } = props;
  const dict = await getFullDictionary(lang);
  const authT = dict.auth;

  return (
    <ErrorBoundaryWrapper>
      <div className="font-display text-ink relative flex min-h-screen flex-col bg-[#fbfcff]">
        <BrandBackdrop />

        {env.NEXT_PUBLIC_BETA_FLAG && !env.NEXT_PUBLIC_FREE_ACCESS_FLAG ? (
          <div className="bg-brand-blue-muted text-brand-ink relative z-40 border-b border-blue-200/70 px-4 py-2.5 text-center text-sm font-medium">
            {authT.betaBanner.message}{" "}
            <a
              href="mailto:team@scibly.com"
              className="text-brand-blue decoration-brand-blue/30 hover:text-brand-blue-hover font-semibold underline underline-offset-4 transition-colors"
            >
              {authT.betaBanner.contactLabel}
            </a>
          </div>
        ) : null}

        {/* One frame, not two halves of a page: the split lives inside a
            single rounded card, so the seam is an ordinary internal edge
            instead of something to disguise. */}
        <div className="relative z-10 flex flex-1 items-center justify-center p-4 py-8 md:p-8">
          <div className="border-hairline grid w-full max-w-[1180px] overflow-hidden rounded-[28px] border-2 bg-white shadow-[0_10px_0_0_var(--color-lip)] lg:min-h-[680px] lg:grid-cols-2">
            <div className="flex flex-col">
              <header className="flex h-16 w-full items-center justify-between px-5 md:px-8">
                <Logo className="text-xl tracking-[-0.03em]" />
                <LanguageSwitcher />
              </header>

              <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6 md:py-14">
                <section className="w-full max-w-[400px]">
                  {children}
                  <div className="text-ink-soft mt-6 text-center text-xs">
                    © {await getCurrentYear()} {COMPANY_NAME}.{" "}
                    {lang === "de"
                      ? "Alle Rechte vorbehalten."
                      : "All rights reserved."}
                  </div>
                </section>
              </main>
            </div>

            <div className="relative hidden lg:block">
              <Image
                src="/auth/login-hero.webp"
                alt=""
                fill
                priority
                sizes="50vw"
                className="object-cover"
              />
              {/* The mountain in the photo gets its own caption — the same
                  serif-accent flourish the onboarding headlines use. */}
              <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 via-black/15 to-transparent px-8 pt-24 pb-9">
                <p className="text-[13px] font-semibold tracking-[0.14em] text-white/70 uppercase">
                  {authT.heroPanel.eyebrow}
                </p>
                <p className="mt-2 text-[clamp(26px,2.6vw,34px)] leading-[1.15] font-medium tracking-[-0.02em] text-white">
                  {authT.heroPanel.title}
                  <span className="font-serif-accent font-normal tracking-[-0.01em] italic">
                    {authT.heroPanel.titleAccent}
                  </span>
                </p>
                <p className="mt-2 max-w-[34ch] text-[14.5px] leading-[1.5] text-white/75">
                  {authT.heroPanel.subtitle}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundaryWrapper>
  );
}
