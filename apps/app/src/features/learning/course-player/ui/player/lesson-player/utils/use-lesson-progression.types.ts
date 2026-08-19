import type { PlayerLesson, ProgressionMode } from "../../utils/player-types";
import type {
  LessonSessionSnapshot,
  PendingSceneSubmission,
} from "../progression/lesson-progression.model";
import type { NavigationTranslations } from "./lesson-progression-helpers";

export interface UseLessonProgressionOptions {
  mode?: ProgressionMode;
  lesson: PlayerLesson;
  enrollmentId?: string;
  initialSceneIndex?: number;
  initialPendingSubmissions?: Record<string, PendingSceneSubmission>;
  completedSceneIds?: string[];
  initialSessionSP?: number;
  onComplete: (spEarned: number) => void;

  onSessionChange?: (snapshot: LessonSessionSnapshot) => void;
  isReadOnly?: boolean;
  anonymousId?: string;
  courseId?: string;
  t?: NavigationTranslations;
}
