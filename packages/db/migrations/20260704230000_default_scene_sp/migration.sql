-- Default new scenes to 5 Scibly Points. Existing rows keep their stored value (including explicit 0).
ALTER TABLE "scene" ALTER COLUMN "sp" SET DEFAULT 5;
