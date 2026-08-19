"use client";

import { AudioLines } from "lucide-react";

import { useTranslation } from "@/i18n/hooks/use-translation";

const WAVEFORM_HEIGHTS = [4, 10, 7, 13, 6] as const;

export const WaveformBars: React.FC = () => (
  <div className="flex items-end gap-[2px]" aria-hidden>
    {WAVEFORM_HEIGHTS.map((maxH, i) => (
      <div
        key={i}
        className="animate-waveform w-[2.5px] rounded-full bg-current"
        style={{
          animationDelay: `${i * 90}ms`,
          animationDuration: `${500 + i * 70}ms`,
          minHeight: "3px",
          maxHeight: `${maxH}px`,
        }}
      />
    ))}
  </div>
);

type AudioHeaderProps = {
  isPlaying: boolean;
  isBuffering: boolean;
};

export const AudioHeader: React.FC<AudioHeaderProps> = ({
  isPlaying,
  isBuffering,
}) => {
  const { translations } = useTranslation("editorUi");
  const t = translations.audioPlayer;

  const statusLabel = isBuffering
    ? t.loading
    : isPlaying
      ? t.playing
      : t.stopped;

  return (
    <div className="flex items-center gap-3 px-5 pt-4 pb-3">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
        {isPlaying ? (
          <WaveformBars />
        ) : (
          <AudioLines className="h-4 w-4" strokeWidth={1.5} />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-[10px] font-semibold tracking-widest text-neutral-400 uppercase dark:text-neutral-500">
          {t.label}
        </span>
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          {statusLabel}
        </span>
      </div>
    </div>
  );
};

AudioHeader.displayName = "AudioHeader";
export default AudioHeader;
