"use client";

import type { NotebookTranslations } from "@/features/notebook/i18n/notebook.types";

import LanguageSwitcher from "@scibly/ui/components/language-switcher";
import Logo from "@scibly/ui/marketing/logo";

import { DemoNotebookWorkspace } from "./demo-notebook-workspace";
import { ShowcaseRuntimeProvider } from "./showcase-runtime";

type DemoCopy = {
  conversionOffer: string;
  conversionCta: string;
};

export function DemoNotebookPageClient({
  t,
  greeting,
  copy,
  initialMessage,
  ctaHref,
  workspaceTitle,
}: {
  t: NotebookTranslations;
  greeting: string;
  copy: DemoCopy;
  initialMessage?: string;
  ctaHref: string;
  workspaceTitle: string;
}) {
  return (
    <main className="flex h-dvh w-full flex-col overflow-hidden bg-neutral-50/50 dark:bg-neutral-950/50">
      <header className="z-40 w-full shrink-0 border-b border-neutral-200/60 bg-white/80 backdrop-blur-md dark:border-neutral-800/60 dark:bg-neutral-900/80">
        <div className="flex h-14 w-full items-center justify-between px-4 sm:px-6">
          <div className="flex items-center">
            <Logo
              size="small"
              className="text-neutral-900 dark:text-white"
              href={ctaHref}
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-2 rounded-full border border-[#D7F3EE] bg-[#EFFAF8] px-3 py-1.5 text-xs font-medium text-[#237E70] lg:inline-flex dark:border-[#235E55] dark:bg-[#163B35] dark:text-[#8EDBCC]">
              <span
                className="h-1.5 w-1.5 rounded-full bg-[#40C1AB]"
                aria-hidden
              />
              {copy.conversionOffer}
            </span>
            <LanguageSwitcher />
            <a
              href={ctaHref}
              className="bg-primary text-primary-foreground hover:bg-primary/95 inline-flex items-center justify-center rounded-xl px-4 py-2 text-xs font-semibold shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {copy.conversionCta}
            </a>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <ShowcaseRuntimeProvider>
          <DemoNotebookWorkspace
            greeting={greeting}
            initialMessage={initialMessage}
            t={t}
            ctaHref={ctaHref}
            workspaceTitle={workspaceTitle}
          />
        </ShowcaseRuntimeProvider>
      </div>
    </main>
  );
}
