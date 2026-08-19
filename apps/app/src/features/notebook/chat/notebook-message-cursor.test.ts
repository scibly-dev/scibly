import { describe, expect, it } from "vitest";

import { sortNotebookMessageTimeline } from "@/shared/ai/chat/message-order";

import {
  chronologicallyAfter,
  chronologicallyBefore,
  type NotebookMessageCursor,
} from "./notebook-message-cursor";

type Row = NotebookMessageCursor;

const AT = (minute: number) =>
  new Date(`2026-01-01T00:${String(minute).padStart(2, "0")}:00Z`);

type CursorWhere = ReturnType<
  typeof chronologicallyAfter | typeof chronologicallyBefore
>;
type CursorClause = CursorWhere["OR"][number];

function matches(row: Row, where: CursorWhere | CursorClause): boolean {
  if ("OR" in where) {
    return where.OR.some((clause) => matches(row, clause));
  }
  return Object.entries(where).every(([field, expected]) => {
    const actual = row[field as keyof Row];
    if (expected instanceof Date) {
      return (actual as Date).getTime() === expected.getTime();
    }
    if (expected && typeof expected === "object") {
      const { lt, gt } = expected as { lt?: Date | string; gt?: Date | string };
      if (lt !== undefined) return compare(actual, lt) < 0;
      if (gt !== undefined) return compare(actual, gt) > 0;
    }
    return actual === expected;
  });
}

function compare(a: unknown, b: unknown): number {
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  return String(a).localeCompare(String(b));
}

// Same instant, both roles, ids in both orders: everything the tie-break decides.
const ROWS: Row[] = [
  { createdAt: AT(0), role: "USER", id: "b" },
  { createdAt: AT(1), role: "USER", id: "z" },
  { createdAt: AT(1), role: "USER", id: "a" },
  { createdAt: AT(1), role: "ASSISTANT", id: "m" },
  { createdAt: AT(2), role: "ASSISTANT", id: "c" },
];

describe("asking the database for one side of a message", () => {
  const timeline = sortNotebookMessageTimeline(ROWS);

  it.each(timeline.map((row, index) => [row.id, index] as const))(
    "everything after %s is exactly what the timeline puts after it",
    (_id, index) => {
      const cursor = timeline[index]!;
      const selected = timeline.filter((row) =>
        matches(row, chronologicallyAfter(cursor)),
      );

      expect(selected).toEqual(timeline.slice(index + 1));
    },
  );

  it("never claims the cursor itself, in either direction", () => {
    for (const cursor of timeline) {
      expect(matches(cursor, chronologicallyAfter(cursor))).toBe(false);
      expect(matches(cursor, chronologicallyBefore(cursor))).toBe(false);
    }
  });
});
