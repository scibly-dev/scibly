import { getLocale } from "@scibly/i18n";
import { marketingCtaHref } from "@scibly/routes";
import LanguageSwitcher from "@scibly/ui/components/language-switcher";
import Logo from "@scibly/ui/marketing/logo";
import { Suspense } from "react";

import { getFullDictionary } from "@/i18n/dictionaries";
import { api, HydrateClient } from "@/shared/api/trpc/server";

import { AnonymousCoursePlayer } from "./components/anonymous-course-player";

type PublicCourseParams = Promise<{ lang: string; courseId: string }>;

const PAGE_CLASS =
  "flex min-h-screen w-full flex-col items-center bg-neutral-50/50 dark:bg-neutral-950/50";

export function PublicCourseScreen({ params }: { params: PublicCourseParams }) {
  return (
    <Suspense fallback={<main className={PAGE_CLASS} />}>
      <PublicCoursePage params={params} />
    </Suspense>
  );
}

async function PublicCoursePage({ params }: { params: PublicCourseParams }) {
  const { lang, courseId } = await params;
  const locale = getLocale(lang, true);
  void api.course.getPublicCourse.prefetch({ courseId });
  const t = (await getFullDictionary(locale)).publicCourse;

  return (
    <main className={PAGE_CLASS}>
      <header className="sticky top-0 z-40 w-full border-b border-neutral-200/60 bg-white/80 backdrop-blur-md dark:border-neutral-800/60 dark:bg-neutral-900/80">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-8">
          <Logo size="small" className="text-neutral-900 dark:text-white" />
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <span className="hidden items-center gap-2 rounded-full border border-[#D7F3EE] bg-[#EFFAF8] px-3 py-1.5 text-xs font-medium text-[#237E70] lg:inline-flex dark:border-[#235E55] dark:bg-[#163B35] dark:text-[#8EDBCC]">
              <span
                className="h-1.5 w-1.5 rounded-full bg-[#40C1AB]"
                aria-hidden
              />
              {t.header.offer}
            </span>
            <a
              href={marketingCtaHref(locale)}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-primary text-primary-foreground hover:bg-primary/95 inline-flex items-center justify-center rounded-xl px-4 py-2 text-xs font-semibold shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {t.header.cta}
            </a>
          </div>
        </div>
      </header>

      <div className="w-full max-w-[1400px] flex-1 px-8 py-8">
        <HydrateClient>
          <AnonymousCoursePlayer courseId={courseId} source="DIRECT" />
        </HydrateClient>
      </div>

      <footer className="mt-auto hidden w-full border-t border-neutral-200/60 bg-white py-8 md:block dark:border-neutral-800/60 dark:bg-neutral-900">
        <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-4 px-8 sm:flex-row">
          <Logo size="small" className="text-neutral-900 dark:text-white" />
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {t.footer.message}
          </p>
          <a
            href={marketingCtaHref(locale)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-xl bg-neutral-950 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-neutral-900 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-100"
          >
            {t.footer.cta}
          </a>
        </div>
      </footer>
    </main>
  );
}
