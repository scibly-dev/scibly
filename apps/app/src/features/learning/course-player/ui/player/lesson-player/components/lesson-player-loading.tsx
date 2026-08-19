import { Skeleton } from "@scibly/ui/components/skeleton";

import { PLAYER_VIEWPORT_LAYER } from "../../utils/viewport-layer";
import { LessonScenePanelSkeleton } from "./lesson-scene-panel-skeleton";
import { SceneViewportShell } from "./scene-viewport-shell";

export function LessonPlayerLoading() {
  return (
    <div
      {...PLAYER_VIEWPORT_LAYER}
      className="@container fixed inset-0 z-100 flex flex-col overflow-hidden bg-white font-sans"
    >
      <div className="border-hairline flex shrink-0 border-b-2 bg-white/90 px-4 pt-4 pb-3 @min-[40rem]:px-6">
        {/* h-10 is the top bar's button row: the scene must not jump when the
            real bar arrives with its exit and menu buttons in it. */}
        <div className="mx-auto flex h-10 w-full max-w-2xl items-center gap-3">
          <span className="w-10 shrink-0" aria-hidden />
          <Skeleton className="h-4 flex-1 rounded-full" />
          <span className="w-10 shrink-0" aria-hidden />
        </div>
      </div>
      <div className="relative min-h-0 flex-1">
        <SceneViewportShell>
          <LessonScenePanelSkeleton />
        </SceneViewportShell>
      </div>
    </div>
  );
}
