"use client";

import { Skeleton } from "@scibly/ui/components/skeleton";
import React from "react";

import { type CoursesTranslations } from "@/features/course-authoring/contracts";
import { api } from "@/shared/api/trpc/client";

import { BlockRow } from "./block-row";

interface BlockAnalyticsDetailProps {
  courseId: string;
  sceneId: string;
  t: CoursesTranslations;
}

export function BlockAnalyticsDetail({
  courseId,
  sceneId,
  t,
}: BlockAnalyticsDetailProps) {
  const { data, isLoading } = api.course.getBlockAnalytics.useQuery(
    { courseId, sceneId },
    { staleTime: 60_000 },
  );

  const blockT = t.detail.analyticsTab;

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-[120px] w-full rounded-xl" />
        <Skeleton className="h-[120px] w-full rounded-xl" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-ink-soft border-edge bg-ground-soft rounded-2xl border-2 border-dashed py-6 text-center text-[12px]">
        {blockT.blockNoAnalytics}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.map((block, i) => (
        <BlockRow key={block.blockId} block={block} index={i} t={t} />
      ))}
    </div>
  );
}
