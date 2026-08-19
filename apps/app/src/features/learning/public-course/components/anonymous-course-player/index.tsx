"use client";

import { type AnonymousSessionSource } from "@scibly/db/enums";
import { useEffect, useState } from "react";

import { api } from "@/shared/api/trpc/client";

import { CoursePlayerLoading } from "../../../course-player/ui/player/course-overview/overview-skeleton";
import { LessonPlayerLoading } from "../../../course-player/ui/player/lesson-player/components/lesson-player-loading";
import {
  type AnonymousIdentity,
  resolveAnonymousId,
} from "./anonymous-identity";
import { AnonymousCoursePlayerInner } from "./components/anonymous-course-player-inner";

interface AnonymousCoursePlayerProps {
  courseId: string;

  source: AnonymousSessionSource;

  embedOrigin?: string | null;
}

export function AnonymousCoursePlayer({
  courseId,
  source,
  embedOrigin,
}: AnonymousCoursePlayerProps) {
  const [identity, setIdentity] = useState<AnonymousIdentity | null>(null);

  const { data: course } = api.course.getPublicCourse.useQuery({ courseId });

  useEffect(() => {
    const timer = setTimeout(() => {
      setIdentity(resolveAnonymousId());
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  if (!identity)
    return course?.mode === "LESSON" ? (
      <LessonPlayerLoading />
    ) : (
      <CoursePlayerLoading />
    );

  return (
    <AnonymousCoursePlayerInner
      courseId={courseId}
      anonymousId={identity.id}
      progressPersists={identity.persisted}
      source={source}
      embedOrigin={embedOrigin}
    />
  );
}
