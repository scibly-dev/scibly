"use client";

import type { LessonPerf, ScenePerf } from "./types";

import { cn } from "@scibly/ui/utils";
import { ChevronRight, Layers } from "lucide-react";
import React, { useState } from "react";

import { type CoursesTranslations } from "@/features/course-authoring/contracts";

import { BlockAnalyticsDetail } from "./components/block-analytics-detail";
import { MiniStatCard } from "./components/mini-stat-card";

interface LessonPerformanceViewProps {
  data: LessonPerf[];
  courseId: string;
  t: CoursesTranslations;
}

interface LessonStructureProps {
  data: LessonPerf[];
  expandedLessons: Record<string, boolean>;
  onSelectScene: (sceneId: string) => void;
  onToggleLesson: (lessonId: string) => void;
  selectedSceneId: string | null;
  t: CoursesTranslations;
}

export function LessonStructure(props: LessonStructureProps) {
  return (
    <div className="border-edge bg-ground-soft h-fit space-y-4 overflow-hidden rounded-2xl border-2 p-3.5 md:col-span-4">
      <div className="text-ink-soft px-2 text-[11px] font-semibold tracking-wider uppercase">
        {props.t.detail.analyticsTab.performanceStructure}
      </div>
      <div className="max-h-[500px] space-y-3 overflow-y-auto pr-1">
        {props.data.map((lesson) => (
          <LessonStructureItem
            key={lesson.id}
            lesson={lesson}
            expanded={Boolean(props.expandedLessons[lesson.id])}
            onSelectScene={props.onSelectScene}
            onToggle={props.onToggleLesson}
            selectedSceneId={props.selectedSceneId}
          />
        ))}
      </div>
    </div>
  );
}

export function LessonStructureItem({
  expanded,
  lesson,
  onSelectScene,
  onToggle,
  selectedSceneId,
}: {
  expanded: boolean;
  lesson: LessonPerf;
  onSelectScene: (sceneId: string) => void;
  onToggle: (lessonId: string) => void;
  selectedSceneId: string | null;
}) {
  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => onToggle(lesson.id)}
        className="text-ink-muted group hover:bg-ground flex w-full items-center justify-between gap-1.5 rounded-lg px-2 py-1.5 text-left text-[12px] font-semibold transition-colors"
      >
        <div className="flex min-w-0 items-center gap-1.5">
          <Layers className="text-ink-soft h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{lesson.title}</span>
        </div>
        <ChevronRight
          className={cn(
            "text-ink-soft h-3.5 w-3.5 shrink-0 transition-transform duration-200",
            expanded && "rotate-90 transform",
          )}
        />
      </button>
      {expanded && (
        <div className="border-edge animate-in fade-in ml-3.5 space-y-1 border-l-2 pl-3 duration-100">
          {lesson.scenes.map((scene) => (
            <SceneStructureItem
              key={scene.id}
              scene={scene}
              selected={scene.id === selectedSceneId}
              onSelect={onSelectScene}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function SceneStructureItem({
  scene,
  selected,
  onSelect,
}: {
  scene: ScenePerf;
  selected: boolean;
  onSelect: (sceneId: string) => void;
}) {
  const attempts = scene.enrolledAttempts + scene.anonymousAttempts;
  return (
    <button
      onClick={() => onSelect(scene.id)}
      className={cn(
        "flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-[11px] font-medium transition-all duration-150",
        selected
          ? "text-ink border-edge border-2 bg-white font-semibold shadow-[0_2px_0_0_var(--color-lip)]"
          : "text-ink-soft hover:text-ink hover:bg-ground",
      )}
    >
      <span className="flex-1 truncate">{scene.title}</span>
      {attempts > 0 && (
        <span
          className={cn(
            "shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold tracking-wide tabular-nums",
            selected
              ? "border-edge text-ink border-2 bg-white"
              : "bg-ground border-edge text-ink-muted border-2",
          )}
        >
          {attempts}
        </span>
      )}
    </button>
  );
}

export function ScenePerformanceDetail({
  courseId,
  scene,
  t,
}: {
  courseId: string;
  scene?: ScenePerf;
  t: CoursesTranslations;
}) {
  const perfT = t.detail.analyticsTab;
  if (!scene) {
    return (
      <div className="text-ink-soft border-edge bg-ground-soft flex h-full min-h-[250px] flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center">
        <p className="text-[12px]">{perfT.performanceSelectScene}</p>
      </div>
    );
  }
  return (
    <>
      <div className="border-edge rounded-2xl border-2 bg-white p-4 shadow-[0_3px_0_0_var(--color-lip)]">
        <h4 className="text-ink mb-3 text-[13px] font-semibold">
          {scene.title}
        </h4>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <MiniStatCard
            label={perfT.performanceTotalAttempts}
            value={scene.enrolledAttempts + scene.anonymousAttempts}
            description={`${perfT.trendEnrolled} + ${perfT.trendAnonymous}`}
          />
          <MiniStatCard
            label={perfT.performanceEnrolledAvg}
            value={
              scene.enrolledAttempts > 0 ? `${scene.enrolledAvgScore} SP` : "—"
            }
            description={perfT.performanceAttemptsSub.replace(
              "{{attempts}}",
              String(scene.enrolledAttempts),
            )}
          />
          <MiniStatCard
            label={perfT.performanceAnonAvg}
            value={
              scene.anonymousAttempts > 0
                ? `${scene.anonymousAvgScore} SP`
                : "—"
            }
            description={perfT.performanceSessionsSub.replace(
              "{{sessions}}",
              String(scene.anonymousAttempts),
            )}
          />
        </div>
      </div>
      <BlockAnalyticsDetail courseId={courseId} sceneId={scene.id} t={t} />
    </>
  );
}

export function LessonPerformanceView({
  data,
  courseId,
  t,
}: LessonPerformanceViewProps) {
  const perfT = t.detail.analyticsTab;

  const firstSceneId = data[0]?.scenes[0]?.id ?? null;
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(
    firstSceneId,
  );

  const [expandedLessons, setExpandedLessons] = useState<
    Record<string, boolean>
  >(() => {
    const initial: Record<string, boolean> = {};
    if (selectedSceneId) {
      const parentLesson = data.find((lesson) =>
        lesson.scenes.some((scene) => scene.id === selectedSceneId),
      );
      if (parentLesson) {
        initial[parentLesson.id] = true;
      }
    }
    return initial;
  });

  const toggleLesson = (lessonId: string) => {
    setExpandedLessons((prev) => ({
      ...prev,
      [lessonId]: !prev[lessonId],
    }));
  };

  if (data.length === 0) {
    return (
      <div className="text-ink-soft flex h-[120px] items-center justify-center text-[13px]">
        {perfT.performanceNoData}
      </div>
    );
  }

  const selectedScene = data
    .flatMap((lesson) => lesson.scenes)
    .find((scene) => scene.id === selectedSceneId);

  return (
    <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-12">
      <LessonStructure
        data={data}
        expandedLessons={expandedLessons}
        onSelectScene={setSelectedSceneId}
        onToggleLesson={toggleLesson}
        selectedSceneId={selectedSceneId}
        t={t}
      />
      <div className="space-y-4 md:col-span-8">
        <ScenePerformanceDetail
          courseId={courseId}
          scene={selectedScene}
          t={t}
        />
      </div>
    </div>
  );
}
