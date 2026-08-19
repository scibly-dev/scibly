"use client";

import { useEffect } from "react";

import { registerUxTextAnswerHandler } from "./ux-text-answer-bridge";

// Offers this card as the destination for text typed into the chat composer, but only while it can actually answer — a card that is read-only, submitting, or waiting on the agent must not swallow what the author typed.
export function useUxTextAnswer({
  toolCallId,
  isInteractive,
  onText,
}: {
  toolCallId: string | undefined;
  isInteractive: boolean;
  onText: (text: string) => boolean;
}) {
  useEffect(() => {
    if (!toolCallId || !isInteractive) return;
    return registerUxTextAnswerHandler(toolCallId, onText);
  }, [isInteractive, onText, toolCallId]);
}
