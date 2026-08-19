import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export class UnsafeOutboundUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnsafeOutboundUrlError";
  }
}

type OutboundUrlPolicy = "strict" | "byoai";

export const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "localhost.localdomain",
  "metadata.google.internal",
]);

const PRIVATE_OR_INTERNAL_MESSAGE = "Private or internal URLs are not allowed.";
const BLOCKED_IPV4_FIRST_OCTETS = new Set([0, 10, 127]);

function allowByoaiPrivateHosts(): boolean {
  return process.env.NODE_ENV === "development";
}

function isWithin(
  value: number | undefined,
  min: number,
  max: number,
): boolean {
  return value !== undefined && value >= min && value <= max;
}

function isBlockedIpv4(octets: readonly number[]): boolean {
  const [a, b] = octets;

  if (a === undefined || b === undefined) return true;
  if (BLOCKED_IPV4_FIRST_OCTETS.has(a)) return true;
  if (a === 172 && isWithin(b, 16, 31)) return true;
  if (a === 192 && b === 168) return true;
  if (a === 169 && b === 254) return true;
  if (a === 100 && isWithin(b, 64, 127)) return true;

  return false;
}

function toHextets(address: string): number[] | null {
  let text = address;
  const embeddedIpv4: number[] = [];

  const dotted = /(\d{1,3}(?:\.\d{1,3}){3})$/.exec(text);
  if (dotted) {
    const literal = dotted[1] ?? "";
    if (isIP(literal) !== 4) return null;
    const [a = 0, b = 0, c = 0, d = 0] = literal.split(".").map(Number);
    embeddedIpv4.push((a << 8) | b, (c << 8) | d);
    text = text.slice(0, text.length - literal.length);
    if (text.endsWith(":") && !text.endsWith("::")) text = text.slice(0, -1);
  }

  const [head = "", tail, ...rest] = text.split("::");
  if (rest.length > 0) return null;

  const leading = head ? head.split(":") : [];
  const trailing = tail ? tail.split(":") : [];
  const groups = [...leading, ...trailing];
  if (groups.some((group) => !/^[0-9a-f]{1,4}$/.test(group))) return null;

  const written = groups.length + embeddedIpv4.length;
  if (written > 8) return null;

  const zeroes = tail === undefined ? 0 : 8 - written;
  if (zeroes < 0 || written + zeroes !== 8) return null;

  return [
    ...leading.map((group) => parseInt(group, 16)),
    ...Array<number>(zeroes).fill(0),
    ...trailing.map((group) => parseInt(group, 16)),
    ...embeddedIpv4,
  ];
}

function isBlockedIpv6(address: string): boolean {
  const hextets = toHextets(address);

  if (!hextets) return true;

  const [h0 = 0, h1 = 0, h2 = 0, h3 = 0, h4 = 0, h5 = 0, h6 = 0, h7 = 0] =
    hextets;

  if (h0 === 0 && h1 === 0 && h2 === 0 && h3 === 0 && h4 === 0 && h5 === 0) {
    if (h6 === 0 && (h7 === 0 || h7 === 1)) return true;

    return isBlockedIpv4([h6 >> 8, h6 & 0xff, h7 >> 8, h7 & 0xff]);
  }

  if (
    h0 === 0 &&
    h1 === 0 &&
    h2 === 0 &&
    h3 === 0 &&
    h4 === 0 &&
    h5 === 0xffff
  ) {
    return isBlockedIpv4([h6 >> 8, h6 & 0xff, h7 >> 8, h7 & 0xff]);
  }

  if ((h0 & 0xffc0) === 0xfe80) return true;
  if ((h0 & 0xfe00) === 0xfc00) return true;

  return false;
}

function normalizeHostname(hostname: string): string {
  return hostname.toLowerCase().replace(/\.+$/, "");
}

function assertSafeHostname(hostname: string): void {
  const normalized = normalizeHostname(hostname);

  if (!normalized) {
    throw new UnsafeOutboundUrlError("Invalid URL.");
  }

  if (normalized.startsWith("[") && normalized.endsWith("]")) {
    if (isBlockedIpv6(normalized.slice(1, -1))) {
      throw new UnsafeOutboundUrlError(PRIVATE_OR_INTERNAL_MESSAGE);
    }
    return;
  }

  if (BLOCKED_HOSTNAMES.has(normalized)) {
    throw new UnsafeOutboundUrlError(PRIVATE_OR_INTERNAL_MESSAGE);
  }

  if (
    normalized.endsWith(".localhost") ||
    normalized.endsWith(".local") ||
    normalized.endsWith(".internal")
  ) {
    throw new UnsafeOutboundUrlError(PRIVATE_OR_INTERNAL_MESSAGE);
  }

  if (/^\d+$/.test(normalized)) {
    throw new UnsafeOutboundUrlError(PRIVATE_OR_INTERNAL_MESSAGE);
  }

  const ipVersion = isIP(normalized);
  if (ipVersion === 4) {
    const octets = normalized.split(".").map(Number);
    if (isBlockedIpv4(octets)) {
      throw new UnsafeOutboundUrlError(PRIVATE_OR_INTERNAL_MESSAGE);
    }
    return;
  }

  if (ipVersion === 6 && isBlockedIpv6(normalized)) {
    throw new UnsafeOutboundUrlError(PRIVATE_OR_INTERNAL_MESSAGE);
  }
}

export function assertSafeOutboundUrl(
  url: string,
  policy: OutboundUrlPolicy = "strict",
): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new UnsafeOutboundUrlError("Invalid URL.");
  }

  const protocol = parsed.protocol.toLowerCase();
  if (protocol !== "http:" && protocol !== "https:") {
    throw new UnsafeOutboundUrlError("Only HTTP and HTTPS URLs are allowed.");
  }

  if (policy === "byoai" && allowByoaiPrivateHosts()) {
    return;
  }

  assertSafeHostname(parsed.hostname);
}

export async function assertSafeResolvedOutboundUrl(
  url: string,
  policy: OutboundUrlPolicy = "strict",
): Promise<void> {
  assertSafeOutboundUrl(url, policy);

  if (policy === "byoai" && allowByoaiPrivateHosts()) return;

  const hostname = normalizeHostname(new URL(url).hostname);

  if (isIP(hostname) !== 0 || hostname.startsWith("[")) return;

  let addresses: { address: string; family: number }[];
  try {
    addresses = await lookup(hostname, { all: true, verbatim: true });
  } catch {
    throw new UnsafeOutboundUrlError("Could not resolve the host.");
  }

  if (addresses.length === 0) {
    throw new UnsafeOutboundUrlError("Could not resolve the host.");
  }

  for (const { address, family } of addresses) {
    const blocked =
      family === 4
        ? isBlockedIpv4(address.split(".").map(Number))
        : isBlockedIpv6(address);
    if (blocked) {
      throw new UnsafeOutboundUrlError(PRIVATE_OR_INTERNAL_MESSAGE);
    }
  }
}

export function assertSafeByoaiOutboundUrl(url: string): Promise<void> {
  return assertSafeResolvedOutboundUrl(url, "byoai");
}
