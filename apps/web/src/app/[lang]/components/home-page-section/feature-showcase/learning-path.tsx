"use client";

import {
  type AutocaptureAttributes,
  type NoAutocaptureAttributes,
} from "@scibly/observability/autocapture";
import { cn } from "@scibly/ui/utils";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "framer-motion";
import { Maximize2 } from "lucide-react";
import { type CSSProperties, type ReactNode, useRef, useState } from "react";

import {
  keyShadow,
  lipShadow,
  type Pillar,
  tint,
  washStyle,
} from "@/app/[lang]/components/marketing-tokens";
import { useMediaQuery } from "@/components/use-media-query";

export type LearningPathItem = {
  id: string;
  phase: string;
  title: string;
  visual: ReactNode;
  pillar: Pillar;

  journeyLabel?: string;
  onExpand: () => void;

  expandCapture?: AutocaptureAttributes | NoAutocaptureAttributes;
};

const expandKeyClass =
  "ease-press flex size-8 cursor-pointer items-center justify-center rounded-[10px] bg-white shadow-[0_2px_0_0_var(--key-lip),0_4px_10px_-6px_rgba(15,35,61,0.3),inset_0_1px_0_rgba(255,255,255,0.9)] transition-[translate,box-shadow] duration-100 active:translate-y-0.5 active:shadow-[inset_0_1px_2px_rgba(15,23,42,0.1)] focus-visible:ring-4 focus-visible:ring-[#0066FF]/20 focus-visible:outline-none";

function expandKeyStyle({ lipColor, accentColor }: Pillar): CSSProperties {
  return { color: accentColor, "--key-lip": lipColor };
}

