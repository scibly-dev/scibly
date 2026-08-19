import { describe, expect, it } from "vitest";

import { buildTrafficSources, type TrafficSourceRow } from "./traffic-sources";

function row(overrides: Partial<TrafficSourceRow> = {}): TrafficSourceRow {
  return {
    source: "EMBED",
    origin: "https://acme.example",
    sessions: 10,
    completions: 5,
    scoredCompletions: 5,
    scoreTotal: 400,
    ...overrides,
  };
}

describe("buildTrafficSources", () => {
  it("TS1: an embedded group with an origin is reported under that origin", () => {
    const [source] = buildTrafficSources([
      row({ origin: "https://acme.example" }),
    ]);

    expect(source).toMatchObject({
      kind: "origin",
      origin: "https://acme.example",
      sessions: 10,
      completions: 5,
    });
  });

  it("TS2: an embedded group without an origin is not folded into direct traffic", () => {
    const sources = buildTrafficSources([
      row({ source: "EMBED", origin: null, sessions: 4 }),
      row({ source: "DIRECT", origin: null, sessions: 4 }),
    ]);

    expect(sources).toHaveLength(2);
    expect(sources.map((source) => source.kind).sort()).toEqual([
      "direct",
      "embed-hidden",
    ]);
  });

  it("TS3: a direct group is reported as direct-link traffic", () => {
    const [source] = buildTrafficSources([
      row({ source: "DIRECT", origin: null }),
    ]);

    expect(source).toMatchObject({ kind: "direct", origin: null });
  });

  it("TS4: sessions recorded before tracking are reported as pre-tracking", () => {
    const sources = buildTrafficSources([
      row({ source: null, origin: null, sessions: 7 }),
      row({ source: "DIRECT", origin: null, sessions: 7 }),
    ]);

    expect(sources).toHaveLength(2);
    expect(sources.some((source) => source.kind === "untracked")).toBe(true);
  });

  it("TS5: groups are ordered by session volume", () => {
    const sources = buildTrafficSources([
      row({ origin: "https://small.example", sessions: 2 }),
      row({ origin: "https://large.example", sessions: 90 }),
      row({ origin: "https://medium.example", sessions: 30 }),
    ]);

    expect(sources.map((source) => source.origin)).toEqual([
      "https://large.example",
      "https://medium.example",
      "https://small.example",
    ]);
  });

  it("TS6: groups with equal volume keep a stable order", () => {
    const input: TrafficSourceRow[] = [
      row({ origin: "https://b.example", sessions: 5 }),
      row({ origin: "https://a.example", sessions: 5 }),
    ];

    const first = buildTrafficSources(input).map((source) => source.key);
    const second = buildTrafficSources([...input].reverse()).map(
      (source) => source.key,
    );

    expect(first).toEqual(second);
  });

  it("TS7: rows in the same group are summed with a weighted average score", () => {
    const [source] = buildTrafficSources([
      row({
        sessions: 1,
        completions: 1,
        scoredCompletions: 1,
        scoreTotal: 100,
      }),
      row({
        sessions: 3,
        completions: 3,
        scoredCompletions: 3,
        scoreTotal: 60,
      }),
    ]);

    expect(source).toMatchObject({ sessions: 4, completions: 4 });
    expect(source!.averageScore).toBe(40);
  });

  it("TS8: completion rate is completions over sessions", () => {
    const [source] = buildTrafficSources([
      row({ sessions: 8, completions: 2, scoredCompletions: 0, scoreTotal: 0 }),
    ]);

    expect(source!.completionRate).toBe(25);
  });

  it("TS9: a group with no sessions reports a zero completion rate", () => {
    const [source] = buildTrafficSources([
      row({ sessions: 0, completions: 0, scoredCompletions: 0, scoreTotal: 0 }),
    ]);

    expect(source!.completionRate).toBe(0);
  });

  it("TS10: a group with no scored completions reports no average score", () => {
    const [source] = buildTrafficSources([
      row({ sessions: 5, completions: 3, scoredCompletions: 0, scoreTotal: 0 }),
    ]);

    expect(source!.averageScore).toBeNull();
  });

  it("TS11: no rows yields no groups", () => {
    expect(buildTrafficSources([])).toEqual([]);
  });
});
