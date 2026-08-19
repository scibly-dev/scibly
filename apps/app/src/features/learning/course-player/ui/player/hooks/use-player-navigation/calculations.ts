import type { PendingSceneSubmission } from "../../lesson-player/progression/lesson-progression.model";
import type {
  PlayerLesson,
  PlayerProgress,
  PlayerViewState,
} from "../../utils/player-types";
import type { LocalProgressDelta } from "./navigation-session";
import type { DbProgress, NormalizedCourse, RawMemberCourse } from "./types";

import {
  computeScorePct,
  hasAttemptsRemaining,
} from "../../../../../progression/progression-rules";
import { getNextLesson } from "../../utils/player-helpers";

export function deriveAchievedScorePct(
  viewState: PlayerViewState,
  totalSP: number,
  courseMaxSP: number,
) {
  if (
    viewState.type === "course_complete" &&
    viewState.finalScorePct !== undefined
  ) {
    return viewState.finalScorePct;
  }
  return computeScorePct(totalSP, courseMaxSP);
}

// Once the one lesson in a LESSON-mode course is finished, stop redirecting
// into it — "overview" is where the completion flow passes through.
export function resolvePlayerViewState(
  course: NormalizedCourse | undefined,
  viewState: PlayerViewState,
  completedLessonIds: string[],
): PlayerViewState {
  if (course?.mode !== "LESSON" || viewState.type !== "overview") {
    return viewState;
  }
  const onlyLesson = course.lessons[0];
  if (!onlyLesson || completedLessonIds.includes(onlyLesson.id)) {
    return viewState;
  }
  return { type: "lesson", lessonId: onlyLesson.id };
}

export function derivePlayerProgress(
  dbProgress: DbProgress | undefined | null,
  localProgressDelta: LocalProgressDelta,
): PlayerProgress {
  return {
    completedLessonIds: dbProgress
      ? dbProgress.completedLessonIds
      : localProgressDelta.completedLessonIds,
    completedSceneIds: dbProgress?.completedSceneIds ?? [],
    totalSP: dbProgress?.totalSP ?? 0,
  };
}

export function derivePendingSubmissions(
  dbProgress: DbProgress | undefined | null,
) {
  const submissions: Record<string, PendingSceneSubmission> = {};
  if (!dbProgress?.sceneAnalytics) return submissions;
  for (const sa of dbProgress.sceneAnalytics) {
    const blocksArray = sa.gradedBlocks;
    const blocks = blocksArray.map((b) => ({
      blockId: b.blockId,
      blockType: b.blockType,
      learnerAnswer: b.learnerAnswer,
    }));
    const gradedBlocks = blocksArray.map((b) => ({
      blockId: b.blockId,
      achievedPoints: b.achievedPoints,
      maxPoints: b.maxPoints,
      spEarned: b.spEarned,
      correctAnswer: b.correctAnswer,
    }));

    submissions[sa.sceneId] = {
      sceneId: sa.sceneId,
      blocks,
      gradedBlocks: dbProgress.completedSceneIds.includes(sa.sceneId)
        ? gradedBlocks
        : undefined,
    };
  }
  return submissions;
}

export function deriveLessonAttemptSp(
  lesson: PlayerLesson | undefined,
  dbProgress: DbProgress | undefined | null,
): number {
  if (!lesson || !dbProgress?.sceneAnalytics) return 0;
  const lessonSceneIds = new Set(lesson.scenes.map((scene) => scene.id));
  const spByScene = new Map<string, number>();

  for (const analytics of dbProgress.sceneAnalytics) {
    if (!lessonSceneIds.has(analytics.sceneId)) continue;
    spByScene.set(
      analytics.sceneId,
      Math.max(spByScene.get(analytics.sceneId) ?? 0, analytics.spEarned),
    );
  }

  return [...spByScene.values()].reduce((total, sp) => total + sp, 0);
}

interface CourseState {
  hasPassed: boolean;
  triesCount: number;
  status: string | undefined;
  isLocked: boolean;
  hasCertificate: boolean;
}

function preferDatabaseValue<T>(value: T | null | undefined, fallback: T): T {
  return value !== undefined && value !== null ? value : fallback;
}

export function deriveCourseState(
  isAnonymous: boolean,
  dbProgress: DbProgress | undefined | null,
  memberCourse: RawMemberCourse | undefined | null,
  maxTries: number | null,
): CourseState {
  const member = memberCourse || {
    hasCertificate: false,
    triesCount: 0,
    status: undefined,
  };
  const stored: Partial<DbProgress> = dbProgress || {};
  const memberPassed = isAnonymous ? false : Boolean(member.hasCertificate);
  const memberTries = isAnonymous ? 0 : member.triesCount || 0;
  const memberStatus = isAnonymous ? undefined : member.status;
  const hasPassed = preferDatabaseValue(stored.hasPassed, memberPassed);
  const triesCount = preferDatabaseValue(stored.triesCount, memberTries);
  const status = preferDatabaseValue(stored.status, memberStatus);
  const hasCertificate = isAnonymous ? false : Boolean(member.hasCertificate);
  const isLocked = hasPassed
    ? false
    : !hasAttemptsRemaining(triesCount, maxTries);

  return {
    hasPassed,
    triesCount,
    status,
    isLocked,
    hasCertificate,
  };
}

interface BuildNavigationViewModelInput {
  course: NormalizedCourse | undefined;
  dbProgress: DbProgress | undefined | null;
  memberCourse: RawMemberCourse | undefined | null;
  localProgressDelta: LocalProgressDelta;
  viewState: PlayerViewState;
  isAnonymous: boolean;
}

interface NavigationViewModel {
  progress: PlayerProgress;
  initialPendingSubmissions: Record<string, PendingSceneSubmission>;
  courseMaxSP: number;
  currentLesson: PlayerLesson | undefined;
  initialLessonSP: number;
  lessonMaxSp: number;
  nextLessonTitle: string | undefined;
  courseState: CourseState;
}

export function buildNavigationViewModel(
  input: BuildNavigationViewModelInput,
): NavigationViewModel {
  const {
    course,
    dbProgress,
    memberCourse,
    localProgressDelta,
    viewState,
    isAnonymous,
  } = input;
  const progress = derivePlayerProgress(dbProgress, localProgressDelta);
  const initialPendingSubmissions = derivePendingSubmissions(dbProgress);
  const courseMaxSP = course?.maxSp ?? 0;
  const currentLesson =
    course && (viewState.type === "lesson" || viewState.type === "complete")
      ? course.lessons.find((lesson) => lesson.id === viewState.lessonId)
      : undefined;
  const lessonMaxSp = currentLesson?.maxSp ?? 0;
  const initialLessonSP = deriveLessonAttemptSp(currentLesson, dbProgress);
  const nextLessonTitle =
    course && viewState.type === "complete"
      ? getNextLesson(course.lessons, viewState.lessonId, progress)?.title
      : undefined;
  const courseState = deriveCourseState(
    isAnonymous,
    dbProgress,
    memberCourse,
    course?.maxTries ?? null,
  );
  return {
    progress,
    initialPendingSubmissions,
    courseMaxSP,
    currentLesson,
    initialLessonSP,
    lessonMaxSp,
    nextLessonTitle,
    courseState,
  };
}
