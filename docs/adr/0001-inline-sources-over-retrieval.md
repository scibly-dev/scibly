# Inline the sources, don't retrieve them

The notebook agent is handed its sources whole: every source quoted in full when
they fit the turn's context window, and digests plus keyword search over them
when they don't. Retrieval came first and was removed — `notebook_source_chunk`
carried a pgvector column behind an HNSW cosine index, and was dropped in August
2026 with nothing put in its place.

## Why

An author's notebook is their own small pile of documents, not a corpus. At that
size the whole thing fits, and a model that has read everything designs better
than one handed the top-k chunks: it can see where two sources disagree, which
is most of the work. Chunking also failed hardest on the material that matters
most — a boundary drawn through a procedure or a table produces a confident
wrong answer with a high similarity score.

## Consequences

- How much source material a notebook can hold is bounded by the context window,
  not by disk. The sources-per-notebook plan limit is the real cap, and tiering
  exists to degrade gracefully at it rather than to scale past it.
- Search is Postgres full-text, not similarity. It serves Tier 2, where the text
  is no longer in the prompt — it is not a retrieval layer wearing a new name.
- One leftover stays deliberately: `OrganizationAIModelType.EMBEDDING`. Nothing
  reads the enum, so the value is unreachable rather than merely unused, and
  Postgres has no `DROP VALUE` — removing it rewrites the type and fails on any
  organization still holding an embedding model row. Not worth a migration.
  (`packages/db/scripts/setup-pgvector.ts`, which indexed the dropped table, was
  deleted.)
