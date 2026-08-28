import { cn } from "@scibly/ui/utils";

export function MockGroundFade({
  ground,
  className,
}: {
  ground: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "pointer-events-none absolute inset-x-0 bottom-0",
        className,
      )}
      style={{
        background: `linear-gradient(to bottom, transparent, ${ground})`,
      }}
    />
  );
}
