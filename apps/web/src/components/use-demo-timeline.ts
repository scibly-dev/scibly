"use client";

import { useEffect, useRef } from "react";

const CANCELLED = Symbol("demo-timeline-cancelled");

export function useDemoTimeline(
  active: boolean,
  script: (wait: (ms: number) => Promise<void>) => Promise<void>,
) {
  const scriptRef = useRef(script);
  useEffect(() => {
    scriptRef.current = script;
  });

  useEffect(() => {
    if (!active) return;

    let cancelled = false;
    const pending = new Map<number, (reason: unknown) => void>();

    const wait = (ms: number) =>
      new Promise<void>((resolve, reject) => {
        if (cancelled) {
          reject(CANCELLED);
          return;
        }

        const id = window.setTimeout(() => {
          pending.delete(id);
          resolve();
        }, ms);
        pending.set(id, reject);
      });

    void scriptRef.current(wait).catch((error: unknown) => {
      if (error !== CANCELLED) throw error;
    });

    return () => {
      cancelled = true;
      for (const [id, reject] of pending) {
        window.clearTimeout(id);
        reject(CANCELLED);
      }
      pending.clear();
    };
  }, [active]);
}
