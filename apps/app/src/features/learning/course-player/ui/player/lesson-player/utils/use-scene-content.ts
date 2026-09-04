"use client";

import type { PublishedSceneContent } from "@/shared/content/contracts";
import type { ProgressionMode } from "../../utils/player-types";

import { useEffect } from "react";

import { api } from "@/shared/api/trpc/client";

import {
  buildNextScenePrefetchInput,
  getSceneContentQueryOptions,
  type SceneContentFetchInput,
} from "./scene-content-query";

export type SceneContentQueryResult = {
  isLoading: boolean;
  isRefetching: boolean;
  error: unknown;
  refetch: () => void;
} & (PublishedSceneContent | { kind?: undefined; learnerContent?: undefined });

export type MemberSceneContentSource = {
  mode: "member";
  courseId: string;
  sceneId: string;
  nextSceneId?: string;
};

export type AnonymousSceneContentSource = {
  mode: "anonymous";
  courseId: string;
  courseVersionId: string;
  sceneId: string;
  nextSceneId?: string;
};

export type PreviewSceneContentSource = {
  mode: "preview";
  courseId: string;
  sceneId: string;
  nextSceneId?: string;
};

export type SceneContentSource =
  | MemberSceneContentSource
  | AnonymousSceneContentSource
  | PreviewSceneContentSource;

function useSceneContentPrefetch(
  mode: ProgressionMode,
  source: SceneContentSource,
) {
  const utils = api.useUtils();
  const { courseId, nextSceneId } = source;
  const courseVersionId =
    source.mode === "anonymous" ? source.courseVersionId : undefined;
  useEffect(() => {
    const prefetchInput = nextSceneId
      ? buildNextScenePrefetchInput(mode, {
          courseId,
          nextSceneId,
          courseVersionId,
        })
      : null;
    if (!prefetchInput) return;
    prefetchSceneContent(utils, mode, prefetchInput);
  }, [courseId, courseVersionId, mode, nextSceneId, utils]);
}

function prefetchSceneContent(
  utils: ReturnType<typeof api.useUtils>,
  mode: ProgressionMode,
  input: SceneContentFetchInput,
) {
  const { courseId, sceneId, courseVersionId } = input;
  if (mode === "member") {
    void utils.learning.getLearnerSceneContent.prefetch({ courseId, sceneId });
    return;
  }
  if (mode === "anonymous") {
    void utils.course.getPublicSceneContent.prefetch({
      courseId,
      courseVersionId: courseVersionId!,
      sceneId,
    });
    return;
  }
  void utils.course.getPreviewSceneContent.prefetch({ courseId, sceneId });
}

function useActiveSceneContent(
  query: {
    data: ({ sceneId: string } & PublishedSceneContent) | undefined;
    isLoading: boolean;
    isFetching: boolean;
    error: unknown;
    refetch: () => void;
  },
  sceneId: string,
): SceneContentQueryResult {
  const active =
    query.data?.sceneId === sceneId ? query.data : { kind: undefined };
  const status = {
    isLoading: query.isLoading,
    isRefetching: query.isFetching && !query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
  if (active.kind === "PRACTICE") {
    return {
      ...status,
      kind: active.kind,
      learnerContent: active.learnerContent,
    };
  }
  if (active.kind === "DOCUMENT") {
    return {
      ...status,
      kind: active.kind,
      learnerContent: active.learnerContent,
    };
  }
  return status;
}

export function useMemberSceneContent(source: MemberSceneContentSource) {
  const queryOptions = getSceneContentQueryOptions("member");
  const query = api.learning.getLearnerSceneContent.useQuery(
    { courseId: source.courseId, sceneId: source.sceneId },
    queryOptions,
  );
  useSceneContentPrefetch("member", source);
  return useActiveSceneContent(query, source.sceneId);
}

export function useAnonymousSceneContent(source: AnonymousSceneContentSource) {
  const queryOptions = getSceneContentQueryOptions("anonymous");
  const query = api.course.getPublicSceneContent.useQuery(
    {
      courseId: source.courseId,
      courseVersionId: source.courseVersionId,
      sceneId: source.sceneId,
    },
    queryOptions,
  );
  useSceneContentPrefetch("anonymous", source);
  return useActiveSceneContent(query, source.sceneId);
}

export function usePreviewSceneContent(source: PreviewSceneContentSource) {
  const queryOptions = getSceneContentQueryOptions("preview");
  const query = api.course.getPreviewSceneContent.useQuery(
    { courseId: source.courseId, sceneId: source.sceneId },
    queryOptions,
  );
  useSceneContentPrefetch("preview", source);
  return useActiveSceneContent(query, source.sceneId);
}
