import {
  eyebrowClass,
  subtitleClass,
  titleClass,
} from "@scibly/ui/design-language";
import { SciblyMark } from "@scibly/ui/marketing/logo";

import { BrandBackdrop } from "@/shared/ui/brand-backdrop";

export function OnboardingShell({
  eyebrow,
  title,
  titleAccent,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  titleAccent: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-ground font-display text-ink relative flex min-h-screen w-full justify-center overflow-y-auto px-4 py-12">
      <BrandBackdrop />
      <div className="relative z-10 flex w-full max-w-4xl flex-col items-center gap-8">
        <SciblyMark className="size-14 rounded-[16px] shadow-[0_4px_0_0_var(--color-lip)]" />
        <header className="flex flex-col items-center gap-3 text-center">
          <p className={eyebrowClass}>{eyebrow}</p>
          {/* The word the sentence turns on carries the serif accent, as on the
              marketing pages. */}
          <h1 className={titleClass}>
            {title}
            <span className="font-serif-accent font-normal tracking-[-0.01em] italic">
              {titleAccent}
            </span>
          </h1>
          <p className={subtitleClass}>{subtitle}</p>
        </header>
        {children}
      </div>
    </div>
  );
}
