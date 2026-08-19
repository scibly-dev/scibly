import type { CourseUnavailableReason } from "../hooks/use-player-navigation/course-availability";
import type { NormalizedCourse } from "../hooks/use-player-navigation/types";

export type PlayerCourse = NormalizedCourse;

export type PlayerLesson = PlayerCourse["lessons"][number];

export type PlayerScene = PlayerLesson["scenes"][number];

export type ProgressionMode = "member" | "anonymous" | "preview";

export interface PlayerProgress {
  completedLessonIds: string[];
  completedSceneIds: string[];
  totalSP: number;
}

export const initialPlayerProgress: PlayerProgress = {
  completedLessonIds: [],
  completedSceneIds: [],
  totalSP: 0,
};

export type PlayerViewState =
  | { type: "overview" }
  | { type: "lesson"; lessonId: string; sceneIndex?: number }
  | { type: "complete"; lessonId: string; spEarned: number }
  | { type: "course_complete"; finalScorePct?: number };

export interface PathProgression {
  fromLessonId: string;
  toLessonId: string;
}

import type {
  LessonSessionSnapshot,
  PendingSceneSubmission,
} from "../lesson-player/progression/lesson-progression.machine";

export interface CoursePlayerContextValue {
  mode: ProgressionMode;
  isLoading: boolean;
  course: PlayerCourse | undefined;

  unavailableReason?: CourseUnavailableReason | null;

  retryCourse?: () => void;
  progress: PlayerProgress;
  viewState: PlayerViewState;
  currentLesson: PlayerLesson | undefined;

  initialLessonSP: number;
  lessonMaxSp: number;
  courseMaxSP: number;
  nextLessonTitle: string | undefined;
  pathProgression: PathProgression | null;
  clearPathProgression: () => void;
  enrollmentId?: string;
  triesCount?: number;
  getInitialSceneIndex?: (lesson: PlayerLesson) => number;
  handleSelectLesson: (id: string, sceneIndex?: number) => void;
  handleLessonComplete: (sp: number) => void | Promise<void>;

  handleLessonSessionChange?: (snapshot: LessonSessionSnapshot) => void;
  handleExitLesson: () => void;

  onLeaveCourse?: () => void;
  handleContinueFromComplete: () => void;
  handleBackToOverview: () => void;

  isAnonymous?: boolean;

  anonymousId?: string;

  hasCertificate?: boolean;

  courseId?: string;

  initialPendingSubmissions?: Record<string, PendingSceneSubmission>;

  restartCount: number;

  isRestartPending?: boolean;
}
