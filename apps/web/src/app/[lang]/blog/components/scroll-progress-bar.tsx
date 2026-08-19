"use client";

import useEventListener from "@scibly/lib/hooks/use-event-listener";
import { useCallback, useState } from "react";

export function ScrollProgressBar() {
  const [progress, setProgress] = useState(0);

  const handleScroll = useCallback(() => {
    const totalHeight =
      document.documentElement.scrollHeight - window.innerHeight;
    if (totalHeight > 0) {
      const scrolled = (window.scrollY / totalHeight) * 100;
      setProgress(scrolled);
    }
  }, []);

  useEventListener("scroll", handleScroll, undefined, { passive: true });

  return (
    <div className="bg-lip fixed top-0 right-0 left-0 z-50 h-[3px] w-full">
      <div
        className="h-full bg-[#0066FF] transition-[width] duration-75 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
