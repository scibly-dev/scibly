import { after, NextResponse } from "next/server";
import { z } from "zod";

import {
  acquireSyncLease,
  continueSyncLease,
  runSyncHop,
  type SyncLease,
} from "@/features/integrations/server";
import { refuseUnauthorizedCron } from "@/shared/api/cron/cron-route-guard";

export const maxDuration = 300;

const ROUTE_NAME = "sync-integrations";

// `POST` self-chains because a large tenant's sync can outrun one serverless invocation;
// progress is tracked as a durable watermark per connection, not in this process's memory.

// Responds before running the step, so the caller's fetch resolves immediately instead of
// waiting out the whole chain.
function startHop(lease: SyncLease): NextResponse {
  after(async () => {
    await runSyncHop(lease);
  });
  return NextResponse.json({ ok: true, started: true });
}

const chainKick = z.object({ token: z.string() });

async function readChainToken(request: Request): Promise<string | undefined> {
  try {
    return chainKick.safeParse(await request.json()).data?.token;
  } catch {
    return undefined;
  }
}

// The response is public before auth is checked, so failures stay generic —
// no provider, connection, or organization details.
function failed(error: unknown): NextResponse {
  console.error(`[Cron] ${ROUTE_NAME} failed:`, error);
  return NextResponse.json({ error: "Sync failed" }, { status: 500 });
}

export async function GET(request: Request) {
  const refusal = refuseUnauthorizedCron(request, ROUTE_NAME);
  if (refusal) return refusal;

  try {
    const lease = await acquireSyncLease();

    if (!lease) return NextResponse.json({ ok: true, joined: true });
    return startHop(lease);
  } catch (error) {
    return failed(error);
  }
}

export async function POST(request: Request) {
  const refusal = refuseUnauthorizedCron(request, ROUTE_NAME);
  if (refusal) return refusal;

  try {
    const token = await readChainToken(request);
    const lease = token
      ? await continueSyncLease(token)
      : await acquireSyncLease();

    if (!lease) return NextResponse.json({ ok: true, joined: true });
    return startHop(lease);
  } catch (error) {
    return failed(error);
  }
}
