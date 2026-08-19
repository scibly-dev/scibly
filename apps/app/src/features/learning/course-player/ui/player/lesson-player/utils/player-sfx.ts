import type { SceneFeedbackStatus } from "./scene-feedback-summary";

import { objectKeys } from "@/lib/object-keys";

type Tone = {
  freq: number;
  start: number;
  duration: number;
  gain?: number;
  type?: "sine" | "triangle" | "sawtooth";
};

type SfxKey =
  | "perfect"
  | "partial"
  | "wrong"
  | "sceneSpEarn"
  | "lessonComplete"
  | "spCoin"
  | "spCollectStart";

const SILENT_WAV =
  "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";

const SFX_TONES = {
  perfect: [
    { freq: 523.25, start: 0, duration: 0.12, gain: 0.35 },
    { freq: 659.25, start: 0.1, duration: 0.12, gain: 0.35 },
    { freq: 783.99, start: 0.2, duration: 0.18, gain: 0.28 },
  ],
  partial: [
    { freq: 440, start: 0, duration: 0.15, gain: 0.28, type: "triangle" },
    { freq: 554.37, start: 0.12, duration: 0.2, gain: 0.22, type: "triangle" },
  ],
  wrong: [
    { freq: 220, start: 0, duration: 0.25, gain: 0.2, type: "sawtooth" },
    { freq: 185, start: 0.08, duration: 0.3, gain: 0.14, type: "sawtooth" },
  ],
  sceneSpEarn: [
    { freq: 587.33, start: 0, duration: 0.11, gain: 0.26 },
    { freq: 783.99, start: 0.09, duration: 0.16, gain: 0.24 },
    { freq: 987.77, start: 0.18, duration: 0.12, gain: 0.18, type: "triangle" },
  ],
  lessonComplete: [
    { freq: 523.25, start: 0, duration: 0.14, gain: 0.32 },
    { freq: 659.25, start: 0.1, duration: 0.14, gain: 0.32 },
    { freq: 783.99, start: 0.2, duration: 0.16, gain: 0.28 },
    { freq: 987.77, start: 0.32, duration: 0.28, gain: 0.24, type: "triangle" },
  ],
  spCoin: [
    { freq: 880, start: 0, duration: 0.06, gain: 0.2 },
    {
      freq: 1174.66,
      start: 0.03,
      duration: 0.05,
      gain: 0.14,
      type: "triangle",
    },
  ],
  spCollectStart: [
    { freq: 392, start: 0, duration: 0.1, gain: 0.24 },
    { freq: 523.25, start: 0.06, duration: 0.12, gain: 0.2 },
  ],
} satisfies Record<SfxKey, Tone[]>;

export const FEEDBACK_SFX = {
  perfect: "perfect",
  partial: "partial",
  incorrect: "wrong",
} satisfies Record<SceneFeedbackStatus, SfxKey>;

let unlockAudio: HTMLAudioElement | null = null;
const sfxCache = new Map<SfxKey, HTMLAudioElement>();

function sampleTone(tone: Tone, time: number): number {
  const elapsed = time - tone.start;
  if (elapsed < 0 || elapsed > tone.duration) return 0;

  const gain = tone.gain ?? 0.3;
  const envelope = Math.exp((-4 * elapsed) / tone.duration);
  const phase = 2 * Math.PI * tone.freq * elapsed;

  let sample: number;
  if (tone.type === "triangle") {
    sample = (2 / Math.PI) * Math.asin(Math.sin(phase));
  } else if (tone.type === "sawtooth") {
    sample = 2 * ((tone.freq * elapsed) % 1) - 1;
  } else {
    sample = Math.sin(phase);
  }

  return sample * gain * envelope;
}

function tonesToWavDataUrl(tones: Tone[]): string {
  const sampleRate = 44100;
  const totalSeconds =
    Math.max(...tones.map((tone) => tone.start + tone.duration)) + 0.05;
  const length = Math.ceil(totalSeconds * sampleRate);
  const samples = new Float32Array(length);

  for (let i = 0; i < length; i++) {
    const time = i / sampleRate;
    let value = 0;
    for (const tone of tones) {
      value += sampleTone(tone, time);
    }
    samples[i] = value;
  }

  let peak = 0;
  for (const sample of samples) {
    peak = Math.max(peak, Math.abs(sample));
  }
  if (peak > 1) {
    for (let i = 0; i < samples.length; i++) {
      samples[i] /= peak;
    }
  }

  const dataSize = samples.length * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeString = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i++) {
      view.setUint8(offset + i, value.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (const sample of samples) {
    const clamped = Math.max(-1, Math.min(1, sample));
    view.setInt16(offset, clamped * 0x7fff, true);
    offset += 2;
  }

  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }

  return `data:audio/wav;base64,${btoa(binary)}`;
}

function getSfxAudio(key: SfxKey): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;

  let audio = sfxCache.get(key);
  if (!audio) {
    audio = new Audio(tonesToWavDataUrl(SFX_TONES[key]));
    audio.preload = "auto";
    sfxCache.set(key, audio);
  }
  return audio;
}

function playAudio(audio: HTMLAudioElement): void {
  audio.currentTime = 0;
  void audio.play().catch(() => {});
}

function playSfx(key: SfxKey): void {
  const audio = getSfxAudio(key);
  if (audio) playAudio(audio);
}

export function unlockPlayerAudio(): void {
  if (typeof window === "undefined") return;

  if (!unlockAudio) {
    unlockAudio = new Audio(SILENT_WAV);
    unlockAudio.preload = "auto";
  }

  void unlockAudio
    .play()
    .then(() => {
      unlockAudio!.pause();
      unlockAudio!.currentTime = 0;
    })
    .catch(() => {});

  for (const key of objectKeys(SFX_TONES)) {
    getSfxAudio(key);
  }
}

export function playFeedbackSound(status: SceneFeedbackStatus): void {
  playSfx(FEEDBACK_SFX[status]);
}

export function playSceneSpEarnSound(): void {
  playSfx("sceneSpEarn");
}

export function playLessonCompleteSound(): void {
  playSfx("lessonComplete");
}

export function playSpCoinSound(): void {
  const template = getSfxAudio("spCoin");
  if (template) playAudio(new Audio(template.src));
}

export function playSpCollectStartSound(): void {
  playSfx("spCollectStart");
}
