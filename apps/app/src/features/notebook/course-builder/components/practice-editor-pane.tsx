"use client";

import dynamic from "next/dynamic";

export const PracticeEditorPane = dynamic(
  () =>
    import("@/features/course-authoring/client").then(
      (courseAuthoring) => courseAuthoring.PracticeEditor,
    ),
  { ssr: false, loading: () => null },
);
