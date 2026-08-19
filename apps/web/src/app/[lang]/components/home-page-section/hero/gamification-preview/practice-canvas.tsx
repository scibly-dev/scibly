import { type ReactNode } from "react";

import { IDLE_KEY } from "@/app/[lang]/components/marketing-tokens";

import { BENTO_EASE } from "../../keyframes";
import { flatKey, PREVIEW_META, previewCanvasStyle } from "../hero-preview-kit";
import { ClozeScene } from "./cloze-scene";
import { DragDropScene } from "./drag-drop-scene";
import { type GamificationCopy } from "./gamification-copy";
import {
  ACTIVE_SCENE,
  NEXT_SCENE,
  PILLAR,
  PREV_SCENE,
  SCENE_COUNT,
} from "./gamification-theme";
import { QuizPeek } from "./quiz-peek";

const PEEKS = {
  left: {
    place: "top-[4%] left-0 lg:top-[5%] xl:left-[0.5%]",

    transform: "translate3d(6%, 0, 0) scale(0.78)",
    delay: "100ms",
  },
  right: {
    place: "top-[14%] right-0 lg:top-[15%] xl:right-[0.5%]",
    transform: "translate3d(-6%, 10px, 0) scale(0.78)",
    delay: "180ms",
  },
} as const;

const SCENES = Array.from({ length: SCENE_COUNT }, (_, i) => i + 1);

export function PracticeCanvas({ t }: { t: GamificationCopy }) {
  return (
    <div
      className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
      style={previewCanvasStyle(PILLAR)}
    >
      {/* Spotlight — pulls focus to the active scene */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 52% 68% at 54% 46%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.45) 40%, transparent 70%)",
        }}
      />

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-1.5 py-1.5 sm:px-2.5 sm:py-3 md:px-3 md:py-4">
        <ScenePeek side="left" scene={PREV_SCENE} label={t.sceneTypeQuiz}>
          <QuizPeek t={t} />
        </ScenePeek>

        <ScenePeek side="right" scene={NEXT_SCENE} label={t.sceneTypeSort}>
          <DragDropScene t={t} />
        </ScenePeek>

        {/* Active — the cloze the whole preview is frozen on */}
        <div
          className="relative z-[3] w-full max-w-[320px] sm:max-w-[340px] md:max-w-[352px] xl:max-w-[368px]"
          style={{ animation: `sc-rise 820ms ${BENTO_EASE} 140ms both` }}
        >
          <div
            className="pointer-events-none absolute -inset-5 rounded-[32px] bg-white/60 blur-2xl"
            aria-hidden
          />
          <div className="relative">
            <ClozeScene t={t} />
          </div>
        </div>
      </div>

      <SceneDots />
    </div>
  );
}

function ScenePeek({
  side,
  scene,
  label,
  children,
}: {
  side: keyof typeof PEEKS;
  scene: number;
  label: string;
  children: ReactNode;
}) {
  const peek = PEEKS[side];

  return (
    <div
      className={`pointer-events-none absolute z-[1] hidden w-[46%] max-w-[200px] md:block md:max-w-[220px] lg:max-w-[248px] xl:max-w-[268px] ${peek.place}`}
      style={{ animation: `sc-rise 780ms ${BENTO_EASE} ${peek.delay} both` }}
      aria-hidden
    >
      <div
        className="origin-top opacity-70"
        style={{ transform: peek.transform }}
      >
        {/* Only peeks get captions — the active scene is already named by the strip above it. */}
        <div className="mb-1.5 flex items-center gap-1.5 px-0.5">
          <span
            className="flex size-[18px] shrink-0 items-center justify-center rounded-[6px] border text-[9px] font-bold"
            style={{
              backgroundColor: "#ffffff",
              borderColor: IDLE_KEY.edge,
              color: PREVIEW_META,
            }}
          >
            {scene}
          </span>
          <span
            className="text-[10px] font-bold"
            style={{ color: PREVIEW_META }}
          >
            {label}
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}

function SceneDots() {
  return (
    <div
      className="absolute bottom-2 left-1/2 z-[4] hidden -translate-x-1/2 items-center gap-1.5 rounded-full border px-2.5 py-1 md:flex"
      style={flatKey(IDLE_KEY, 2)}
      aria-hidden
    >
      {SCENES.map((scene) =>
        scene === ACTIVE_SCENE ? (
          <span
            key={scene}
            className="h-1.5 w-3.5 rounded-full"
            style={{ backgroundColor: PILLAR.accentColor }}
          />
        ) : (
          <span
            key={scene}
            className="size-1.5 rounded-full"
            style={{
              backgroundColor:
                scene >= PREV_SCENE && scene <= NEXT_SCENE
                  ? PILLAR.lipColor
                  : IDLE_KEY.edge,
            }}
          />
        ),
      )}
    </div>
  );
}
