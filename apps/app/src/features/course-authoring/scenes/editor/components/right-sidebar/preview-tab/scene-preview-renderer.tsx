import Editor from "@/features/course-authoring/scenes/editor/authoring-editor";

import { type Scene } from "../../../../../lessons/builder/components/lesson-builder";

export function ScenePreviewRenderer({
  scene,
  layoutClass,
}: {
  scene: Scene;
  layoutClass?: string;
}) {
  return (
    <Editor
      variant={{ type: "preview" }}
      documentId={scene.id}
      wrapperClassName={layoutClass}
      visibilityOptions={{ topBar: { enabled: false } }}
    />
  );
}
