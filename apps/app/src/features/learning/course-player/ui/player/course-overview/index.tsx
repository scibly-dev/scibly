"use client";

import type {
  PathProgression,
  PlayerCourse,
  PlayerProgress,
} from "../utils/player-types";

import { motion } from "framer-motion";

import { useTranslation } from "@/i18n/hooks/use-translation";

import { CoursePath } from "./components/course-path";
import { CoursePathHeader } from "./components/course-path-header";

interface CourseOverviewProps {
  course: PlayerCourse;
  progress: PlayerProgress;
  courseMaxSP: number;
  onSelectLesson: (lessonId: string, sceneIndex?: number) => void;
  pathProgression?: PathProgression | null;
  onPathProgressionComplete?: () => void;
  triesCount?: number;
}

export function CourseOverview({
  course,
  progress,
  courseMaxSP,
  onSelectLesson,
  pathProgression = null,
  onPathProgressionComplete,
  triesCount = 0,
}: CourseOverviewProps) {
  const { translations } = useTranslation("learningPlayer");

  const completedCount = course.lessons.filter((l) =>
    progress.completedLessonIds.includes(l.id),
  ).length;

  const maxSp = courseMaxSP;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="w-full py-2"
    >
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-8">
        <CoursePathHeader
          courseId={course.id}
          courseTitle={course.title}
          thumbnail={course.thumbnail}
          completedLessons={completedCount}
          totalLessons={course.lessons.length}
          earnedSp={progress.totalSP}
          maxSp={maxSp}
          triesCount={triesCount}
          maxTries={course.maxTries}
          t={translations}
        />

        <CoursePath
          course={course}
          progress={progress}
          onSelectLesson={onSelectLesson}
          pathProgression={pathProgression}
          onPathProgressionComplete={onPathProgressionComplete}
          t={translations}
        />
      </div>
    </motion.div>
  );
}
