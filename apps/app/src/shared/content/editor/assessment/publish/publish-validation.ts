import { questionBlockParserRegistry } from "@/shared/content/editor/assessment/parsing/parser-registry";
import {
  extractQuestionBlockSnapshotsFromTipTap,
  normalizeAuthorTipTapContent,
} from "@/shared/content/editor/documents/tiptap-document";
import { practiceContentHash } from "@/shared/content/practice/practice-content-hash";

type PublishableLesson = Readonly<{
  title: string;
  scenes: readonly Readonly<{
    title?: string | null;
    kind?: "DOCUMENT" | "PRACTICE";
    documentState?: Buffer | Uint8Array | null;
    practiceHtml?: string | null;
    practiceSolution?: unknown;
    practiceValidated?: string | null;
    isOutdated?: boolean;
  }>[];
}>;

type UnfinishableQuestion = Readonly<{
  sceneTitle: string;

  position: number;
  blockType: string;
  reason: string;
}>;

type PublishValidationFailure = Readonly<{
  code:
    | "NO_LESSONS"
    | "NO_SCENES"
    | "EMPTY_LESSON"
    | "EMPTY_SCENE"
    | "UNREADABLE_SCENE"
    | "UNANSWERABLE_QUESTIONS"
    | "ZERO_VALUE_QUESTIONS"
    | "DUPLICATE_BLOCK_ID"
    | "UNVALIDATED_PRACTICE"
    | "OUTDATED_SCENES";
  message: string;

  questions?: readonly UnfinishableQuestion[];
}>;

function sceneName(title?: string | null): string {
  return title?.trim() || "Untitled";
}

function validateQuestionValues(
  lessons: readonly PublishableLesson[],
): PublishValidationFailure | null {
  const zeroed: UnfinishableQuestion[] = [];

  for (const scene of lessons.flatMap((lesson) => lesson.scenes)) {
    const sceneTitle = sceneName(scene.title);
    let questions;
    try {
      questions = extractQuestionBlockSnapshotsFromTipTap(
        normalizeAuthorTipTapContent(scene.documentState ?? null),
      );
    } catch {
      continue;
    }

    questions.forEach((question, index) => {
      const { maxPoints, sp } = question.attributes;
      if (maxPoints === 0) {
        zeroed.push({
          sceneTitle,
          position: index + 1,
          blockType: question.blockType,
          reason: "worth zero points",
        });
        return;
      }
      if (sp === 0) {
        zeroed.push({
          sceneTitle,
          position: index + 1,
          blockType: question.blockType,
          reason: "awards zero SP",
        });
      }
    });
  }

  if (zeroed.length === 0) return null;
  const zeroedListed = zeroed
    .map(
      (question) =>
        `"${question.sceneTitle}" question ${question.position} (${question.reason})`,
    )
    .join(", ");
  return {
    code: "ZERO_VALUE_QUESTIONS",
    message: `Cannot publish: ${zeroed.length} question(s) are worth nothing — ${zeroedListed}. Give them a value above zero, or remove the field to use the default.`,
    questions: zeroed,
  };
}

function validateAnswerKeys(
  lessons: readonly PublishableLesson[],
): PublishValidationFailure | null {
  const unfinishable: UnfinishableQuestion[] = [];

  for (const scene of lessons.flatMap((lesson) => lesson.scenes)) {
    const sceneTitle = sceneName(scene.title);
    let questions;
    try {
      questions = extractQuestionBlockSnapshotsFromTipTap(
        normalizeAuthorTipTapContent(scene.documentState ?? null),
      );
    } catch {
      return {
        code: "UNREADABLE_SCENE",
        message: `Scene "${sceneTitle}" cannot be read, so it cannot be published. Open the scene and re-save it, then publish again.`,
      };
    }

    questions.forEach((question, index) => {
      const reason = questionBlockParserRegistry.describeMissingSolution(
        question.blockType,
        question.attributes.questionData,
      );
      if (reason === null) return;
      unfinishable.push({
        sceneTitle,
        position: index + 1,
        blockType: question.blockType,
        reason,
      });
    });
  }

  if (unfinishable.length === 0) return null;
  const unfinishableListed = unfinishable
    .map(
      (question) =>
        `"${question.sceneTitle}" question ${question.position} (${question.reason})`,
    )
    .join(", ");
  return {
    code: "UNANSWERABLE_QUESTIONS",
    message: `Cannot publish: ${unfinishable.length} question(s) have no complete answer key — ${unfinishableListed}.`,
    questions: unfinishable,
  };
}

