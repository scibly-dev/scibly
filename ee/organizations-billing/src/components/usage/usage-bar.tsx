import { cn } from "@scibly/ui/utils";

export const TOPUP_TONE = "bg-emerald-500";

export const UsageBar = ({
  allowanceUsed,
  topupUsed,
  allowanceRemaining,
  topupRemaining,
  tone,
}: {
  allowanceUsed: number;
  topupUsed: number;
  allowanceRemaining: number;
  topupRemaining: number;
  tone: string;
}) => {
  const segments = [
    { key: "allowance-used", value: allowanceUsed, tone },
    { key: "topup-used", value: topupUsed, tone: "bg-emerald-500/50" },
    {
      key: "allowance-left",
      value: allowanceRemaining,
      tone: "bg-transparent",
    },
    { key: "topup-left", value: topupRemaining, tone: TOPUP_TONE },
  ];
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);

  return (
    <div className="border-hairline bg-ground flex h-3.5 w-full overflow-hidden rounded-full border-2">
      {segments.map((segment) => (
        <div
          key={segment.key}
          className={cn("h-full transition-[width]", segment.tone)}
          style={{
            width: `${total > 0 ? (segment.value / total) * 100 : 0}%`,

            minWidth: segment.value > 0 ? "0.375rem" : undefined,
          }}
        />
      ))}
    </div>
  );
};
