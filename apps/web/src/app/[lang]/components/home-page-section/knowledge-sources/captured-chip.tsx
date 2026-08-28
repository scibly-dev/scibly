import { Check } from "lucide-react";

import { type Pillar } from "@/app/[lang]/components/marketing-tokens";

export function CapturedChip({ tone, label }: { tone: Pillar; label: string }) {
  return (
    <span
      className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-[5px] px-1.5 py-0.5 text-[9.5px] font-bold tracking-wide uppercase"
      style={{ backgroundColor: tone.softColor, color: tone.accentColor }}
    >
      <Check size={9} strokeWidth={3.5} />
      {label}
    </span>
  );
}
