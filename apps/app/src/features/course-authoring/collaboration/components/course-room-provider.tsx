"use client";

import React from "react";

import { SessionAwareRoom } from "@/shared/content/editor/collaboration/session-aware-room";

import { CourseSyncWatcher } from "./course-sync-watcher";

export function CourseRoomProvider({
  courseId,
  children,
}: {
  courseId: string;
  children: React.ReactNode;
}) {
  return (
    <SessionAwareRoom name={`course-meta-${courseId}`} kind="course-metadata">
      <CourseSyncWatcher courseId={courseId} />
      {children}
    </SessionAwareRoom>
  );
}
