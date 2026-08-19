// Enough to hide per-source latency without spending the isolate's whole
// database connection budget in one batch.
export const INGEST_CONCURRENCY = 4;

// Results land in the input's order regardless of completion order, so a
// caller can still pair each one with what it asked for.
export async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  run: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  let cursor = 0;

  async function consume(): Promise<void> {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await run(items[index]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, consume),
  );

  return results;
}
