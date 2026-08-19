const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 30;
const buckets = new Map<string, { count: number; resetAt: number }>();

export function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = buckets.get(ip);

  if (!entry || now >= entry.resetAt) {
    buckets.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  return ++entry.count > MAX_PER_WINDOW;
}

export function purgeExpired() {
  const now = Date.now();
  for (const [ip, { resetAt }] of buckets) {
    if (now >= resetAt) buckets.delete(ip);
  }
}
