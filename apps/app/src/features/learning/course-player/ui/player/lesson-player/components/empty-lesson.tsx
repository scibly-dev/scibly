import type { LearningPlayerTranslations } from "../../i18n/learning-player.types";

import { PLAYER_VIEWPORT_LAYER } from "../../utils/viewport-layer";

export function EmptyLesson({
  onExit,
  t,
}: {
  onExit: () => void;
  t: LearningPlayerTranslations;
}) {
  return (
    <div
      {...PLAYER_VIEWPORT_LAYER}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#fdfdfd]"
    >
      <p className="mb-4 text-sm font-medium text-neutral-500">
        {t.navigation.noScenes}
      </p>
      <button
        onClick={onExit}
        className="rounded-xl bg-neutral-100 px-5 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-200"
      >
        {t.navigation.previous}
      </button>
    </div>
  );
}
