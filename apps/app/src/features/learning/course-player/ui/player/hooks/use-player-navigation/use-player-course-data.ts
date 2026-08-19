"use client";

import { useCallback, useMemo } from "react";

import { api } from "@/shared/api/trpc/client";

import { describeCourseLoadFailure } from "./course-availability";
import { normalizeCourse } from "./normalization";

export function usePlayerCourseData({
  courseId,
  isAnonymous,
  anonymousId,
}: {
  courseId: string;
  isAnonymous: boolean;
  anonymousId?: string;
}) {
  const {
    data: memberCourse,
    isLoading: isMemberCourseLoading,
    refetch: refetchMemberCourse,
  } = api.learning.getLearnerCourse.useQuery(
    { courseId },
    { enabled: !isAnonymous },
  );
  const {
    data: publicCourse,
    isLoading: isPublicCourseLoading,
    error: publicCourseError,
    refetch: refetchPublicCourse,
  } = api.course.getPublicCourse.useQuery(
    { courseId },
    { enabled: isAnonymous },
  );
  const course = useMemo(() => {
    if (isAnonymous) {
      return publicCourse ? normalizeCourse(publicCourse) : undefined;
    }
    return memberCourse ? normalizeCourse(memberCourse) : undefined;
  }, [isAnonymous, publicCourse, memberCourse]);

  const {
    data: dbProgress,
    isLoading: isProgressLoading,
    refetch: refetchProgress,
  } = api.sceneProgress.getLearnerProgress.useQuery(
    isAnonymous && anonymousId ? { courseId, anonymousId } : { courseId },
    {
      enabled: isAnonymous ? !!anonymousId && !!courseId : !isAnonymous,
    },
  );
  const refetchCourse = useCallback(async () => {
    if (!isAnonymous) await refetchMemberCourse();
  }, [isAnonymous, refetchMemberCourse]);
  const retryCourse = useCallback(() => {
    void (isAnonymous ? refetchPublicCourse() : refetchMemberCourse());
  }, [isAnonymous, refetchPublicCourse, refetchMemberCourse]);

  return {
    course,
    dbProgress,
    isLoading:
      (isAnonymous ? isPublicCourseLoading : isMemberCourseLoading) ||
      isProgressLoading,
    isProgressLoading,
    memberCourse,
    unavailableReason: isAnonymous
      ? describeCourseLoadFailure(publicCourseError)
      : null,
    refetchCourse,
    retryCourse,
    refetchProgress,
  };
}
