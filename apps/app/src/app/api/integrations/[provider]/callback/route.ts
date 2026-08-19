import type { NextRequest } from "next/server";

import { handleIntegrationOAuthCallback } from "@/features/integrations/server";

export function GET(
  request: NextRequest,
  context: { params: Promise<{ provider: string }> },
) {
  return handleIntegrationOAuthCallback(request, context);
}
