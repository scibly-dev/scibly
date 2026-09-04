"use client";

import type {
  DisplayedGrade,
  PublishedSceneContent,
} from "@/shared/content/contracts";
import type { GuideCharacterReaction } from "@/shared/content/editor/blocks/guide-character/utils/guide-character-reactions";

import { useMemo, useState } from "react";

import { MessageResponse } from "@/shared/ai/components/message";
import { GuideCharacterReactionProvider } from "@/shared/content/editor/blocks/guide-character/components/guide-character-reaction-context";
import { ContentEditor } from "@/shared/content/editor/runtime/content-editor";
import { useEditorStoreScopeActive } from "@/shared/content/editor/runtime/context/editor-store-scope-context";
import {
  ATTEMPT_SDK,
  type PracticeSdkContext,
  toPracticeGrade,
} from "@/shared/content/practice/assemble-practice-document";
import { PracticeSceneFrame } from "@/shared/content/practice/practice-scene-frame";

interface SceneContentProps {
  scene: PublishedSceneContent;
  guideReaction?: GuideCharacterReaction;
  onPracticeSubmit?: (work: unknown) => void;
  gradedBlocks?: DisplayedGrade[] | null;
  explanation?: string | null;
  practiceWork?: unknown;
  submitError?: string | null;
}

export function SceneContent({
  scene,
  guideReaction = "idle",
  onPracticeSubmit,
  gradedBlocks,
  explanation,
  practiceWork,
  submitError,
}: SceneContentProps) {
  const isStoreScopeActive = useEditorStoreScopeActive();
  // A fresh object every render would re-post the verdict into the app.
  const grade = useMemo(
    () => (gradedBlocks ? toPracticeGrade(gradedBlocks) : null),
    [gradedBlocks],
  );
  // Snapshotted at mount: recomputing after a live submit would swap `srcdoc`
  // and tear down the app the learner is standing in.
  const [sdk] = useState<PracticeSdkContext>(() =>
    grade
      ? { mode: "review", previous: { work: practiceWork ?? null, grade } }
      : ATTEMPT_SDK,
  );

  if (scene.kind === "PRACTICE") {
    return (
      <>
        <PracticeSceneFrame
          html={scene.learnerContent}
          sdk={sdk}
          onSubmit={onPracticeSubmit}
          grade={grade}
          submitError={submitError}
          className="w-full overflow-hidden rounded-2xl"
        />
        {explanation ? (
          <MessageResponse className="text-ink mt-6 border-l-2 border-[color:var(--editor-primary-color)] pl-5 text-[15px] leading-relaxed">
            {explanation}
          </MessageResponse>
        ) : null}
      </>
    );
  }

  return (
    <GuideCharacterReactionProvider reaction={guideReaction}>
      <ContentEditor
        mode="local"
        variant={{ type: "preview" }}
        initialContent={scene.learnerContent}
        capabilities={{ mediaUploads: "disabled" }}
        wrapperClassName="flex flex-col justify-start w-full max-w-4xl mx-auto"
        shouldSetStoreEditor={isStoreScopeActive}
      />
    </GuideCharacterReactionProvider>
  );
}