function validateUniqueBlockIds(
  lessons: readonly PublishableLesson[],
): PublishValidationFailure | null {
  const duplicated: UnfinishableQuestion[] = [];

  for (const scene of lessons.flatMap((lesson) => lesson.scenes)) {
    const sceneTitle = sceneName(scene.title);
    let questions;
    try {
      questions = extractQuestionBlockSnapshotsFromTipTap(
        normalizeAuthorTipTapContent(scene.documentState ?? null),
      );
    } catch {
      continue;
    }

    const seen = new Set<string>();
    questions.forEach((question, index) => {
      if (seen.has(question.blockId)) {
        duplicated.push({
          sceneTitle,
          position: index + 1,
          blockType: question.blockType,
          reason: `duplicates blockId "${question.blockId}"`,
        });
        return;
      }
      seen.add(question.blockId);
    });
  }

  if (duplicated.length === 0) return null;
  const duplicatedListed = duplicated
    .map(
      (question) =>
        `"${question.sceneTitle}" question ${question.position} (${question.reason})`,
    )
    .join(", ");
  return {
    code: "DUPLICATE_BLOCK_ID",
    message: `Cannot publish: ${duplicated.length} question(s) share a blockId with another question in the same scene — ${duplicatedListed}.`,
    questions: duplicated,
  };
}

export function validatePublishableContent(
  lessons: readonly PublishableLesson[],
  options: { force?: boolean },
): PublishValidationFailure | null {
  if (lessons.length === 0) {
    return {
      code: "NO_LESSONS",
      message: "Cannot publish a course with no lessons.",
    };
  }

  if (!lessons.some((lesson) => lesson.scenes.length > 0)) {
    return {
      code: "NO_SCENES",
      message: "Cannot publish a course where no lesson has any scenes.",
    };
  }

  const emptyLesson = lessons.find((lesson) => lesson.scenes.length === 0);
  if (emptyLesson) {
    return {
      code: "EMPTY_LESSON",
      message: `Lesson "${emptyLesson.title}" has no scenes. Add at least one scene before publishing.`,
    };
  }

  const emptyScene = lessons
    .flatMap((lesson) => lesson.scenes)
    .find((scene) =>
      scene.kind === "PRACTICE"
        ? !scene.practiceHtml?.trim()
        : !scene.documentState,
    );
  if (emptyScene) {
    return {
      code: "EMPTY_SCENE",
      message: `Scene "${sceneName(emptyScene.title)}" has no content. Add content to all canvas scenes before publishing.`,
    };
  }

  // Not behind `force`: a broken course, not a stale one.
  const unvalidatedScene = lessons
    .flatMap((lesson) => lesson.scenes)
    .find(
      (scene) =>
        scene.kind === "PRACTICE" &&
        scene.practiceValidated !==
          practiceContentHash(scene.practiceHtml, scene.practiceSolution),
    );
  if (unvalidatedScene) {
    return {
      code: "UNVALIDATED_PRACTICE",
      message: `Practice scene "${sceneName(unvalidatedScene.title)}" has not passed its self-test since it was last edited. Open the scene and press Validate before publishing.`,
    };
  }

  const duplicateBlockIdFailure = validateUniqueBlockIds(lessons);
  if (duplicateBlockIdFailure) return duplicateBlockIdFailure;

  const answerKeyFailure = validateAnswerKeys(lessons);
  if (answerKeyFailure) return answerKeyFailure;

  const zeroValueFailure = validateQuestionValues(lessons);
  if (zeroValueFailure) return zeroValueFailure;

  if (!options.force) {
    const outdatedCount = lessons
      .flatMap((lesson) => lesson.scenes)
      .filter((scene) => scene.isOutdated).length;
    if (outdatedCount > 0) {
      return {
        code: "OUTDATED_SCENES",
        message: `Cannot publish: ${outdatedCount} scene(s) cite changed sources. Review these scenes, or publish anyway to proceed as-is.`,
      };
    }
  }

  return null;
}
