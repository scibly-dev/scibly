"use client";

import AudioHeader from "@/shared/content/editor/blocks/media/audio-player/components/audio-header";
import AudioSeekBar from "@/shared/content/editor/blocks/media/audio-player/components/audio-seek-bar";
import AudioTransportControls from "@/shared/content/editor/blocks/media/audio-player/components/audio-transport-controls";
import { useAudioPlayer } from "@/shared/content/editor/blocks/media/audio-player/hooks/use-audio-player";

type AudioPlayerUIProps = {
  src: string;
  onError: () => void;
  onLoaded: () => void;
};

export const AudioPlayerUI: React.FC<AudioPlayerUIProps> = ({
  src,
  onError,
  onLoaded,
}) => {
  const {
    audioRef,
    progressRef,
    isPlaying,
    isBuffering,
    currentTime,
    duration,
    progress,
    volume,
    isMuted,
    speed,
    isDragging,
    volumeIconName,
    audioEventProps,
    controls,
    seekProps,
  } = useAudioPlayer({ onAudioError: onError, onLoaded });

  return (
    <>
      {/* Hidden native audio element — source of truth for all playback state */}
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        {...audioEventProps}
        className="hidden"
        aria-label="Audio player"
      />

      {/* Card */}
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
        <AudioHeader isPlaying={isPlaying} isBuffering={isBuffering} />

        {/* Hairline divider */}
        <div className="mx-5 h-px bg-neutral-100 dark:bg-neutral-800" />

        <AudioSeekBar
          progress={progress}
          currentTime={currentTime}
          duration={duration}
          isDragging={isDragging}
          progressRef={progressRef}
          seekProps={seekProps}
        />

        <AudioTransportControls
          isPlaying={isPlaying}
          isBuffering={isBuffering}
          volume={volume}
          isMuted={isMuted}
          speed={speed}
          volumeIconName={volumeIconName}
          controls={controls}
        />
      </div>
    </>
  );
};

AudioPlayerUI.displayName = "AudioPlayerUI";
export default AudioPlayerUI;
