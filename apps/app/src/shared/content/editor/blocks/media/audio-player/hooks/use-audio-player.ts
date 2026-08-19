"use client";

import { type icons } from "lucide-react";
import { useCallback, useRef, useState } from "react";

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;
export type Speed = (typeof SPEEDS)[number];

export const SKIP_SECONDS = 10;

export function formatTime(seconds: number): string {
  if (!isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

type AudioSnapshot = {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  speed: Speed;
};

const INITIAL_SNAPSHOT: AudioSnapshot = {
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  isMuted: false,
  speed: 1,
};

function snapshotFromElement(el: HTMLAudioElement): AudioSnapshot {
  return {
    isPlaying: !el.paused && !el.ended,
    currentTime: el.currentTime,
    duration: isFinite(el.duration) ? el.duration : 0,
    volume: el.volume,
    isMuted: el.muted,
    speed: SPEEDS.find((speed) => speed === el.playbackRate) ?? 1,
  };
}

type UseAudioPlayerProps = {
  onAudioError: () => void;
  onLoaded: () => void;
};

export function useAudioPlayer({
  onAudioError,
  onLoaded,
}: UseAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const hasNotifiedLoaded = useRef(false);

  const [snapshot, setSnapshot] = useState<AudioSnapshot>(INITIAL_SNAPSHOT);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const sync = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    setSnapshot(snapshotFromElement(el));
  }, []);

  const { isPlaying, currentTime, duration, volume, isMuted, speed } = snapshot;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const volumeIconName: keyof typeof icons =
    isMuted || volume === 0 ? "VolumeX" : volume < 0.5 ? "Volume1" : "Volume2";

  const onTimeUpdate = () => {
    if (!isDragging) sync();
  };

  const onEnded = () => {
    const el = audioRef.current;
    if (el) el.currentTime = 0;
    sync();
  };

  const onWaiting = () => setIsBuffering(true);

  const onCanPlay = () => {
    setIsBuffering(false);
    if (!hasNotifiedLoaded.current) {
      hasNotifiedLoaded.current = true;
      onLoaded();
    }
  };

  const handleError = () => {
    setIsBuffering(false);
    onAudioError();
  };

  const togglePlay = async () => {
    const el = audioRef.current;
    if (!el) return;
    if (!el.paused) {
      el.pause();
    } else {
      try {
        await el.play();
      } catch {}
    }
  };

  const skip = (delta: number) => {
    const el = audioRef.current;
    if (!el || !el.duration) return;
    el.currentTime = Math.max(0, Math.min(el.duration, el.currentTime + delta));
    sync();
  };

  const restart = () => {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = 0;
    sync();
  };

  const cycleSpeed = () => {
    const el = audioRef.current;
    if (!el) return;
    const idx = SPEEDS.findIndex((speed) => speed === el.playbackRate);
    el.playbackRate = SPEEDS[(idx + 1) % SPEEDS.length] ?? 1;
  };

  const toggleMute = () => {
    const el = audioRef.current;
    if (!el) return;
    el.muted = !el.muted;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const el = audioRef.current;
    if (!el) return;
    const val = parseFloat(e.target.value);
    el.volume = val;
    el.muted = val === 0;
  };

  const seekToClientX = (clientX: number) => {
    const el = audioRef.current;
    const bar = progressRef.current;
    if (!el || !bar || !el.duration) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    el.currentTime = ratio * el.duration;
    sync();
  };

  const handleSeekPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    seekToClientX(e.clientX);
  };

  const handleSeekPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    seekToClientX(e.clientX);
  };

  const handleSeekPointerUp = () => {
    setIsDragging(false);
  };

  return {
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
    audioEventProps: {
      onLoadedMetadata: sync,
      onTimeUpdate,
      onEnded,
      onWaiting,
      onCanPlay,
      onError: handleError,
      onPlay: sync,
      onPause: sync,
      onRateChange: sync,
      onVolumeChange: sync,
    },
    controls: {
      togglePlay,
      skip,
      restart,
      cycleSpeed,
      toggleMute,
      handleVolumeChange,
    },
    seekProps: {
      onPointerDown: handleSeekPointerDown,
      onPointerMove: handleSeekPointerMove,
      onPointerUp: handleSeekPointerUp,
    },
  };
}
