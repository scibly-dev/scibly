"use client";

export function ThinkingDots() {
  return (
    <div className="flex items-center gap-1 py-1">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[hsl(var(--section-accent)/0.55)] [animation-delay:0ms]" />
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[hsl(var(--section-accent)/0.55)] [animation-delay:150ms]" />
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[hsl(var(--section-accent)/0.55)] [animation-delay:300ms]" />
    </div>
  );
}
