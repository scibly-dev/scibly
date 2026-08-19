export const formatDurationMs = (durationMs: number): string => {
  if (durationMs <= 0) return "-";

  const days = Math.floor(durationMs / (1000 * 60 * 60 * 24));
  if (days > 0) return `${days} day${days > 1 ? "s" : ""}`;

  const hours = Math.floor(durationMs / (1000 * 60 * 60));
  if (hours > 0) return `${hours} hr${hours > 1 ? "s" : ""}`;

  const mins = Math.max(1, Math.floor(durationMs / (1000 * 60)));
  return `${mins} min${mins > 1 ? "s" : ""}`;
};
