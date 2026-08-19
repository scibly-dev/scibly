"use client";

import type { LearningPlayerTranslations } from "../../i18n/learning-player.types";
import type {
  PathProgression,
  PlayerCourse,
  PlayerLesson,
  PlayerProgress,
} from "../../utils/player-types";
import type { SceneNodeStatus } from "./scene-path-node";

import { Trophy } from "lucide-react";
import { Fragment, useCallback, useState } from "react";

import {
  getInitialSceneIndex,
  getLessonSceneProgress,
  isLessonAvailable,
} from "../../utils/player-helpers";
import {
  COURSE_HIGHLIGHT,
  getPathNodeOffset,
  PATH_WIDTH_PX,
} from "../course-path-theme";
import { LessonBanner } from "./lesson-banner";
import { PathConnector } from "./path-connector";
import { ScenePathNode } from "./scene-path-node";

interface CoursePathProps {
  course: PlayerCourse;
  progress: PlayerProgress;
  onSelectLesson: (lessonId: string, sceneIndex?: number) => void;
  pathProgression?: PathProgression | null;
  onPathProgressionComplete?: () => void;
  t: LearningPlayerTranslations;
}

function usePathReveal(
  pathProgression: PathProgression | null,
  onComplete?: () => void,
) {
  const token = pathProgression?.toLessonId ?? null;
  const [handledToken, setHandledToken] = useState<string | null>(null);
  const finish = useCallback(() => {
    if (!token || handledToken === token) return;
    setHandledToken(token);
    onComplete?.();
  }, [token, handledToken, onComplete]);
  return { finish, revealedLessonId: token };
}

function sceneStatus(
  sceneIndex: number,
  currentIndex: number,
  lessonCompleted: boolean,
  sceneCompleted: boolean,
): SceneNodeStatus {
  if (lessonCompleted || sceneCompleted) return "completed";
  return sceneIndex === currentIndex ? "current" : "upcoming";
}

type LessonGroupProps = {
  lesson: PlayerLesson;
  index: number;
  lessons: PlayerLesson[];
  progress: PlayerProgress;
  revealed: boolean;
  onSelectLesson: (lessonId: string, sceneIndex?: number) => void;
  onRevealComplete: () => void;
  t: LearningPlayerTranslations;
};

const LessonGroup = (props: LessonGroupProps) => {
  const { lesson, index, lessons, progress } = props;
  const isCompleted = progress.completedLessonIds.includes(lesson.id);
  const isAvailable = isLessonAvailable(lessons, index, progress);
  const isLocked = !isCompleted && !isAvailable;
  const scenes = lesson.scenes ?? [];
  const sceneProgress = getLessonSceneProgress(
    lesson,
    progress.completedSceneIds,
    { lessonCompleted: isCompleted },
  );
  const isStartable = isAvailable && !isCompleted;

  const currentIndex = isStartable
    ? getInitialSceneIndex(lesson, progress.completedSceneIds)
    : -1;
  const startFrom = (status: SceneNodeStatus, sceneIndex: number) => {
    if (!isStartable || status === "upcoming") return undefined;
    return status === "completed"
      ? () => props.onSelectLesson(lesson.id, sceneIndex)
      : () => props.onSelectLesson(lesson.id);
  };

  return (
    <section className="flex w-full flex-col items-center">
      <LessonBanner
        lesson={lesson}
        index={index}
        totalLessons={lessons.length}
        isCompleted={isCompleted}
        isLocked={isLocked}
        completedScenes={sceneProgress.completed}
        totalScenes={sceneProgress.total}
        revealed={props.revealed}
        onStart={() => props.onSelectLesson(lesson.id)}
        onRevealComplete={props.onRevealComplete}
        t={props.t}
      />
      <div
        className="flex flex-col items-center pt-7"
        style={{ width: PATH_WIDTH_PX }}
      >
        {scenes.map((scene, sceneIndex) => {
          const status = sceneStatus(
            sceneIndex,
            currentIndex,
            isCompleted,
            progress.completedSceneIds.includes(scene.id),
          );
          return (
            <Fragment key={scene.id}>
              <ScenePathNode
                offsetX={getPathNodeOffset(sceneIndex)}
                status={status}
                isFinal={sceneIndex === scenes.length - 1}
                onStart={startFrom(status, sceneIndex)}
                label={lesson.title}
              />
              {sceneIndex < scenes.length - 1 ? (
                <PathConnector
                  fromOffset={getPathNodeOffset(sceneIndex)}
                  toOffset={getPathNodeOffset(sceneIndex + 1)}
                  active={status === "completed"}
                />
              ) : null}
            </Fragment>
          );
        })}
      </div>
    </section>
  );
};

const CoursePathGoal = ({
  reached,
  label,
}: {
  reached: boolean;
  label: string;
}) => (
  <div className="flex flex-col items-center">
    <span
      className="flex size-[72px] items-center justify-center rounded-full"
      style={{
        backgroundColor: reached
          ? COURSE_HIGHLIGHT.goalFace
          : COURSE_HIGHLIGHT.locked,
        boxShadow: `0 8px 0 0 ${reached ? COURSE_HIGHLIGHT.goalEdge : COURSE_HIGHLIGHT.lockedLip}, inset 0 3px 0 0 rgba(255,255,255,0.28)`,
        color: reached
          ? COURSE_HIGHLIGHT.goalGlyph
          : COURSE_HIGHLIGHT.lockedIcon,
      }}
      aria-hidden
    >
      <Trophy className="size-8" strokeWidth={2.5} />
    </span>
    <span
      className="mt-3.5 text-[11px] font-bold tracking-[0.12em] uppercase"
      style={{
        color: reached ? COURSE_HIGHLIGHT.goalGlyph : "var(--color-ink-faint)",
      }}
    >
      {label}
    </span>
  </div>
);

export function CoursePath({
  course,
  progress,
  onSelectLesson,
  pathProgression = null,
  onPathProgressionComplete,
  t,
}: CoursePathProps) {
  const lessons = course.lessons;
  const reveal = usePathReveal(pathProgression, onPathProgressionComplete);
  const allCompleted =
    lessons.length > 0 &&
    lessons.every((lesson) => progress.completedLessonIds.includes(lesson.id));
  return (
    <div className="flex w-full flex-col items-center gap-10 pb-14">
      {lessons.map((lesson, index) => (
        <LessonGroup
          key={lesson.id}
          lesson={lesson}
          index={index}
          lessons={lessons}
          progress={progress}
          revealed={reveal.revealedLessonId === lesson.id}
          onSelectLesson={onSelectLesson}
          onRevealComplete={reveal.finish}
          t={t}
        />
      ))}
      {lessons.length > 0 ? (
        <CoursePathGoal
          reached={allCompleted}
          label={t.lessonComplete.courseCompleted}
        />
      ) : null}
    </div>
  );
}
