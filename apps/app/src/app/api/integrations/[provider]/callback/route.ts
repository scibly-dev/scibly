import type { NextRequest } from "next/server";

import { handleIntegrationConnectCallback } from "@/features/integrations/server";

export function GET(
  request: NextRequest,
  context: { params: Promise<{ provider: string }> },
) {
  return handleIntegrationConnectCallback(request, context);
}