export function LearningPath({
  items,
  journeyLabel,
  expandLabel,
  className,
}: {
  items: LearningPathItem[];
  journeyLabel: string;
  expandLabel: string;
  className?: string;
}) {
  const stepsRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [activeIndex, setActiveIndex] = useState(0);
  const { scrollYProgress } = useScroll({
    target: stepsRef,
    offset: ["start 50%", "end 50%"],
  });
  useMotionValueEvent(scrollYProgress, "change", (value) => {
    const nextIndex = Math.min(
      items.length - 1,
      Math.max(0, Math.floor(value * items.length)),
    );
    setActiveIndex((current) => (current === nextIndex ? current : nextIndex));
  });

  if (items.length === 0) return null;

  const activeItem = items[activeIndex];

  return (
    <div className={cn("relative", className)} data-learning-path>
      <div className="space-y-6 lg:hidden">
        {items.map((item) => (
          <MobileChapter
            key={item.id}
            item={item}
            expandLabel={expandLabel}
            isDesktop={isDesktop}
          />
        ))}
      </div>

      <div className="hidden lg:grid lg:grid-cols-[minmax(0,0.43fr)_minmax(0,0.57fr)] lg:gap-[clamp(40px,5vw,80px)]">
        <div>
          <div ref={stepsRef} className="relative">
            {items.map((item, index) => {
              const active = index === activeIndex;

              return (
                <article
                  key={item.id}
                  className="relative flex min-h-[max(62svh,560px)] items-center"
                  data-learning-path-step
                  data-active={active}
                  aria-current={active ? "step" : undefined}
                >
                  <button
                    type="button"
                    className={cn(
                      "ease-press w-full max-w-[430px] cursor-pointer rounded-[20px] px-7 py-[30px] text-left transition-[background-color,opacity,transform,box-shadow] duration-[400ms] focus-visible:ring-4 focus-visible:ring-[#0066FF]/20 focus-visible:outline-none",
                      reduceMotion && "duration-0",
                    )}
                    style={{
                      backgroundColor: active
                        ? item.pillar.softColor
                        : "rgba(255,255,255,0)",
                      boxShadow: active
                        ? `${lipShadow(item.pillar.lipColor)}, 0 8px 18px -10px rgba(15,35,61,0.28), inset 0 1px 0 rgba(255,255,255,0.8)`
                        : "none",
                      opacity: active ? 1 : 0.42,
                      transform: active ? "translateX(8px)" : "none",
                    }}
                    aria-label={`${expandLabel}: ${item.title}`}
                    onClick={item.onExpand}
                    onFocus={() => setActiveIndex(index)}
                    {...item.expandCapture}
                  >
                    <ChapterCopy item={item} />
                    <span
                      className={cn(
                        "mt-7 inline-flex items-center gap-2 text-[12px] font-semibold transition-opacity duration-300",
                        active ? "opacity-100" : "opacity-0",
                      )}
                      style={{ color: item.pillar.accentColor }}
                    >
                      {expandLabel}
                      <Maximize2 size={13} strokeWidth={2} />
                    </span>
                  </button>
                </article>
              );
            })}
          </div>
          <div className="h-[12svh]" aria-hidden />
        </div>

        <div className="relative">
          <div className="sticky top-[max(16px,calc(50vh-min(260px,45svh)))] flex h-[min(520px,90svh)] flex-col justify-center gap-3.5">
            <div className="flex h-[30px] w-full max-w-[470px] shrink-0 items-center justify-between gap-4">
              <span className="text-ink-soft text-[12.5px] font-semibold">
                {activeItem.journeyLabel ?? journeyLabel}
              </span>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5" aria-hidden>
                  {items.map((item, index) => (
                    <span
                      key={item.id}
                      className={cn(
                        "h-2 rounded-[4px] transition-[width,background-color] duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
                        reduceMotion && "duration-0",
                      )}
                      style={{
                        width: index === activeIndex ? 28 : 8,
                        backgroundColor:
                          index === activeIndex
                            ? activeItem.pillar.accentColor
                            : "rgba(100,116,139,0.22)",
                      }}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  className={expandKeyClass}
                  style={expandKeyStyle(activeItem.pillar)}
                  aria-label={`${expandLabel}: ${activeItem.title}`}
                  onClick={activeItem.onExpand}
                  {...activeItem.expandCapture}
                >
                  <Maximize2 size={14} strokeWidth={2} aria-hidden />
                </button>
              </div>
            </div>

            <div
              className="relative h-[min(415px,calc(90svh-78px))] min-h-[300px] w-full max-w-[470px]"
              data-learning-path-stage
            >
              <AnimatePresence initial={false} mode="sync">
                <motion.div
                  key={activeItem.id}
                  className="absolute inset-0 overflow-hidden rounded-[20px] border [&_[data-bento-visual]]:h-full"
                  style={washStyle(activeItem.pillar)}
                  transformTemplate={({ y }) => {
                    const offset =
                      typeof y === "number"
                        ? y
                        : Number.parseFloat(String(y ?? 0));
                    if (!offset) return "none";
                    return `translateY(${offset}px)`;
                  }}
                  initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -12 }}
                  transition={{
                    duration: reduceMotion ? 0 : 0.42,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                >
                  {isDesktop === true ? activeItem.visual : null}
                </motion.div>
              </AnimatePresence>

              {/* Pointer-only twin of the expand key above — the key carries the label */}
              <button
                type="button"
                className="absolute inset-0 z-20 cursor-pointer rounded-[20px]"
                tabIndex={-1}
                aria-hidden
                onClick={activeItem.onExpand}
                {...activeItem.expandCapture}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MobileChapter({
  item,
  expandLabel,
  isDesktop,
}: {
  item: LearningPathItem;
  expandLabel: string;
  isDesktop: boolean | undefined;
}) {
  const { softColor, lipColor } = item.pillar;

  return (
    <article
      className="relative isolate overflow-hidden rounded-[22px] border"
      style={{
        backgroundColor: tint(softColor, 38),
        borderColor: tint(lipColor, 45),
        boxShadow: `${lipShadow(lipColor)}, 0 14px 30px -18px rgba(15,35,61,0.3), inset 0 1px 0 rgba(255,255,255,0.8)`,
      }}
      data-learning-path-step
    >
      <div className="relative z-10 px-6 pt-8 pb-6 md:px-8">
        <ChapterCopy item={item} />
      </div>
      {/* Padded like the copy above it, so the preview never sits on the card edge */}
      <div className="relative h-[414px] min-h-0 pb-6 [&_[data-bento-visual]]:h-full">
        {isDesktop === false ? item.visual : null}
      </div>
      {/* Pointer-only twin of the expand key — the key carries the label */}
      <button
        type="button"
        className="absolute inset-0 z-20 cursor-pointer rounded-[inherit]"
        tabIndex={-1}
        aria-hidden
        onClick={item.onExpand}
        {...item.expandCapture}
      />
      <button
        type="button"
        className={cn(expandKeyClass, "absolute top-5 right-5 z-30")}
        style={expandKeyStyle(item.pillar)}
        aria-label={`${expandLabel}: ${item.title}`}
        onClick={item.onExpand}
        {...item.expandCapture}
      >
        <Maximize2 size={14} strokeWidth={2} aria-hidden />
      </button>
    </article>
  );
}

function ChapterCopy({ item }: { item: LearningPathItem }) {
  return (
    <>
      <div className="mb-5">
        <span
          className="inline-flex rounded-[9px] bg-white px-[13px] py-[7px] text-[11.5px] font-bold tracking-[0.002em]"
          style={{
            color: item.pillar.accentColor,
            boxShadow: keyShadow(item.pillar.lipColor),
          }}
        >
          {item.phase}
        </span>
      </div>
      <h3 className="text-ink m-0 max-w-[16ch] text-[clamp(24px,2.6vw,30px)] leading-[1.1] font-semibold tracking-[-0.026em] text-balance">
        {item.title}
      </h3>
    </>
  );
}
