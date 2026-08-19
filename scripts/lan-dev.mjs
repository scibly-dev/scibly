import os from "node:os";

/** First non-internal IPv4 — typical Wi‑Fi address for phone testing on the same network. */
function getLanIPv4() {
  try {
    for (const interfaces of Object.values(os.networkInterfaces())) {
      if (!interfaces) continue;
      for (const iface of interfaces) {
        if (iface.family === "IPv4" && !iface.internal) {
          return iface.address;
        }
      }
    }
  } catch {
    return undefined;
  }
  return undefined;
}

/** Hostnames Next.js should accept for cross-origin dev asset requests (phone → laptop). */
export function getAllowedDevOrigins() {
  const origins = new Set(["127.0.0.1", "localhost"]);
  const ip = getLanIPv4();
  if (ip) origins.add(ip);
  return [...origins];
}
