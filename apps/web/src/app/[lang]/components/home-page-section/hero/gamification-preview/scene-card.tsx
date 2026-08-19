import { type ReactNode } from "react";

import { tint } from "@/app/[lang]/components/marketing-tokens";

import { PREVIEW_PLACEHOLDER, previewWash } from "../hero-preview-kit";
import { PILLAR, RULE } from "./gamification-theme";

type SceneCardSize = "hero" | "peek";

const SCENE_CARD_SIZES = {
  hero: {
    frame: "rounded-[18px]",
    borderColor: RULE,
    boxShadow:
      "0 1px 2px rgba(19,28,70,0.05), 0 24px 48px -26px rgba(19,28,70,0.4)",
    header: "px-3 pt-2.5 pb-1 md:px-3.5",
    close: "text-[13px]",
    bar: "h-2",
  },
  peek: {
    frame: "rounded-[14px]",
    borderColor: tint(PILLAR.lipColor, 38),
    boxShadow:
      "0 1px 2px rgba(19,28,70,0.05), 0 16px 30px -20px rgba(19,28,70,0.34)",
    header: "px-2.5 pt-2 pb-1",
    close: "text-[12px]",
    bar: "h-1.5",
  },
} satisfies Record<
  SceneCardSize,
  {
    frame: string;
    borderColor: string;
    boxShadow: string;
    header: string;
    close: string;
    bar: string;
  }
>;

export function SceneCard({
  size,
  progress,
  children,
}: {
  size: SceneCardSize;
  progress: number;
  children: ReactNode;
}) {
  const card = SCENE_CARD_SIZES[size];

  return (
    <div
      className={`overflow-hidden border bg-white ${card.frame}`}
      style={{ borderColor: card.borderColor, boxShadow: card.boxShadow }}
    >
      <div className={`flex items-center gap-2 ${card.header}`}>
        <div
          className={`font-bold ${card.close}`}
          style={{ color: PREVIEW_PLACEHOLDER }}
        >
          ×
        </div>
        <div
          className={`flex-1 overflow-hidden rounded-full ${card.bar}`}
          style={{ backgroundColor: previewWash(PILLAR, 70) }}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: `${progress}%`,
              backgroundColor: PILLAR.accentColor,
            }}
          />
        </div>
      </div>
      {children}
    </div>
  );
}
