import { cn } from "@scibly/ui/utils";

import {
  notebookTimelineFrame,
  notebookTimelineInset,
  notebookTimelineScrollFade,
  notebookTimelineSurface,
} from "./notebook-shell";

export const InitialGreeting = ({
  greeting,
  visible,
}: {
  greeting: React.ReactNode;
  visible: boolean;
}) => {
  return (
    <div
      className={cn(
        "flex w-full flex-col items-center transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
        visible
          ? "max-h-32 translate-y-0 opacity-100"
          : "pointer-events-none max-h-0 -translate-y-6 overflow-hidden opacity-0",
      )}
    >
      <h1 className="text-ink text-center text-[1.75rem] leading-snug font-bold tracking-[-0.028em] md:text-[2rem] dark:text-neutral-50">
        {greeting}
      </h1>
    </div>
  );
};

export function ComposerTimeline({
  messages,
  greeting,
  controls,
  initial,
}: {
  messages: React.ReactNode;
  greeting: React.ReactNode;
  controls: React.ReactNode;
  initial: boolean;
}) {
  return (
    <div className={notebookTimelineFrame}>
      <div className={notebookTimelineInset}>
        {messages}
        <div
          className={cn(
            "relative mx-auto flex w-full max-w-3xl flex-col px-6 transition-[flex,padding,gap] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
            notebookTimelineSurface,
            initial
              ? "flex-1 items-center justify-center gap-8 pb-10"
              : cn(
                  "shrink-0 gap-0 pt-2 pb-6 before:pointer-events-none before:absolute before:-top-8 before:right-0 before:left-0 before:h-8 before:bg-gradient-to-t before:to-transparent",
                  notebookTimelineScrollFade,
                ),
          )}
        >
          <InitialGreeting greeting={greeting} visible={initial} />
          {controls}
        </div>
      </div>
    </div>
  );
}
