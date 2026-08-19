import type { JSONContent } from "@tiptap/core";
import type { PublishArtifacts } from "@/shared/content/contracts";

export type PublishedSceneArtifacts = Readonly<{
  learnerContent: JSONContent;
  gradingManifest: PublishArtifacts["gradingManifest"];
}>;
