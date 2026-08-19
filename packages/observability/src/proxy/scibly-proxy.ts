import type { NextRequest } from "next/server";

import { baseProxy } from "@scibly/next-proxy";
import { pathnameMatchesRoute } from "@scibly/next-proxy/pathname";
import { NextResponse } from "next/server";

import {
  getPostHogConfigFromEnv,
  INGEST_PATH,
  loadObservabilityEnv,
} from "../config/env";
import { proxyPostHogRequest } from "./posthog-proxy";

type BaseProxyFn = (
  request: NextRequest,
) => NextResponse | Promise<NextResponse>;

export function createSciblyProxy(baseProxyFn: BaseProxyFn) {
  return async (request: NextRequest) => {
    const env = loadObservabilityEnv();

    if (!env.NEXT_PUBLIC_POSTHOG_ENABLED) {
      if (pathnameMatchesRoute(request.nextUrl.pathname, INGEST_PATH)) {
        return new NextResponse(null, { status: 204 });
      }

      return baseProxyFn(request);
    }

    const config = getPostHogConfigFromEnv(env);
    const proxied = proxyPostHogRequest(request, config.apiHost);
    if (proxied) {
      return proxied;
    }

    if (pathnameMatchesRoute(request.nextUrl.pathname, INGEST_PATH)) {
      return new NextResponse(null, { status: 404 });
    }

    return baseProxyFn(request);
  };
}

export function createAppProxy() {
  return createSciblyProxy(baseProxy());
}
