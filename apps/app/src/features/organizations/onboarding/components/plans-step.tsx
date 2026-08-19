"use client";

import type { OrgBillingPage } from "@scibly/ee-organizations-billing/i18n/org-billing.types";
import type { OnboardingPage } from "../i18n/onboarding.types";

import { PlanGrid } from "@scibly/ee-organizations-billing/components/plan-grid";
import { autocaptureAttributes } from "@scibly/observability/autocapture";
import { routes } from "@scibly/routes";
import { Button } from "@scibly/ui/components/button";
import { cardClass } from "@scibly/ui/design-language";
import { cn } from "@scibly/ui/utils";
import { Gift } from "lucide-react";
import { useRouter } from "next/navigation";

import { api } from "@/shared/api/trpc/client";

import { useWorkspaceStore } from "../../navigation/workspace-store";

/** Where the perforation runs — the stub is exactly this wide. */
const SEAM_X = 128;
/** How thick the ticket is: the drop of its extruded side face. */
const THICKNESS = 10;

// Masking (not painting) lets the backdrop show through the bites, and applying the same cut to both faces keeps them reading as one solid.
const bite = (x: string, y: string, r: number) =>
  `radial-gradient(circle ${r}px at ${x} ${y}, transparent ${r - 0.5}px, #000 ${r}px)`;

const PUNCHED = {
  maskImage: [
    bite(`${SEAM_X}px`, "0%", 9),
    bite(`${SEAM_X}px`, "100%", 9),
    bite("0%", "50%", 12),
    bite("100%", "50%", 12),
  ].join(","),
  maskComposite: "intersect",
  WebkitMaskComposite: "source-in",
} as const;

/** Polka-dot gift wrap over the two brand colours the stub is folded from. */
const WRAPPING_PAPER = {
  backgroundImage: [
    "radial-gradient(circle 2.5px at 10px 10px, rgba(255,255,255,0.22) 99%, transparent 100%)",
    "linear-gradient(135deg, #0066FF 0%, #6C3BFF 100%)",
  ].join(","),
  backgroundSize: "22px 22px, cover",
} as const;

/** Confetti on the white half, drawn from the same blue-to-violet run. */
const CONFETTI = [
  { className: "top-3 left-8 size-1.5 bg-[#7ab4ff]" },
  { className: "top-5 right-7 size-1 bg-[#6C3BFF]" },
  { className: "right-11 bottom-3 size-2 bg-[#c4b3ff]" },
  { className: "bottom-6 left-12 size-1 bg-[#0066FF]" },
] as const;

