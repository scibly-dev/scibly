"use client";

import Icon from "@scibly/ui/components/icon";
import { cn } from "@scibly/ui/utils";
import {
  Loader2,
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { type icons } from "lucide-react";

import { useTranslation } from "@/i18n/hooks/use-translation";
import {
  SKIP_SECONDS,
  type Speed,
} from "@/shared/content/editor/blocks/media/audio-player/hooks/use-audio-player";

type AudioTransportControlsProps = {
  isPlaying: boolean;
  isBuffering: boolean;
  volume: number;
  isMuted: boolean;
  speed: Speed;
  volumeIconName: keyof typeof icons;
  controls: {
    togglePlay: () => void;
    skip: (delta: number) => void;
    restart: () => void;
    cycleSpeed: () => void;
    toggleMute: () => void;
    handleVolumeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  };
};

export const AudioTransportControls: React.FC<AudioTransportControlsProps> = ({
  isPlaying,
  isBuffering,
  volume,
  isMuted,
  speed,
  volumeIconName,
  controls,
}) => {
  const { translations } = useTranslation("editorUi");
  const t = translations.audioPlayer;

  return (
    <div className="flex items-center px-5 pt-2 pb-4">
      {/* Left: restart + speed */}
      <div className="flex flex-1 items-center gap-1">
        <button
          onClick={controls.restart}
          className="rounded-lg p-2 text-neutral-400 transition-colors duration-150 hover:bg-neutral-100 hover:text-neutral-600 active:scale-90 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
          aria-label={t.restart}
          title={t.restart}
        >
          <RotateCcw className="h-4 w-4" strokeWidth={1.75} />
        </button>

        <button
          onClick={controls.cycleSpeed}
          className={cn(
            "rounded-md border px-2 py-0.5 text-[11px] font-medium tabular-nums transition-colors duration-150",
            speed !== 1
              ? "border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900"
              : "border-neutral-200 text-neutral-400 hover:border-neutral-300 hover:text-neutral-600 dark:border-neutral-800 dark:text-neutral-500 dark:hover:border-neutral-700 dark:hover:text-neutral-300",
          )}
          aria-label={t.playbackSpeed}
          title={t.playbackSpeed}
        >
          {speed}×
        </button>
      </div>

      {/* Center: ⏮ ▶ ⏭ */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => controls.skip(-SKIP_SECONDS)}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-neutral-500 transition-colors duration-150 hover:bg-neutral-100 hover:text-neutral-700 active:scale-90 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
          aria-label={`${t.skipBack} ${SKIP_SECONDS}s`}
          title={`${SKIP_SECONDS}s ${t.skipBack}`}
        >
          <SkipBack
            className="h-[17px] w-[17px] fill-current"
            strokeWidth={0}
          />
        </button>

        <button
          onClick={controls.togglePlay}
          disabled={isBuffering}
          className="bg-primary text-primary-foreground mx-1 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full shadow-sm transition-all duration-200 hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isBuffering ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : isPlaying ? (
            <Pause className="h-5 w-5 fill-current" strokeWidth={0} />
          ) : (
            <Play
              className="h-5 w-5 translate-x-px fill-current"
              strokeWidth={0}
            />
          )}
        </button>

        <button
          onClick={() => controls.skip(SKIP_SECONDS)}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-neutral-500 transition-colors duration-150 hover:bg-neutral-100 hover:text-neutral-700 active:scale-90 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
          aria-label={`${t.skipForward} ${SKIP_SECONDS}s`}
          title={`${SKIP_SECONDS}s ${t.skipForward}`}
        >
          <SkipForward
            className="h-[17px] w-[17px] fill-current"
            strokeWidth={0}
          />
        </button>
      </div>

      {/* Right: volume (hidden on iOS — not controllable via JS there) */}
      <div className="flex flex-1 items-center justify-end">
        {!(
          typeof navigator !== "undefined" &&
          /iP(hone|ad|od)/.test(navigator.userAgent)
        ) && (
          <div className="flex items-center gap-2">
            <button
              onClick={controls.toggleMute}
              className="rounded-lg p-1.5 text-neutral-400 transition-colors duration-150 hover:bg-neutral-100 hover:text-neutral-600 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              <Icon name={volumeIconName} className="h-4 w-4" />
            </button>

            <div className="relative h-[5px] w-16 rounded-full bg-neutral-100 dark:bg-neutral-800">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-neutral-300 transition-[width] duration-75 dark:bg-neutral-600"
                style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
              />
              <input
                type="range"
                min={0}
                max={1}
                step={0.02}
                value={isMuted ? 0 : volume}
                onChange={controls.handleVolumeChange}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                aria-label="Volume"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

AudioTransportControls.displayName = "AudioTransportControls";
export default AudioTransportControls;
