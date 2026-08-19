"use client";

import { cardClass } from "@scibly/ui/design-language";
import { SciblyMark } from "@scibly/ui/marketing/logo";
import { cn } from "@scibly/ui/utils";
import { Award, Calendar, Zap } from "lucide-react";
import { useParams } from "next/navigation";

import { useTranslation } from "@/i18n/hooks/use-translation";
import { api } from "@/shared/api/trpc/client";
import { type RouterOutputs } from "@/shared/api/trpc/contracts";
import {
  CourseThumbnail,
  coverBadgeClass,
  coverToneFor,
} from "@/shared/ui/course-card-parts";

import { type CertificateTranslations } from "../i18n/certificates.types";

type Certificate = RouterOutputs["learning"]["listCertificates"][number];

const serial = (id: string) =>
  id
    .replace(/[^a-z0-9]/gi, "")
    .slice(-6)
    .toUpperCase();

const CertificateCard = ({
  cert,
  t,
  locale,
}: {
  cert: Certificate;
  t: CertificateTranslations["certificates"];
  locale: string;
}) => (
  <article className={cn(cardClass, "flex flex-col overflow-hidden")}>
    <CourseThumbnail
      src={null}
      alt={cert.courseName}
      seed={cert.id}
      glyph={<Award className="size-7" strokeWidth={2.2} />}
    >
      <div className="absolute top-4 left-4 z-10">
        <span className={cn(coverBadgeClass, "text-[11px] uppercase")}>
          {t.title}
        </span>
      </div>
      {/* The issuer stamps the cover rather than titling the card: on this page
          every card is scibly's, so the mark is a mark, not a headline. */}
      <div className="absolute top-4 right-4 z-10">
        <SciblyMark className="size-7 rounded-[8px]" />
      </div>
      <div className="absolute bottom-4 left-4 z-10">
        <span
          className={cn(
            coverBadgeClass,
            "flex items-center gap-1.5 text-[11px]",
          )}
        >
          <Zap className="size-3 text-[#0066FF]" />
          {cert.totalSpEarned} SP
        </span>
      </div>
    </CourseThumbnail>

    <div className="flex flex-1 flex-col p-6">
      <div className="flex-1">
        <h3 className="text-ink mb-2 line-clamp-2 text-[18px] font-semibold tracking-tight">
          {cert.courseName}
        </h3>
        <p className="text-ink-muted mb-4 text-[14px] leading-relaxed">
          {t.awardedTo}{" "}
          <span className="text-ink font-semibold">{cert.userName}</span>
        </p>
      </div>

      <div className="border-hairline text-ink-soft mt-auto flex items-center justify-between border-t-2 pt-5 text-[13px] font-semibold">
        <span className="flex items-center gap-1.5">
          <Calendar className="size-3.5" />
          {new Date(cert.completedAt).toLocaleDateString(locale, {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
        {/* The serial is what a certificate is checked against, so it is set in
            tabular figures and never wraps. */}
        <span className="text-ink-faint text-[12px] tabular-nums">
          {t.version} {cert.versionNumber} · №&nbsp;{serial(cert.id)}
        </span>
      </div>
    </div>
  </article>
);

export default function CertificateList({ orgSlug }: { orgSlug: string }) {
  const { data: certificates } = api.learning.listCertificates.useQuery({
    orgSlug,
  });
  const { translations } = useTranslation("learn");
  const t = translations.certificates;
  const params = useParams<{ lang: string }>();
  const locale = params.lang || "en";

  if (!certificates) return null;

  if (certificates.length === 0) {
    return (
      <div className="border-hairline flex flex-col items-center justify-center gap-4 rounded-[20px] border-2 border-dashed bg-white/60 py-20 text-center dark:border-neutral-800 dark:bg-neutral-900/50">
        <span
          className={cn(
            "flex size-14 rotate-6 items-center justify-center rounded-[16px] border border-black/[0.06]",
            coverToneFor("certificates").tile,
          )}
        >
          <Award className="size-7" strokeWidth={2.2} />
        </span>
        <div>
          <h3 className="text-ink text-[15px] font-semibold dark:text-neutral-100">
            {t.noCertificates}
          </h3>
          <p className="text-ink-muted mt-1 text-[13px]">
            {t.completeCourseToEarn}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {certificates.map((cert) => (
        <CertificateCard key={cert.id} cert={cert} t={t} locale={locale} />
      ))}
    </div>
  );
}
