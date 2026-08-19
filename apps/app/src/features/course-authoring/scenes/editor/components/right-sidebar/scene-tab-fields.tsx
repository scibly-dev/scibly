import { SceneAnimation } from "@scibly/db/enums";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@scibly/ui/components/dropdown-menu";
import { fieldClass } from "@scibly/ui/design-language";
import { cn } from "@scibly/ui/utils";
import {
  ArrowUpFromLine,
  Check,
  ChevronDown,
  Droplet,
  Maximize,
  Settings2,
  Sparkles,
  Type,
  Wind,
} from "lucide-react";

import { objectKeys } from "@/lib/object-keys";

const ANIMATIONS = {
  [SceneAnimation.FADE]: { label: "Fade in", icon: Wind },
  [SceneAnimation.SLIDE_UP]: { label: "Slide up", icon: ArrowUpFromLine },
  [SceneAnimation.SCALE]: { label: "Scale in", icon: Maximize },
  [SceneAnimation.BLUR]: { label: "Blur reveal", icon: Droplet },
};

export const SceneConfiguration = ({
  title,
  onTitleChange,
}: {
  title: string;
  onTitleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) => {
  return (
    <div>
      <div className="mb-5 flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-[8px] bg-blue-500/10 dark:bg-blue-500/20">
          <Settings2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="text-ink text-[14px] font-bold dark:text-neutral-100">
          Configuration
        </h3>
      </div>
      <label className="text-ink-muted text-[13px] font-medium dark:text-neutral-400">
        Scene title
      </label>
      <div className="relative mt-1.5">
        <Type className="text-ink-faint pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <input
          type="text"
          value={title}
          onChange={onTitleChange}
          placeholder="E.g., Introduction to Microlearning"
          className={cn(
            fieldClass,
            "h-10 w-full rounded-xl pr-3 pl-9 text-[14px] dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100",
          )}
        />
      </div>
    </div>
  );
};

export const AnimationPicker = ({
  value,
  onChange,
}: {
  value: SceneAnimation;
  onChange: (animation: SceneAnimation) => void;
}) => {
  const selected = ANIMATIONS[value];
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-ink-muted text-[13px] font-medium dark:text-neutral-400">
        Entrance animation
      </label>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              fieldClass,
              "flex h-10 w-full cursor-pointer items-center justify-between rounded-xl px-3 text-[14px] transition-[translate,border-color,box-shadow] dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100",
            )}
          >
            <span className="flex items-center gap-2">
              <selected.icon className="text-ink-muted h-4 w-4" />
              {selected.label}
            </span>
            <ChevronDown className="text-ink-faint h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[280px]">
          {objectKeys(ANIMATIONS).map((animation) => {
            const { icon: Icon, label } = ANIMATIONS[animation];
            return (
              <DropdownMenuItem
                key={animation}
                onClick={() => onChange(animation)}
                className="flex items-center justify-between py-2 text-[13px]"
              >
                <span className="flex items-center gap-2.5">
                  <Icon className="text-ink-muted h-4 w-4" />
                  {label}
                </span>
                {value === animation ? (
                  <Check className="text-link h-4 w-4" />
                ) : null}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export const ScoreSettings = ({
  spInput,
  sceneSp,
  blockSp,
  availableSp,
  onSpChange,
}: {
  spInput: number;
  sceneSp: number | null;
  blockSp: number;
  availableSp: number;
  onSpChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) => {
  return (
    <div className="flex flex-col gap-3 px-1 py-1">
      <div className="flex items-center justify-between">
        <span className="text-ink-muted text-[13px] font-medium dark:text-neutral-400">
          Scene basis SP
        </span>
        <span className="flex items-center gap-1.5">
          <input
            type="number"
            min="0"
            value={spInput === 0 && sceneSp == null ? "" : spInput}
            onChange={onSpChange}
            placeholder="5"
            className="ease-press h-8 w-16 [appearance:textfield] rounded-[10px] border-2 border-amber-200 bg-amber-50/50 px-2 text-right text-[14px] font-bold text-amber-600 shadow-[0_2px_0_0_#fde68a] transition-[border-color,box-shadow] duration-150 outline-none focus-visible:border-amber-400 focus-visible:ring-4 focus-visible:ring-amber-500/20 dark:border-amber-800 dark:bg-amber-900/10 dark:text-amber-400 dark:shadow-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <small className="font-semibold text-amber-500/70">SP</small>
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-ink-muted text-[13px] font-medium dark:text-neutral-400">
          Question blocks
        </span>
        <strong className="text-amber-600">{blockSp} SP</strong>
      </div>
      <div className="border-hairline flex items-center justify-between border-t-2 pt-2 dark:border-neutral-800/60">
        <span className="text-ink text-[13px] font-semibold dark:text-neutral-300">
          Total available
        </span>
        <strong className="text-amber-600">{availableSp} SP</strong>
      </div>
      <p className="text-ink-faint text-[11px]">
        Scene basis SP is awarded on completion. Set block SP via the ⚙ gear on
        each question block.
      </p>
    </div>
  );
};

export function SceneTabFields(props: {
  title: string;
  animation: SceneAnimation;
  spInput: number;
  sceneSp: number | null;
  blockSp: number;
  availableSp: number;
  onTitleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSpChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onAnimationChange: (animation: SceneAnimation) => void;
}) {
  return (
    <>
      <SceneConfiguration
        title={props.title}
        onTitleChange={props.onTitleChange}
      />
      <div className="bg-hairline h-px w-full dark:bg-neutral-800/60" />
      <div>
        <div className="mb-5 flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-[8px] bg-amber-500/10 dark:bg-amber-500/20">
            <Sparkles className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className="text-ink text-[14px] font-bold dark:text-neutral-100">
            Experience
          </h3>
        </div>
        <div className="flex flex-col gap-5">
          <AnimationPicker
            value={props.animation}
            onChange={props.onAnimationChange}
          />
          <ScoreSettings
            spInput={props.spInput}
            sceneSp={props.sceneSp}
            blockSp={props.blockSp}
            availableSp={props.availableSp}
            onSpChange={props.onSpChange}
          />
        </div>
      </div>
    </>
  );
}
