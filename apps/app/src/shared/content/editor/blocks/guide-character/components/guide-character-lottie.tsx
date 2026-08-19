"use client";

import type { LottieRefCurrentProps } from "lottie-react";
import type { GuideCharacterReaction } from "@/shared/content/editor/blocks/guide-character/utils/guide-character-reactions";

import { cn } from "@scibly/ui/utils";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

type ReactionAnimation = {
  src: string;
  loop: boolean;
  initialSegment?: [number, number];
  holdMs?: number;
};

const REACTION_ANIMATIONS = {
  idle: { src: "/mascot/mascot-idle-lottie.json", loop: true },
  perfect: { src: "/mascot/mascot-correct-lottie.json", loop: false },
  partial: { src: "/mascot/mascot-partial-lottie.json", loop: false },
  incorrect: { src: "/mascot/mascot-incorrect-lottie.json", loop: false },
  mourning: { src: "/mascot/mascot-mourning-lottie.json", loop: true },

  celebrate: {
    src: "/mascot/mascot-celebrate-lottie.json",
    loop: false,
    initialSegment: [100, 450],
    holdMs: 500,
  },
} satisfies Record<GuideCharacterReaction, ReactionAnimation>;

const animations = new Map<GuideCharacterReaction, Promise<object>>();

function loadAnimation(reaction: GuideCharacterReaction) {
  let pending = animations.get(reaction);
  if (!pending) {
    pending = fetch(REACTION_ANIMATIONS[reaction].src).then((res) =>
      res.json(),
    );
    animations.set(reaction, pending);
  }
  return pending;
}

interface GuideCharacterLottieProps {
  reaction: GuideCharacterReaction;
  animated: boolean;
  className?: string;
}

export function GuideCharacterLottie({
  reaction,
  animated,
  className,
}: GuideCharacterLottieProps) {
  const [finished, setFinished] = useState(false);
  const [prevReaction, setPrevReaction] = useState(reaction);
  if (prevReaction !== reaction) {
    setPrevReaction(reaction);
    setFinished(false);
  }
  const displayedReaction = finished ? "idle" : reaction;
  const lottieRef = useRef<LottieRefCurrentProps | null>(null);

  const [loaded, setLoaded] = useState<{
    reaction: GuideCharacterReaction;
    data: object;
  } | null>(null);

  useEffect(() => {
    let active = true;
    void loadAnimation(displayedReaction).then((data) => {
      if (active) setLoaded({ reaction: displayedReaction, data });
    });
    return () => {
      active = false;
    };
  }, [displayedReaction]);

  const animation: ReactionAnimation | undefined = loaded
    ? REACTION_ANIMATIONS[loaded.reaction]
    : undefined;
  const holdMs = animation?.holdMs;
  useEffect(() => {
    if (!holdMs || !animated) return;
    const id = setTimeout(() => lottieRef.current?.play(), holdMs);
    return () => clearTimeout(id);
  }, [loaded, holdMs, animated]);

  if (!loaded || !animation) {
    return (
      <div className={cn("aspect-square w-full max-w-[9rem]", className)} />
    );
  }

  const { loop, initialSegment } = animation;

  return (
    <Lottie
      key={loaded.reaction}
      lottieRef={lottieRef}
      animationData={loaded.data}
      loop={loop}
      autoplay={holdMs ? false : animated}
      initialSegment={initialSegment}
      onComplete={() => {
        if (!loop) setFinished(true);
      }}
      className={cn("h-auto w-full max-w-[9rem]", className)}
    />
  );
}
