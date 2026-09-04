import { db, Prisma } from "@scibly/db";

import { broadcastCourseSync } from "@/features/course-authoring/collaboration/server/broadcast-course-sync";
import { getEffectiveSceneSp } from "@/shared/content/learning/scene-sp";
import {
  gradePracticeSubmission,
  isFieldCorrect,
  type PracticeGradingManifest,
} from "@/shared/content/practice/grade-practice-submission";
import { practiceContentHash } from "@/shared/content/practice/practice-content-hash";

import { requireDraftSceneContentAccess } from "./scene-access";

/** Kept out of `requireDraftSceneContentAccess` so the autosave path skips them. */
function readPracticeColumns(sceneId: string) {
  return db.scene.findUniqueOrThrow({
    where: { id: sceneId },
    select: {
      practiceHtml: true,
      practiceSolution: true,
      practiceExplain: true,
      practiceValidated: true,
    },
  });
}

export async function getPractice(userId: string, sceneId: string) {
  await requireDraftSceneContentAccess(sceneId, userId);
  const scene = await readPracticeColumns(sceneId);
  return {
    sceneId,
    html: scene.practiceHtml ?? "",
    // SAFETY: this is exactly the JSON shape `writePractice` wrote.
    solution: scene.practiceSolution as PracticeGradingManifest["solution"],
    explanation: scene.practiceExplain,
    validated:
      scene.practiceValidated ===
      practiceContentHash(scene.practiceHtml, scene.practiceSolution),
  };
}

export async function writePractice(
  user: { id: string; name: string; username?: string | null },
  input: {
    sceneId: string;
    html: string;
    solution: PracticeGradingManifest["solution"];
    explanation: string | null;
  },
) {
  const scene = await requireDraftSceneContentAccess(input.sceneId, user.id);
  const updated = await db.scene.update({
    where: { id: input.sceneId },
    select: { id: true },
    data: {
      practiceHtml: input.html,
      // SAFETY: `input.solution` is plain JSON (validated by `writePracticeSchema`).
      practiceSolution: (input.solution ?? Prisma.JsonNull) as
        | Prisma.NullableJsonNullValueInput
        | Prisma.InputJsonValue,
      practiceExplain: input.explanation,
    },
  });
  // A plain column, not a Y.Doc: open builders only learn of an agent's write from here.
  broadcastCourseSync(user, scene.lesson.courseId, {
    type: "invalidate_practice",
    sceneId: updated.id,
  });
  return { sceneId: updated.id, success: true as const };
}

export async function validatePractice(
  userId: string,
  input: { sceneId: string; work: unknown; selfTest: boolean },
) {
  const scene = await requireDraftSceneContentAccess(input.sceneId, userId);
  const practice = await readPracticeColumns(input.sceneId);
  const manifest: PracticeGradingManifest = {
    // SAFETY: this is exactly the JSON shape `writePractice` wrote.
    solution: practice.practiceSolution as PracticeGradingManifest["solution"],
    explain: practice.practiceExplain,
  };
  const { gradedFields, totalSpEarned, explanation } = gradePracticeSubmission(
    input.work,
    manifest,
    getEffectiveSceneSp(scene.sp),
  );

  // An open-ended practice grades no fields, so reaching this line is its whole test.
  const validated =
    input.selfTest && gradedFields.every((field) => isFieldCorrect(field));
  if (validated) {
    await db.scene.update({
      where: { id: input.sceneId },
      select: { id: true },
      data: {
        practiceValidated: practiceContentHash(
          practice.practiceHtml,
          practice.practiceSolution,
        ),
      },
    });
  }
  return { gradedFields, totalSpEarned, explanation, validated };
}
