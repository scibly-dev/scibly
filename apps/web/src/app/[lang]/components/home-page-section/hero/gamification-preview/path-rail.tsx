import {
  BookOpen,
  Check,
  ClipboardCheck,
  Flag,
  Lightbulb,
  Lock,
  type LucideIcon,
} from "lucide-react";

import {
  CORRECT_KEY,
  DONE_KEY,
  IDLE_KEY,
  type KeyTone,
} from "@/app/[lang]/components/marketing-tokens";

import {
  flatKey,
  PREVIEW_META,
  PREVIEW_PLACEHOLDER,
} from "../hero-preview-kit";
import { type GamificationCopy } from "./gamification-copy";
import {
  ACCENT,
  ACTIVE_SCENE,
  PILLAR,
  RAIL,
  RULE,
  SCENE_COUNT,
} from "./gamification-theme";

type PathStopState = "completed" | "active" | "locked";

const PATH_STOPS: { state: PathStopState; icon: LucideIcon; offset: number }[] =
  [
    { state: "completed", icon: BookOpen, offset: 0 },
    { state: "active", icon: Lightbulb, offset: -20 },
    { state: "locked", icon: ClipboardCheck, offset: 16 },
    { state: "locked", icon: Flag, offset: -14 },
  ];

const STOP_TONES = {
  completed: DONE_KEY,
  active: ACCENT,
  locked: IDLE_KEY,
} satisfies Record<PathStopState, KeyTone>;

const STOP_BADGE =
  "absolute -right-1.5 -bottom-1.5 flex h-4 items-center justify-center rounded-full border";

export function PathRail({ t }: { t: GamificationCopy }) {
  return (
    <aside
      className="hidden w-[156px] shrink-0 flex-col overflow-hidden border-r md:flex lg:w-[172px] xl:w-[184px]"
      style={{ backgroundColor: RAIL, borderColor: RULE }}
    >
      <div className="flex shrink-0 items-center justify-between px-3 pt-3 pb-1.5">
        <span
          className="text-[10.5px] font-semibold"
          style={{ color: PREVIEW_META }}
        >
          {t.nextUp}
        </span>
      </div>

      <div className="relative flex flex-1 flex-col items-center px-1 pt-3 pb-4">
        {PATH_STOPS.map((stop, i) => {
          const next = PATH_STOPS[i + 1];
          return (
            <div
              key={t.pathStops[i]}
              className="flex w-full flex-col items-center"
            >
              <PathNode
                title={t.pathStops[i]}
                state={stop.state}
                icon={stop.icon}
                offsetX={stop.offset}
                lockedLabel={t.lockedLabel}
              />
              {next ? (
                <PathConnector
                  fromOffset={stop.offset}
                  toOffset={next.offset}
                  active={stop.state !== "locked"}
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </aside>
  );
}

function PathConnector({
  fromOffset,
  toOffset,
  active,
}: {
  fromOffset: number;
  toOffset: number;
  active: boolean;
}) {
  const centerX = 100;
  const fromX = centerX + fromOffset * 1.6;
  const toX = centerX + toOffset * 1.6;

  return (
    <svg
      className="relative z-0 -my-0.5 block h-7 w-[7.5rem] lg:h-8 lg:w-[8.5rem]"
      viewBox="0 0 200 44"
      preserveAspectRatio="none"
      aria-hidden
    >
      <path
        d={`M ${fromX} 0 C ${fromX} 22, ${toX} 22, ${toX} 44`}
        fill="none"
        stroke={active ? PILLAR.lipColor : IDLE_KEY.edge}
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PathNode({
  title,
  state,
  icon,
  offsetX,
  lockedLabel,
}: {
  title: string;
  state: PathStopState;
  icon: LucideIcon;
  offsetX: number;
  lockedLabel: string;
}) {
  const Icon = icon;
  const active = state === "active";
  const locked = state === "locked";
  const size = active ? 42 : 36;

  return (
    <div
      className="relative z-10 flex w-full flex-col items-center px-1"
      style={{ transform: `translateX(${offsetX}px)` }}
    >
      <div className="relative" style={{ width: size, height: size }}>
        <div
          className="relative flex items-center justify-center rounded-[13px] border"
          style={{
            width: size,
            height: size,
            ...flatKey(STOP_TONES[state], 3),
          }}
        >
          <Icon
            size={active ? 17 : 15}
            strokeWidth={2.4}
            style={locked ? { color: PREVIEW_PLACEHOLDER } : undefined}
          />
          {state === "active" ? (
            <span
              className={`${STOP_BADGE} min-w-4 px-0.5 text-[7px] font-bold`}
              style={flatKey(DONE_KEY, 0)}
            >
              {ACTIVE_SCENE}/{SCENE_COUNT}
            </span>
          ) : null}
          {state === "completed" ? (
            <span
              className={`${STOP_BADGE} w-4`}
              style={flatKey(
                { ...IDLE_KEY, ink: CORRECT_KEY.ink, edge: CORRECT_KEY.edge },
                0,
              )}
            >
              <Check size={8} strokeWidth={3.5} />
            </span>
          ) : null}
          {locked ? (
            <span
              className={`${STOP_BADGE} w-4`}
              style={flatKey(IDLE_KEY, 0)}
              title={lockedLabel}
            >
              <Lock size={7} strokeWidth={3} />
            </span>
          ) : null}
        </div>
      </div>
      <p
        className="m-0 mt-2 max-w-[8.5rem] text-center text-[9.5px] leading-snug font-bold lg:text-[10.5px]"
        style={{ color: locked ? PREVIEW_PLACEHOLDER : PILLAR.accentColor }}
      >
        {title}
      </p>
    </div>
  );
}
