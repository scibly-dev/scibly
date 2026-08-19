-- PIPE-5: embeddings are fixed at 1536 dimensions for every provider
-- (OpenAI and BYOAI alike). The per-model "dimensions" override is no
-- longer configurable — BYOAI now always requests dimensions: 1536 and
-- validates the response at model save/activation time (probe call).
ALTER TABLE "organization_ai_model" DROP COLUMN IF EXISTS "dimensions";
