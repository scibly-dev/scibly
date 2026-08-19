"use client";

import type { LearningPlayerTranslations } from "../../../i18n/learning-player.types";

import { routes } from "@scibly/routes";
import { Award, Trophy } from "lucide-react";
import Link from "next/link";

import { env } from "@/env";
import { useTranslation } from "@/i18n/hooks/use-translation";

interface CourseCompleteSuccessProps {
  orgSlug?: string;
  courseTitle: string;
  totalSP: number;
  hasCertificate: boolean;
  onBackToDashboard?: () => void;
  backLabel?: string;
  showBranding?: boolean;
}

export const SuccessBranding = ({
  translations,
}: {
  translations: LearningPlayerTranslations;
}) => (
  <div className="mx-auto mt-4 flex w-full max-w-sm flex-col items-center gap-3 rounded-2xl border border-neutral-200 bg-neutral-50/50 p-5 text-center dark:border-neutral-800 dark:bg-neutral-900/30">
    <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
      {translations.branding.successTitle}
    </p>
    <p className="text-xs text-neutral-500 dark:text-neutral-400">
      {translations.branding.successDesc}
    </p>
    <a
      href={env.NEXT_PUBLIC_WEB_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="bg-primary text-primary-foreground hover:bg-primary/95 inline-flex items-center justify-center rounded-xl px-4 py-2 text-xs font-semibold shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
    >
      {translations.branding.successCta}
    </a>
  </div>
);

export function CourseCompleteSuccess({
  orgSlug,
  courseTitle,
  totalSP,
  hasCertificate,
  onBackToDashboard,
  backLabel,
  showBranding = false,
}: CourseCompleteSuccessProps) {
  const { translations } = useTranslation("learningPlayer");
  const t = translations.courseCompleteSuccess;

  const earnedSpParts = t.earnedSp.split("{{sp}}");

  return (
    <div className="flex min-h-[calc(65*var(--player-vh,1vh))] flex-1 flex-col items-center justify-center gap-8 py-12 text-center">
      <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-100 to-orange-100 shadow-lg dark:from-amber-900/30 dark:to-orange-900/30">
        <Trophy className="h-12 w-12 text-amber-500" />
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-[13px] font-semibold tracking-widest text-amber-500 uppercase">
          {t.badge}
        </p>
        <h1 className="text-foreground text-3xl font-bold tracking-tight">
          {courseTitle}
        </h1>
        <p className="text-muted-foreground mt-1 text-[15px]">
          {earnedSpParts[0]}
          <span className="text-foreground font-semibold">{totalSP} SP</span>
          {earnedSpParts[1]} {t.greatJob}
        </p>
      </div>

      {/* Certificate link — only shown when the user earned a certificate */}
      {hasCertificate && orgSlug && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-200/60 bg-amber-50 px-6 py-4 dark:border-amber-800/40 dark:bg-amber-900/10">
          <Award className="h-5 w-5 shrink-0 text-amber-500" />
          <p className="text-[13px] text-amber-700 dark:text-amber-300">
            {t.certReady}{" "}
            <Link
              href={routes.app.profile.org(orgSlug).learn.certificates}
              className="font-semibold underline underline-offset-2 hover:text-amber-900 dark:hover:text-amber-100"
            >
              {t.myCertificates}
            </Link>
            .
          </p>
        </div>
      )}

      <div className="flex gap-3 empty:hidden">
        {onBackToDashboard && (
          <button
            onClick={onBackToDashboard}
            className="rounded-xl border border-neutral-200 bg-white px-5 py-2.5 text-[13px] font-medium text-neutral-700 transition hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            {backLabel ?? t.backToDashboard}
          </button>
        )}
        {hasCertificate && orgSlug && (
          <Link
            href={routes.app.profile.org(orgSlug).learn.certificates}
            className="rounded-xl bg-amber-500 px-5 py-2.5 text-[13px] font-semibold text-white transition hover:bg-amber-600"
          >
            {t.viewCert}
          </Link>
        )}
      </div>

      {showBranding ? <SuccessBranding translations={translations} /> : null}
    </div>
  );
}
