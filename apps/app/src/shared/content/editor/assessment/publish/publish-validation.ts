import { questionBlockParserRegistry } from "@/shared/content/editor/assessment/parsing/parser-registry";
import { isBlankHtmlState } from "@/shared/content/editor/documents/author-document";
import {
  extractQuestionBlockSnapshotsFromTipTap,
  normalizeAuthorTipTapContent,
} from "@/shared/content/editor/documents/tiptap-document";
import { checkPracticeScene } from "@/shared/content/practice/check-practice-scene";

type PublishableLesson = Readonly<{
  title: string;
  scenes: readonly Readonly<{
    title?: string | null;
    kind?: "DOCUMENT" | "PRACTICE";
    documentState?: Buffer | Uint8Array | null;
    practiceHtml?: string | null;
    practiceSolution?: unknown;
    isOutdated?: boolean;
  }>[];
}>;

type UnfinishableQuestion = Readonly<{
  sceneTitle: string;

  position: number;
  blockType: string;
  reason: string;
}>;

export type PublishValidationFailure = Readonly<{
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
  /** The message is English; the client re-renders it from `code` + these. */
  params?: Readonly<Record<string, string | number>>;

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
    params: { count: zeroed.length, questions: zeroedListed },
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
        params: { scene: sceneTitle },
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
    params: { count: unfinishable.length, questions: unfinishableListed },
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
    params: { count: duplicated.length, questions: duplicatedListed },
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
      params: { lesson: emptyLesson.title },
    };
  }

  const emptyScene = lessons
    .flatMap((lesson) => lesson.scenes)
    .find((scene) =>
      scene.kind === "PRACTICE"
        ? !scene.practiceHtml?.trim()
        : !scene.documentState || isBlankHtmlState(scene.documentState),
    );
  if (emptyScene) {
    return {
      code: "EMPTY_SCENE",
      message: `Scene "${sceneName(emptyScene.title)}" has no content. Add content to all canvas scenes before publishing.`,
      params: { scene: sceneName(emptyScene.title) },
    };
  }

  // Not behind `force`: a broken course, not a stale one.
  const broken = lessons
    .flatMap((lesson) => lesson.scenes)
    .flatMap((scene) => {
      if (scene.kind !== "PRACTICE") return [];
      const problems = checkPracticeScene(scene);
      return problems.length > 0
        ? [`"${sceneName(scene.title)}" — ${problems.join("; ")}`]
        : [];
    });
  if (broken.length > 0) {
    const brokenListed = broken.join(", ");
    return {
      code: "UNVALIDATED_PRACTICE",
      message: `Cannot publish: ${broken.length} practice scene(s) are not finished — ${brokenListed}.`,
      params: { count: broken.length, scenes: brokenListed },
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
        params: { count: outdatedCount },
      };
    }
  }

  return null;
}