/** The trial balance as a torn-off voucher: something handed over, not announced. */
function CreditsVoucher({
  credits,
  lang,
  t,
}: {
  credits: number | null;
  lang: string;
  t: OnboardingPage["plans"]["credits"];
}) {
  return (
    // The float animation lives on its own layer, separate from this entrance animation, so the two don't fight over the transform property.
    <div className="animate-in fade-in zoom-in-95 slide-in-from-bottom-3 relative -rotate-2 duration-500 ease-out hover:-rotate-1 motion-safe:transition-[rotate] motion-safe:duration-300">
      <div className="animate-float relative">
        <div
          className="pointer-events-none absolute -inset-10"
          style={{
            backgroundImage: [
              "radial-gradient(closest-side at 22% 60%, rgba(0,102,255,0.20), transparent)",
              "radial-gradient(closest-side at 60% 45%, rgba(108,59,255,0.18), transparent)",
              "radial-gradient(closest-side at 88% 55%, rgba(184,166,255,0.22), transparent)",
            ].join(","),
          }}
        />

        {/* What the ticket casts, and the side face it stands on: the two halves
          are extruded in their own colour so the solid reads as one object. */}
        <div
          aria-hidden
          className="bg-ink/25 absolute inset-x-5 bottom-0 h-6 translate-y-4 rounded-full blur-lg"
        />
        <div
          aria-hidden
          className="absolute inset-0 rounded-[22px]"
          style={{
            ...PUNCHED,
            transform: `translateY(${THICKNESS}px)`,
            background: `linear-gradient(to right, #0040a3 0, #45189f ${SEAM_X}px, #c4d2e6 ${SEAM_X}px)`,
          }}
        />

        <div
          className={cn(
            cardClass,
            "relative flex items-stretch rounded-[22px] shadow-none",
          )}
          style={PUNCHED}
        >
          <div
            className="relative flex shrink-0 flex-col items-center justify-center overflow-hidden rounded-l-[20px] py-5 text-white shadow-[inset_0_3px_0_rgba(255,255,255,0.28),inset_0_-3px_0_rgba(0,0,0,0.12)]"
            style={{ width: SEAM_X - 2, ...WRAPPING_PAPER }}
          >
            {credits === null ? (
              <span className="relative text-[12px] font-bold">{t.unit}</span>
            ) : (
              <>
                <span className="relative text-[34px] leading-none font-bold tracking-[-0.04em] tabular-nums drop-shadow-[0_2px_0_rgba(0,0,0,0.18)]">
                  {credits.toLocaleString(lang)}
                </span>
                <span className="relative text-[9.5px] font-bold tracking-[0.1em] text-white/75 uppercase">
                  {t.unit}
                </span>
              </>
            )}
          </div>

          {/* The seam is the ribbon: it runs between the two punches and is tied
            off where the halves meet. */}
          <div
            className="absolute inset-y-0 w-3 -translate-x-1/2 border-x-2 border-[#c4b3ff]"
            style={{
              left: SEAM_X - 1,
              backgroundImage:
                "repeating-linear-gradient(45deg, #e4dcff 0 6px, #f4f0ff 6px 12px)",
            }}
          />
          <span
            className="absolute top-1/2 grid size-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-[3px] border-white bg-[#6C3BFF] text-white shadow-[0_3px_0_0_#45189f,inset_0_2px_0_rgba(255,255,255,0.35)]"
            style={{ left: SEAM_X - 1 }}
          >
            <Gift className="size-4" strokeWidth={2.6} />
          </span>

          <div className="relative flex flex-col justify-center gap-1 py-5 pr-7 pl-8">
            {CONFETTI.map(({ className }) => (
              <span
                key={className}
                className={cn(
                  "pointer-events-none absolute rounded-full opacity-70",
                  className,
                )}
              />
            ))}
            <p className="w-fit rounded-full bg-[#efeaff] px-2 py-0.5 text-[9.5px] font-bold tracking-[0.12em] text-[#4b2bc4] uppercase">
              {t.eyebrow}
            </p>
            <p className="text-[14px] font-bold">
              {credits === null ? t.pending : t.headline}
            </p>
            <p className="text-ink-muted text-[12px]">{t.note}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PlansStep({
  orgId,
  orgSlug,
  lang,
  credits,
  t,
  planCopy,
}: {
  orgId: string;
  orgSlug: string;
  lang: string;
  credits: number | null;
  t: OnboardingPage;
  planCopy: OrgBillingPage["plan"];
}) {
  const router = useRouter();
  const selectOrganization = useWorkspaceStore((s) => s.selectOrganization);
  const dashboard = routes.app.profile.org(orgSlug).dashboard;
  const complete = api.organization.completeOnboarding.useMutation();

  const goToDashboard = () => {
    selectOrganization(orgId, orgSlug, "owner");
    router.push(dashboard);
  };

  return (
    <div className="flex w-full flex-col items-center gap-8">
      <CreditsVoucher credits={credits} lang={lang} t={t.plans.credits} />

      <PlanGrid
        orgId={orgId}
        lang={lang}
        t={planCopy}
        returnUrl={dashboard}
        beforeCheckout={async () => {
          await complete.mutateAsync();
        }}
      />

      <Button
        variant="outline"
        disabled={complete.isPending}
        onClick={() =>
          complete.mutate(undefined, {
            onSettled: goToDashboard,
          })
        }
        {...autocaptureAttributes({ action: "onboarding_plans_skip" })}
      >
        {t.plans.continue}
      </Button>
    </div>
  );
}
