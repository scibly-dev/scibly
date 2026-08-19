"use client";

import { cn } from "@scibly/ui/utils";
import { ArrowRight } from "lucide-react";
import { memo } from "react";

const KEY_CAP_CLASS =
  "inline-flex min-h-[22px] items-center justify-center rounded-md border border-neutral-300/90 bg-white px-2 font-mono text-[11px] font-semibold tracking-wide text-neutral-700 shadow-[0_1px_0_0_rgba(0,0,0,0.1),inset_0_0_0_1px_rgba(255,255,255,0.65)] dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:shadow-[0_1px_0_0_rgba(0,0,0,0.45)]";

function keyCap({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <kbd className={cn(KEY_CAP_CLASS, className)}>{children}</kbd>;
}

function blankPreview({ label }: { label: string }) {
  return (
    <span className="inline-flex min-h-[22px] min-w-[3.25rem] items-center justify-center rounded-md border border-dashed border-blue-500/45 bg-blue-50/70 px-2 text-[11px] font-semibold text-blue-700 dark:border-blue-500/35 dark:bg-blue-950/35 dark:text-blue-300">
      {label}
    </span>
  );
}

function guideFlow({
  tabKeyLabel,
  selectLabel,
  blankLabel,
  showSelectStep,
}: {
  tabKeyLabel: string;
  selectLabel: string;
  blankLabel: string;
  showSelectStep: boolean;
}) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      {showSelectStep ? (
        <>
          <span className="text-[12px] font-medium text-neutral-600 dark:text-neutral-300">
            {selectLabel}
          </span>
          <ArrowRight
            aria-hidden
            className="h-3 w-3 shrink-0 text-neutral-300 dark:text-neutral-600"
          />
        </>
      ) : null}
      {keyCap({ children: tabKeyLabel })}
      <ArrowRight
        aria-hidden
        className="h-3 w-3 shrink-0 text-neutral-300 dark:text-neutral-600"
      />
      {blankPreview({ label: blankLabel })}
    </span>
  );
}

type ClozeTabGuideProps = {
  tabKeyLabel: string;
  selectLabel: string;
  orLabel: string;
  blankLabel: string;
  className?: string;
};

export const ClozeTabGuide = memo((props: ClozeTabGuideProps) => {
  const { tabKeyLabel, selectLabel, orLabel, blankLabel, className } = props;

  return (
    <div
      className={cn(
        "inline-flex flex-wrap items-center gap-x-2.5 gap-y-2 rounded-xl border border-neutral-200/70 bg-linear-to-b from-neutral-50 to-neutral-100/80 px-3 py-2 dark:border-neutral-700/70 dark:from-neutral-900/80 dark:to-neutral-950/80",
        className,
      )}
    >
      {guideFlow({
        tabKeyLabel,
        selectLabel,
        blankLabel,
        showSelectStep: true,
      })}
      <span className="text-[11px] font-semibold tracking-wide text-neutral-400 uppercase dark:text-neutral-500">
        {orLabel}
      </span>
      {guideFlow({
        tabKeyLabel,
        selectLabel,
        blankLabel,
        showSelectStep: false,
      })}
    </div>
  );
});
ClozeTabGuide.displayName = "ClozeTabGuide";
