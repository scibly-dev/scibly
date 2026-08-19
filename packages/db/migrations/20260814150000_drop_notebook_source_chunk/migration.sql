-- The embedding pipeline is gone: sources are quoted into the prompt whole, or
-- reached through their digest and a keyword search over `notebook_source`.
-- Nothing reads a chunk or its vector any more, so the table goes with it.
--
-- The EMBEDDING value of "OrgAIModelType" stays: dropping an enum value would
-- need the whole type rewritten, and any rows still carrying it are inert —
-- nothing loads a model by that type.
-- DropTable
DROP TABLE IF EXISTS "notebook_source_chunk";
