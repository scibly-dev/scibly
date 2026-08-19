// Split from the raw grouped query in get-traffic-sources.ts so this bucketing math can be
// tested without a database.

export interface TrafficSourceRow {
  source: "DIRECT" | "EMBED" | null;

  origin: string | null;
  sessions: number;
  completions: number;

  scoredCompletions: number;

  scoreTotal: number;
}

export type TrafficSourceKind =
  | "origin"
  | "embed-hidden"
  | "direct"
  | "untracked";

export interface TrafficSource {
  key: string;
  kind: TrafficSourceKind;

  origin: string | null;
  sessions: number;
  completions: number;

  completionRate: number;

  averageScore: number | null;
}

interface TrafficSourceBucket {
  key: string;
  kind: TrafficSourceKind;
  origin: string | null;
}

function bucketFor(row: TrafficSourceRow): TrafficSourceBucket {
  if (row.source === "EMBED") {
    return row.origin
      ? { key: `origin:${row.origin}`, kind: "origin", origin: row.origin }
      : { key: "embed-hidden", kind: "embed-hidden", origin: null };
  }
  if (row.source === "DIRECT") {
    return { key: "direct", kind: "direct", origin: null };
  }
  return { key: "untracked", kind: "untracked", origin: null };
}

export function buildTrafficSources(rows: TrafficSourceRow[]): TrafficSource[] {
  const totals = new Map<
    string,
    {
      kind: TrafficSourceKind;
      origin: string | null;
      sessions: number;
      completions: number;
      scoredCompletions: number;
      scoreTotal: number;
    }
  >();

  for (const row of rows) {
    const bucket = bucketFor(row);
    const running = totals.get(bucket.key) ?? {
      kind: bucket.kind,
      origin: bucket.origin,
      sessions: 0,
      completions: 0,
      scoredCompletions: 0,
      scoreTotal: 0,
    };
    running.sessions += row.sessions;
    running.completions += row.completions;
    running.scoredCompletions += row.scoredCompletions;
    running.scoreTotal += row.scoreTotal;
    totals.set(bucket.key, running);
  }

  return [...totals.entries()]
    .map(([key, total]) => ({
      key,
      kind: total.kind,
      origin: total.origin,
      sessions: total.sessions,
      completions: total.completions,
      completionRate:
        total.sessions > 0
          ? Math.round((total.completions / total.sessions) * 100)
          : 0,
      averageScore:
        total.scoredCompletions > 0
          ? Math.round(total.scoreTotal / total.scoredCompletions)
          : null,
    }))
    .sort((a, b) => b.sessions - a.sessions || a.key.localeCompare(b.key));
}
