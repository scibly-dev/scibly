import React from "react";

interface MiniStatCardProps {
  label: string;
  value: string | number;
  description: string;
}

export function MiniStatCard({ label, value, description }: MiniStatCardProps) {
  return (
    <div className="border-edge bg-ground-soft flex flex-col gap-1 rounded-xl border-2 p-3 shadow-[0_2px_0_0_var(--color-lip)]">
      <span className="text-ink-soft text-[10px] font-semibold tracking-wider uppercase">
        {label}
      </span>
      <span className="text-ink text-[15px] font-bold tabular-nums">
        {value}
      </span>
      <span className="text-ink-soft/80 text-[10px] leading-none">
        {description}
      </span>
    </div>
  );
}
