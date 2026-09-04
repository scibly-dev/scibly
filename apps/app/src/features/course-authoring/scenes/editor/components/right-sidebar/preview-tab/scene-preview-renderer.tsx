import Editor from "@/features/course-authoring/scenes/editor/authoring-editor";
import { api } from "@/shared/api/trpc/client";
import { ATTEMPT_SDK } from "@/shared/content/practice/assemble-practice-document";
import { PracticeSceneFrame } from "@/shared/content/practice/practice-scene-frame";

import { type Scene } from "../../../../../lessons/builder/components/lesson-builder";

function PracticePreview({
  sceneId,
  layoutClass,
}: {
  sceneId: string;
  layoutClass?: string;
}) {
  const { data } = api.scene.getPractice.useQuery({ sceneId });
  if (!data?.html) return null;
  return (
    <PracticeSceneFrame
      html={data.html}
      sdk={ATTEMPT_SDK}
      className={layoutClass}
    />
  );
}

export function ScenePreviewRenderer({
  scene,
  layoutClass,
}: {
  scene: Scene;
  layoutClass?: string;
}) {
  if (scene.kind === "PRACTICE") {
    return <PracticePreview sceneId={scene.id} layoutClass={layoutClass} />;
  }

  return (
    <Editor
      variant={{ type: "preview" }}
      documentId={scene.id}
      wrapperClassName={layoutClass}
      visibilityOptions={{ topBar: { enabled: false } }}
    />
  );
}
