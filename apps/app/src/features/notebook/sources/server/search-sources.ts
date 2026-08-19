import { db } from "@scibly/db";

import {
  INGESTING_STATUSES,
  SOURCE_STATUS,
} from "@/shared/content/sources/constants";

import { toSourcePassage } from "./source-passage";

export interface SourceMatch {
  content: string;
  sourceId: string;
  sourceName: string;

  offset: number | null;

  sourceWarning: string | null;
}

export type SearchOutcome =
  | { status: "MATCHED"; matches: SourceMatch[] }
  | { status: "NOT_INDEXED"; ingestingSources: number }
  | { status: "BELOW_RELEVANCE_FLOOR" };

export const SEARCH_DEFAULT_TOP_K = 5;
export const SEARCH_MAX_TOP_K = 10;

export function toGroundingPassage(match: SourceMatch): string {
  return toSourcePassage(
    "source-passage",
    { sourceId: match.sourceId },
    match.content,
  );
}

const HIT_OPEN = "⟦";
const HIT_CLOSE = "⟧";
const FRAGMENT_DELIMITER = "⟨⟩";

const HEADLINE_OPTIONS = `MaxFragments=3, MaxWords=50, MinWords=15, StartSel=${HIT_OPEN}, StopSel=${HIT_CLOSE}, FragmentDelimiter=${FRAGMENT_DELIMITER}`;

interface HeadlineRow {
  id: string;
  name: string;
  warning: string | null;
  fragments: string;
}

/**
 * `'simple'` avoids a language-specific stemmer, since sources may be in any
 * language. `notebookId` is trusted as already authorized by the caller.
 */
export async function searchNotebookSources(
  notebookId: string,
  query: string,
  topK: number = SEARCH_DEFAULT_TOP_K,
): Promise<SearchOutcome> {
  const rows = await db.$queryRaw<HeadlineRow[]>`
    WITH q AS (SELECT websearch_to_tsquery('simple', ${query}) AS tsq),
    matches AS (
      SELECT s.id, ts_rank(to_tsvector('simple', s.content), q.tsq) AS rank
        FROM notebook_source s, q
       WHERE s."notebookId" = ${notebookId}
         AND s.status::text = ${SOURCE_STATUS.READY}
         AND s.content IS NOT NULL
         AND to_tsvector('simple', s.content) @@ q.tsq
       ORDER BY rank DESC
       LIMIT ${topK}
    )
    SELECT s.id, s.name, s.warning,
           ts_headline('simple', s.content, q.tsq, ${HEADLINE_OPTIONS}) AS fragments
      FROM matches m JOIN notebook_source s ON s.id = m.id, q
     ORDER BY m.rank DESC
  `;

  const found = rows.flatMap((row) =>
    toFragments(row.fragments).map((content) => ({
      content,
      sourceId: row.id,
      sourceName: row.name,
      sourceWarning: row.warning,
    })),
  );

  if (found.length === 0) return classifyEmptySearch(notebookId);

  const offsets = await locateFragments(found);

  return {
    status: "MATCHED",
    matches: found.map((match, i) => ({
      ...match,
      offset: offsets[i] ?? null,
    })),
  };
}

async function classifyEmptySearch(notebookId: string): Promise<SearchOutcome> {
  const searchable = await db.notebookSource.findFirst({
    where: { notebookId, status: SOURCE_STATUS.READY, content: { not: null } },
    select: { id: true },
  });

  if (searchable) return { status: "BELOW_RELEVANCE_FLOOR" };

  return {
    status: "NOT_INDEXED",
    ingestingSources: await countIngestingSources(notebookId),
  };
}

function toFragments(headline: string): string[] {
  return headline
    .split(FRAGMENT_DELIMITER)
    .map((fragment) =>
      fragment.split(HIT_OPEN).join("").split(HIT_CLOSE).join(""),
    )
    .map((fragment) => fragment.trim())
    .filter(Boolean);
}

async function locateFragments(
  fragments: { sourceId: string; content: string }[],
): Promise<(number | null)[]> {
  const rows = await db.$queryRaw<{ ord: bigint; position: number }[]>`
    SELECT f.ord, strpos(s.content, f.value) AS position
      FROM unnest(${fragments.map((f) => f.sourceId)}::text[],
                  ${fragments.map((f) => f.content)}::text[])
             WITH ORDINALITY AS f(source_id, value, ord)
      JOIN notebook_source s ON s.id = f.source_id
  `;

  const positions = new Map(rows.map((row) => [Number(row.ord), row.position]));

  return fragments.map((_, i) => {
    const position = positions.get(i + 1) ?? 0;
    return position > 0 ? position - 1 : null;
  });
}

async function countIngestingSources(notebookId: string): Promise<number> {
  return db.notebookSource.count({
    where: {
      notebookId,
      status: { in: [...INGESTING_STATUSES] },
    },
  });
}

export const READ_SOURCE_MAX_CHARS = 50_000;

export type ReadSourceResult =
  | { status: "NOT_FOUND" }
  | { status: "EMPTY" }
  | { status: "READ"; passage: string };

/**
 * Sliced in Postgres so large documents don't cross the wire whole.
 * `notebookId` is part of the WHERE clause, not a check afterwards, so a
 * source in another notebook reads as absent rather than forbidden.
 */
export async function readNotebookSource(
  notebookId: string,
  sourceId: string,
  offset: number,
): Promise<ReadSourceResult> {
  const [row] = await db.$queryRaw<
    { slice: string | null; total: number; status: string }[]
  >`
    SELECT substring(content FROM ${offset + 1}::int FOR ${READ_SOURCE_MAX_CHARS}::int) AS slice,
           length(content) AS total,
           status::text AS status
      FROM notebook_source
     WHERE id = ${sourceId} AND "notebookId" = ${notebookId}
  `;

  if (!row) return { status: "NOT_FOUND" };

  if (row.status !== SOURCE_STATUS.READY || row.slice === null) {
    return { status: "EMPTY" };
  }

  const end = offset + [...row.slice].length;
  const more =
    end < row.total
      ? ` Call readSource again with offset=${end} for the rest.`
      : " That is the end of the source.";

  return {
    status: "READ",
    passage:
      `Chars ${offset}–${end} of ${row.total}.${more}\n\n` +
      toSourcePassage("source", { sourceId, offset }, row.slice),
  };
}
