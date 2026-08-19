export type Row = { key: string; label: string; credits: number };

const BAR_TONES = [
  "bg-[#0066FF]",
  "bg-emerald-500",
  "bg-orange-500",
  "bg-purple-500",
  "bg-amber-500",
];

export const SpendRows = ({
  rows,
  creditsLabel,
  n,
}: {
  rows: Row[];
  creditsLabel: string;
  n: (value: number) => string;
}) => {
  const largest = rows.reduce((max, row) => Math.max(max, row.credits), 0);

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="text-ink-soft flex items-center justify-between text-[12px] font-semibold tracking-wide uppercase">
        <span aria-hidden />
        <span>{creditsLabel}</span>
      </div>
      {rows.map((row, index) => (
        <div key={row.key} className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-4">
            <span className="text-ink truncate text-[14px] font-medium">
              {row.label}
            </span>
            <span className="text-ink shrink-0 text-[14px] font-semibold tabular-nums">
              {n(row.credits)}
            </span>
          </div>
          <div className="border-hairline bg-ground h-3 w-full overflow-hidden rounded-full border-2">
            <div
              className={`h-full rounded-full transition-[width] ${BAR_TONES[index % BAR_TONES.length]}`}
              style={{
                width: `${largest > 0 ? (row.credits / largest) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};
