type MessageTimelineRow = {
  createdAt: Date;
  role: string;
  id: string;
};

function compareNotebookMessageTimeline(
  a: MessageTimelineRow,
  b: MessageTimelineRow,
): number {
  const timeDelta = a.createdAt.getTime() - b.createdAt.getTime();
  if (timeDelta !== 0) return timeDelta;

  const roleRank = (role: string) => {
    const normalized = role.toLowerCase();
    if (normalized === "user") return 0;
    if (normalized === "assistant") return 1;
    return 2;
  };

  const roleDelta = roleRank(a.role) - roleRank(b.role);
  if (roleDelta !== 0) return roleDelta;

  return a.id.localeCompare(b.id);
}

export function sortNotebookMessageTimeline<T extends MessageTimelineRow>(
  rows: T[],
): T[] {
  return rows.toSorted(compareNotebookMessageTimeline);
}

export const NOTEBOOK_MESSAGE_NEWEST_FIRST_ORDER = [
  { createdAt: "desc" as const },
  { role: "asc" as const },
  { id: "asc" as const },
];
