import { timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { env } from "@/env";

// KD4: shared guard for every cron route (they trigger org-wide polling and
// re-ingestion), so a fix applies everywhere instead of drifting per-copy.

export function isValidCronSecret(
  authHeader: string | null,
  secret: string,
): boolean {
  if (!authHeader) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(authHeader);

  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}

export function refuseUnauthorizedCron(
  request: Request,
  routeName: string,
): NextResponse | null {
  const cronSecret = env.CRON_SECRET;
  if (!cronSecret) {
    console.error(`[Cron] ${routeName}: CRON_SECRET is not configured`);
    return NextResponse.json(
      { error: "CRON_SECRET is not configured" },
      { status: 500 },
    );
  }
  if (!isValidCronSecret(request.headers.get("authorization"), cronSecret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
