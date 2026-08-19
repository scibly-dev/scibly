import { z } from "zod";

export function hasApplicationCode(
  error: { data?: { applicationCode?: string | null } | null } | null,
  applicationCode: string,
): boolean {
  return error?.data?.applicationCode === applicationCode;
}

const errorShortfall = z.object({
  details: z.object({ shortfall: z.number().finite() }),
});

export function readErrorShortfall(
  error: { data?: unknown } | null,
): number | null {
  const parsed = errorShortfall.safeParse(error?.data);
  return parsed.success ? parsed.data.details.shortfall : null;
}
