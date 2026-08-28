import { serve } from "inngest/next";
import { connection, type NextRequest } from "next/server";

import { inngest } from "@/lib/inngest/client";
import { inngestFunctions } from "@/lib/inngest/functions";

export const maxDuration = 300;

const handler = serve({ client: inngest, functions: inngestFunctions });

// Under `cacheComponents` a `GET` handler is prerendered unless it reaches for
// request-time data, and this one's answer depends on the request's headers.
export async function GET(request: NextRequest, context: unknown) {
  await connection();
  return handler.GET(request, context);
}

export const { POST, PUT } = handler;
