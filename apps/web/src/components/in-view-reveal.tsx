"use client";

import { useEffect, useRef, useState } from "react";

import { useMediaQuery } from "./use-media-query";

export function useInViewOnce<T extends HTMLElement = HTMLElement>(
  amount = 0.12,
  rootMargin = "0px",
) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const prefersReducedMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (
      typeof window.IntersectionObserver === "undefined" ||
      prefersReducedMotion
    ) {
      let cancelled = false;
      queueMicrotask(() => {
        if (!cancelled) setInView(true);
      });
      return () => {
        cancelled = true;
      };
    }

    const observer = new window.IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: amount, rootMargin },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [amount, rootMargin]);

  return { ref, inView } as const;
}

export function usePrefersReducedMotion() {
  return useMediaQuery("(prefers-reduced-motion: reduce)") ?? false;
}
