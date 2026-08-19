"use client";

import { cn } from "@scibly/ui/utils";
import { GitBranch } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  chosenKey,
  IDLE_KEY,
  keyStyle,
} from "@/app/[lang]/components/marketing-tokens";
import {
  useInViewOnce,
  usePrefersReducedMotion,
} from "@/components/in-view-reveal";

import { type OpenSourceDictionary } from "./i18n/open-source.types";
import {
  MONO_FONT,
  SELF_HOST_STEPS,
  type TerminalLine,
  toSelfHostStepId,
  transcriptOf,
} from "./open-source-facts";

const PROMPT_GREEN = "#a3e163";
const CHECK_GREEN = "#58cc02";
const URL_BLUE = "#94c4ff";

const TYPE_MS_PER_CHAR = 24;
const TYPE_START_MS = 160;
const LINE_STAGGER_MS = 150;
const STEP_HOLD_MS = 1900;

export function SelfHostTerminal({ t }: { t: OpenSourceDictionary }) {
  const { ref, inView } = useInViewOnce<HTMLDivElement>(0.3);
  const prefersReducedMotion = usePrefersReducedMotion();

  const steps = useMemo(
    () =>
      t.steps.flatMap((step) => {
        const kind = toSelfHostStepId(step.kind);
        return kind ? [{ ...step, ...SELF_HOST_STEPS[kind], kind }] : [];
      }),
    [t.steps],
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoplaying, setIsAutoplaying] = useState(true);

  const active = steps[activeIndex] ?? steps[0];
  const lastIndex = steps.length - 1;

  const typeMs = active ? active.command.length * TYPE_MS_PER_CHAR : 0;
  const outroMs = active
    ? TYPE_START_MS + typeMs + (active.lines.length + 1) * LINE_STAGGER_MS
    : 0;

  useEffect(() => {
    if (!inView || !isAutoplaying || prefersReducedMotion) return;
    if (activeIndex >= lastIndex) return;

    const timer = window.setTimeout(
      () => setActiveIndex((index) => index + 1),
      outroMs + STEP_HOLD_MS,
    );
    return () => window.clearTimeout(timer);
  }, [
    inView,
    isAutoplaying,
    prefersReducedMotion,
    activeIndex,
    lastIndex,
    outroMs,
  ]);

  if (!active) return null;

  return (
    <div
      ref={ref}
      className={cn(
        "sc-term grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:items-stretch",
        inView && "sc-term-ready",
      )}
    >
      <div
        className="relative overflow-hidden rounded-[22px] border-2"
        style={{
          backgroundImage: [
            "radial-gradient(circle, rgba(255,255,255,0.055) 1px, transparent 1.2px)",
            "linear-gradient(158deg, #1c2760 0%, #131c46 54%, #0c1236 100%)",
          ].join(", "),
          backgroundSize: "18px 18px, auto",
          borderColor: "rgba(255,255,255,0.14)",
          boxShadow:
            "0 5px 0 0 #080d28, 0 34px 68px -46px rgba(19,28,70,0.85), inset 0 1px 0 rgba(255,255,255,0.1)",
        }}
      >
        <div className="flex items-center gap-3 border-b border-white/10 bg-white/[0.035] px-4 py-3">
          <span className="flex shrink-0 items-center gap-[6px]" aria-hidden>
            <Dot color="#ff5f57" />
            <Dot color="#febc2e" />
            <Dot color="#28c840" />
          </span>

          <span
            className="min-w-0 flex-1 truncate text-[12px] leading-none text-white/45"
            style={{ fontFamily: MONO_FONT }}
          >
            scibly — bash
          </span>

          <span
            className="hidden shrink-0 items-center gap-1.5 rounded-[7px] border border-white/10 bg-white/[0.06] px-2 py-1 text-[11px] leading-none text-white/50 sm:inline-flex"
            style={{ fontFamily: MONO_FONT }}
            aria-hidden
          >
            <GitBranch size={11} />
            main
          </span>
        </div>

        {/* Keyed on the step so switching remounts the lines and replays their CSS timeline. */}
        <div
          key={active.kind}
          className="min-h-[206px] overflow-x-auto px-5 py-4 text-[11.5px] leading-[1.9] sm:min-h-[224px] sm:text-[13px]"
          style={{ fontFamily: MONO_FONT }}
          aria-hidden
        >
          {/* `div`, not `p`: the app's unlayered `:where(p, li, dd) { text-wrap: pretty }` outranks `whitespace-nowrap`. */}
          <div className="m-0 whitespace-nowrap">
            <span style={{ color: PROMPT_GREEN }}>$</span>{" "}
            <span
              data-term-command
              style={{
                color: "#ffffff",
                "--sc-type-width": `${active.command.length}ch`,
                "--sc-type-steps": active.command.length,
                "--sc-type-duration": `${typeMs}ms`,
              }}
            >
              {active.command}
            </span>
          </div>

          {active.lines.map((line, index) => (
            <OutputLine
              key={line.text}
              line={line}
              delayMs={TYPE_START_MS + typeMs + index * LINE_STAGGER_MS}
            />
          ))}

          <div
            data-term-anim
            className="m-0 mt-3 whitespace-nowrap text-white/35"
            style={{
              "--sc-line-delay": `${
                TYPE_START_MS + typeMs + active.lines.length * LINE_STAGGER_MS
              }ms`,
            }}
          >
            # {active.note}
          </div>
        </div>

        <ol className="sr-only" aria-label={t.terminal.transcriptLabel}>
          {steps.map((step) => (
            <li key={step.kind}>
              {step.label}: <code>{step.command}</code> — {transcriptOf(step)} —{" "}
              {step.note}
            </li>
          ))}
        </ol>
      </div>

      <ol
        className="m-0 grid list-none grid-cols-1 gap-2.5 p-0 sm:grid-cols-3 lg:h-full lg:grid-cols-1 lg:grid-rows-3"
        aria-label={t.terminal.stepsLabel}
      >
        {steps.map((step, index) => {
          const isActive = index === activeIndex;
          const Icon = step.icon;

          return (
            <li key={step.kind} className="flex">
              <button
                type="button"
                onClick={() => {
                  setIsAutoplaying(false);
                  setActiveIndex(index);
                }}
                aria-pressed={isActive}
                className={cn(
                  "ease-press group flex w-full cursor-pointer items-start gap-3 rounded-[16px] border-2 px-3.5 py-3 text-left transition-[translate,box-shadow,border-color,background-color] duration-150 lg:items-center",
                  "focus-visible:ring-4 focus-visible:ring-[#0066FF]/25 focus-visible:outline-none",
                  isActive
                    ? "translate-y-0"
                    : "hover:-translate-y-[1px] active:translate-y-[3px] active:shadow-none",
                )}
                style={keyStyle(
                  isActive ? chosenKey(step.pillar) : IDLE_KEY,
                  isActive ? 4 : 3,
                )}
              >
                <span
                  className="mt-[1px] flex size-7 shrink-0 items-center justify-center rounded-[9px] transition-colors duration-150"
                  style={{
                    backgroundColor: isActive
                      ? step.pillar.softColor
                      : "#f1f4fa",
                    color: isActive ? step.pillar.accentColor : "#8a93a8",
                  }}
                  aria-hidden
                >
                  <Icon size={15} strokeWidth={2} />
                </span>

                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="flex items-baseline gap-2">
                    <span className="text-[14.5px] leading-tight font-semibold tracking-[-0.012em]">
                      {step.label}
                    </span>
                    <span
                      className="ml-auto text-[10.5px] leading-none opacity-45"
                      style={{ fontFamily: MONO_FONT }}
                      aria-hidden
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "mt-1 text-[12.5px] leading-[1.4] text-pretty",
                      isActive ? "opacity-75" : "text-[#7b8499]",
                    )}
                  >
                    {step.caption}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function OutputLine({
  line,
  delayMs,
}: {
  line: TerminalLine;
  delayMs: number;
}) {
  return (
    <div
      data-term-anim
      className="m-0 flex items-baseline gap-2 whitespace-nowrap"
      style={{ "--sc-line-delay": `${delayMs}ms` }}
    >
      {line.tone === "ok" ? (
        <span className="shrink-0" style={{ color: CHECK_GREEN }}>
          ✔
        </span>
      ) : (
        <span className="shrink-0 text-white/20">·</span>
      )}

      {line.tone === "port" ? (
        <>
          <span className="inline-block w-[7ch] shrink-0 text-white/45">
            {line.text}
          </span>
          <span style={{ color: URL_BLUE }}>{line.value}</span>
        </>
      ) : (
        <span className="text-white/60">{line.text}</span>
      )}
    </div>
  );
}

function Dot({ color }: { color: string }) {
  return (
    <span
      className="size-[9px] rounded-full"
      style={{ backgroundColor: color, opacity: 0.85 }}
    />
  );
}
