"use client";

import { cn } from "@scibly/ui/utils";

import { formatTime } from "@/shared/content/editor/blocks/media/audio-player/hooks/use-audio-player";

type AudioSeekBarProps = {
  progress: number;
  currentTime: number;
  duration: number;
  isDragging: boolean;
  progressRef: React.RefObject<HTMLDivElement | null>;
  seekProps: {
    onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
    onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
    onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => void;
  };
};

export const AudioSeekBar: React.FC<AudioSeekBarProps> = ({
  progress,
  currentTime,
  duration,
  isDragging,
  progressRef,
  seekProps,
}) => (
  <div className="px-5 pt-3.5 pb-1">
    <div
      ref={progressRef}
      {...seekProps}
      className="group/progress relative h-[5px] w-full cursor-pointer rounded-full bg-neutral-100 dark:bg-neutral-800"
      role="progressbar"
      aria-valuenow={currentTime}
      aria-valuemin={0}
      aria-valuemax={duration}
    >
      {/* Fill */}
      <div
        className="absolute inset-y-0 left-0 rounded-full bg-neutral-300 transition-[width] duration-75 dark:bg-neutral-600"
        style={{ width: `${progress}%` }}
      />
      {/* Thumb */}
      <div
        className={cn(
          "absolute top-1/2 h-[13px] w-[13px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-neutral-700 shadow-sm ring-1 ring-neutral-200 transition-opacity duration-150 dark:border-neutral-900 dark:bg-neutral-300 dark:ring-neutral-700",
          isDragging
            ? "opacity-100"
            : "opacity-0 group-hover/progress:opacity-100",
        )}
        style={{ left: `${progress}%` }}
      />
    </div>

    {/* Timestamps */}
    <div className="mt-1.5 flex justify-between">
      <span className="font-mono text-[10px] text-neutral-400 tabular-nums">
        {formatTime(currentTime)}
      </span>
      <span className="font-mono text-[10px] text-neutral-400 tabular-nums">
        {formatTime(duration)}
      </span>
    </div>
  </div>
);

AudioSeekBar.displayName = "AudioSeekBar";
export default AudioSeekBar;
