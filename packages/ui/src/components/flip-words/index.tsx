"use client";

import { cn } from "@scibly/ui/utils";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";

interface FlipWordsProps {
  words: string[];
  duration?: number;
  className?: string;
}

export function FlipWords({
  words,
  duration = 3000,
  className,
}: FlipWordsProps) {
  const reduceMotion = useReducedMotion();
  const [currentWord, setCurrentWord] = useState(words[0] ?? "");
  const [isAnimating, setIsAnimating] = useState(false);
  const [cycleCount, setCycleCount] = useState(0);

  const startAnimation = useCallback(() => {
    const currentIndex = words.indexOf(currentWord);
    setCurrentWord(words[currentIndex + 1] ?? words[0] ?? "");
    setIsAnimating(true);
    setCycleCount((count) => count + 1);
  }, [currentWord, words]);

  useEffect(() => {
    if (
      reduceMotion ||
      isAnimating ||
      words.length < 2 ||
      cycleCount >= words.length - 1
    )
      return;

    const timeout = window.setTimeout(startAnimation, duration);
    return () => window.clearTimeout(timeout);
  }, [
    cycleCount,
    duration,
    isAnimating,
    reduceMotion,
    startAnimation,
    words.length,
  ]);

  return (
    <span
      className={cn("relative inline-grid align-baseline text-left", className)}
    >
      {words.map((word) => (
        <span
          key={word}
          aria-hidden
          className="invisible col-start-1 row-start-1"
        >
          {word}
        </span>
      ))}

      <AnimatePresence
        initial={!reduceMotion}
        onExitComplete={() => setIsAnimating(false)}
      >
        <motion.span
          key={currentWord}
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 10 }}
          exit={
            reduceMotion
              ? { opacity: 1 }
              : {
                  opacity: 0,
                  y: -40,
                  x: 40,
                  filter: "blur(8px)",
                  scale: 1.35,
                }
          }
          className="col-start-1 row-start-1 inline-block text-left"
        >
          {currentWord.split(" ").map((word, wordIndex, wordList) => (
            <motion.span
              key={`${word}-${wordIndex}`}
              initial={
                reduceMotion
                  ? false
                  : { opacity: 0, y: 10, filter: "blur(8px)" }
              }
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{
                delay: reduceMotion ? 0 : wordIndex * 0.3,
                duration: reduceMotion ? 0 : 0.3,
              }}
              className="inline-block whitespace-nowrap"
            >
              {word.split("").map((letter, letterIndex) => (
                <motion.span
                  key={`${letter}-${letterIndex}`}
                  initial={
                    reduceMotion
                      ? false
                      : { opacity: 0, y: 10, filter: "blur(8px)" }
                  }
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{
                    delay: reduceMotion
                      ? 0
                      : wordIndex * 0.3 + letterIndex * 0.05,
                    duration: reduceMotion ? 0 : 0.2,
                  }}
                  className="inline-block"
                >
                  {letter}
                </motion.span>
              ))}
              {wordIndex < wordList.length - 1 ? (
                <span className="inline-block">&nbsp;</span>
              ) : null}
            </motion.span>
          ))}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
