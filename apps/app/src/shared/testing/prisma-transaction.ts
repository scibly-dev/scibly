import type { Mock } from "vitest";

// Honours both Prisma `$transaction` forms — the interactive callback and the
// batch array — because a test that handles only one silently returns
// `undefined` the day its subject switches to the other.
export function transactionsRun(db: { $transaction: Mock }, tx: unknown = db) {
  db.$transaction.mockImplementation(async (arg: unknown) =>
    typeof arg === "function"
      ? (arg as (client: unknown) => unknown)(tx)
      : Promise.all(arg as Promise<unknown>[]),
  );
}
