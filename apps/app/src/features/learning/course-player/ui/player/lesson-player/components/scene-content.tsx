"use client";

import type { Content } from "@tiptap/core";
import type { GuideCharacterReaction } from "@/shared/content/editor/blocks/guide-character/utils/guide-character-reactions";

import { GuideCharacterReactionProvider } from "@/shared/content/editor/blocks/guide-character/components/guide-character-reaction-context";
import { ContentEditor } from "@/shared/content/editor/runtime/content-editor";
import { useEditorStoreScopeActive } from "@/shared/content/editor/runtime/context/editor-store-scope-context";

interface SceneContentProps {
  learnerContent: Content;
  guideReaction?: GuideCharacterReaction;
}

export function SceneContent({
  learnerContent,
  guideReaction = "idle",
}: SceneContentProps) {
  const isStoreScopeActive = useEditorStoreScopeActive();

  return (
    <GuideCharacterReactionProvider reaction={guideReaction}>
      <ContentEditor
        mode="local"
        variant={{ type: "preview" }}
        initialContent={learnerContent}
        capabilities={{ mediaUploads: "disabled" }}
        wrapperClassName="flex flex-col justify-start w-full max-w-4xl mx-auto"
        shouldSetStoreEditor={isStoreScopeActive}
      />
    </GuideCharacterReactionProvider>
  );
}
