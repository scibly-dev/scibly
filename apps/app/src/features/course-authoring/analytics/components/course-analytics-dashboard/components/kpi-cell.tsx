import { cn } from "@scibly/ui/utils";

import { type DashboardTab } from "../types";

// Fixed color per tab, shared between the KPI dot and the active-cell highlight.
export const KPI_TONES = {
  learners: {
    active:
      "border-blue-300 bg-blue-50 shadow-[0_3px_0_0_var(--color-blue-200)]",
    dot: "bg-blue-500",
  },
  completed: {
    active:
      "border-emerald-300 bg-emerald-50 shadow-[0_3px_0_0_var(--color-emerald-200)]",
    dot: "bg-emerald-500",
  },
  score: {
    active:
      "border-purple-300 bg-purple-50 shadow-[0_3px_0_0_var(--color-purple-200)]",
    dot: "bg-purple-500",
  },
  performance: {
    active:
      "border-amber-300 bg-amber-50 shadow-[0_3px_0_0_var(--color-amber-200)]",
    dot: "bg-amber-400",
  },
} satisfies Record<DashboardTab, { active: string; dot: string }>;

interface KpiCellProps {
  label: string;
  value: string | number;
  subtitle?: string;
  tab: DashboardTab;
  isActive: boolean;
}

export function KpiCell({
  label,
  value,
  subtitle,
  tab,
  isActive,
}: KpiCellProps) {
  const tone = KPI_TONES[tab];
  return (
    <div
      className={cn(
        "flex h-full w-full flex-col gap-1 rounded-2xl border-2 px-5 py-4 select-none group-active:shadow-none",
        isActive
          ? tone.active
          : "border-hairline hover:border-edge bg-white shadow-[0_3px_0_0_var(--color-lip)]",
      )}
    >
      <div className="mt-0.5 flex items-center gap-1.5">
        <span
          className={cn("size-2 rounded-full ring-2 ring-white", tone.dot)}
        />
        <span className="text-ink-soft text-[12px] font-semibold">{label}</span>
      </div>
      <span className="text-ink text-2xl font-semibold tracking-tight">
        {value}
      </span>
      {subtitle && (
        <span className="text-ink-soft text-[11px] font-normal">
          {subtitle}
        </span>
      )}
    </div>
  );
}
