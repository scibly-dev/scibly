import { type Prisma, type Scene } from "@scibly/db";
import { SceneVibe } from "@scibly/db/enums";
import { encodeHtmlBytes } from "@scibly/lib";

import { DEFAULT_SCENE_SP } from "@/shared/content/learning/scene-sp";

const DEFAULT_INTRODUCTION_SCENE_TITLE = "Introduction";

const EMPTY_SCENE_HTML = "<div><p></p></div>";

type SceneTransactionClient = Pick<Prisma.TransactionClient, "scene">;

export async function ensureDefaultIntroductionScene(
  tx: SceneTransactionClient,
  lessonId: string,
): Promise<Scene | null> {
  const existingScene = await tx.scene.findFirst({
    where: { lessonId, courseVersionId: null },
    orderBy: { order: "asc" },
  });

  if (existingScene) return null;

  return tx.scene.create({
    data: {
      lessonId,
      order: 0,
      title: DEFAULT_INTRODUCTION_SCENE_TITLE,
      vibe: SceneVibe.NEUTRAL,
      sp: DEFAULT_SCENE_SP,
      documentState: Buffer.from(encodeHtmlBytes(EMPTY_SCENE_HTML)),
    },
  });
}
