-- Drop scene type column and enum; all scenes are interactive canvas.
ALTER TABLE "scene" DROP COLUMN "type";

DROP TYPE "SceneType";
