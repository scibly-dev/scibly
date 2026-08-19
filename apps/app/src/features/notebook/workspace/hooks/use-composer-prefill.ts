"use client";

import { create } from "zustand";

export interface ComposerPrefillState {
  text: string | null;
  nonce: number;
  prefill: (text: string) => void;
  clear: () => void;
}

/**
 * Dev-only override for the showcase composer's default text, keyed by
 * `nonce` so setting the same text twice still forces a remount (see
 * `ChatInput`'s `defaultValue`, which only applies once per mount).
 *
 * `clear()` must run after every submitted send: the composer's `key`
 * changes (and remounts, re-reading `defaultValue`) the moment the first
 * message lands, and a stale `text` here would resurrect the just-sent turn
 * in the input instead of leaving it empty.
 */
export const useComposerPrefill = create<ComposerPrefillState>((set) => ({
  text: null,
  nonce: 0,
  prefill: (text) => set((state) => ({ text, nonce: state.nonce + 1 })),
  clear: () => set({ text: null }),
}));
