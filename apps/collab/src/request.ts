import type { onRequestPayload } from "@hocuspocus/server";

import { config } from "./config.js";

export function clientIp(request: onRequestPayload["request"]): string {
  if (config.trustProxy) {
    const header = request.headers["x-forwarded-for"];
    const forwarded = (Array.isArray(header) ? header[0] : header)
      ?.split(",")[0]
      ?.trim();
    if (forwarded) return forwarded;
  }
  return request.socket.remoteAddress || "unknown";
}
