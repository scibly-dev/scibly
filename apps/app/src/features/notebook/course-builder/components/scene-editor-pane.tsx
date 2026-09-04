"use client";

import type { EditorProps } from "@/features/course-authoring/client";

import { Loader2 } from "lucide-react";
import dynamic from "next/dynamic";

// Module level, and it has to stay there: a dynamic() inside a component body
// mints a new lazy component every render and remounts the editor.
export const SceneEditorPane = dynamic<EditorProps>(
  () =>
    import("@/features/course-authoring/client").then(
      (courseAuthoring) => courseAuthoring.AuthoringEditor,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[280px] flex-1 items-center justify-center">
        <div className="animate-spin">
          <Loader2 className="text-ink-faint h-5 w-5" />
        </div>
      </div>
    ),
  },
);
