"use client";

import type { ReactNode } from "react";
import type {
  AnonymousSceneContentSource,
  MemberSceneContentSource,
  PreviewSceneContentSource,
  SceneContentQueryResult,
} from "../utils/use-scene-content";

import {
  useAnonymousSceneContent,
  useMemberSceneContent,
  usePreviewSceneContent,
} from "../utils/use-scene-content";

function MemberSceneContentLoaderComponent({
  source,
  children,
}: {
  source: MemberSceneContentSource;
  children: (result: SceneContentQueryResult) => ReactNode;
}) {
  const result = useMemberSceneContent(source);
  return children(result);
}

function AnonymousSceneContentLoaderComponent({
  source,
  children,
}: {
  source: AnonymousSceneContentSource;
  children: (result: SceneContentQueryResult) => ReactNode;
}) {
  const result = useAnonymousSceneContent(source);
  return children(result);
}

function PreviewSceneContentLoaderComponent({
  source,
  children,
}: {
  source: PreviewSceneContentSource;
  children: (result: SceneContentQueryResult) => ReactNode;
}) {
  const result = usePreviewSceneContent(source);
  return children(result);
}

export function LessonSceneContentLoader({
  source,
  children,
}: {
  source:
    | MemberSceneContentSource
    | AnonymousSceneContentSource
    | PreviewSceneContentSource;
  children: (result: SceneContentQueryResult) => ReactNode;
}) {
  if (source.mode === "member") {
    return (
      <MemberSceneContentLoaderComponent source={source}>
        {children}
      </MemberSceneContentLoaderComponent>
    );
  }
  if (source.mode === "anonymous") {
    return (
      <AnonymousSceneContentLoaderComponent source={source}>
        {children}
      </AnonymousSceneContentLoaderComponent>
    );
  }
  return (
    <PreviewSceneContentLoaderComponent source={source}>
      {children}
    </PreviewSceneContentLoaderComponent>
  );
}
