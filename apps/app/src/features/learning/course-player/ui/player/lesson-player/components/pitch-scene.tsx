"use client";

import { usePostHog } from "@scibly/observability/client";
import { routes } from "@scibly/routes";
import Logo, { SciblyMark } from "@scibly/ui/marketing/logo";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import { Check, FileText } from "lucide-react";
import { useEffect, useState } from "react";

import { useTranslation } from "@/i18n/hooks/use-translation";

import { SceneViewportShell } from "./scene-viewport-shell";

// Opens in a new tab so it never navigates an embed's host frame away.
const PITCH_CTA_URL = `${routes.app.auth.signUp}?ref=course-pitch`;

const POP = { type: "spring", stiffness: 380, damping: 26 } as const;

const FLOATING_DOTS = [
  "bg-blue-500/30 size-3 -left-6 top-0 [animation-duration:5s]",
  "bg-emerald-400/30 size-2 -right-4 top-14 [animation-duration:7s]",
  "bg-amber-400/30 size-2.5 -left-2 bottom-10 [animation-duration:6s]",
  "bg-blue-300/40 size-4 -right-8 -bottom-2 [animation-duration:8s]",
] as const;

// The pitch repeats across long courses, so it plays out in under 3s with no
// required input and the footer skip available the entire time.
type Step = "doc" | "processing" | "card" | "graded";

export function PitchScene() {
  const { translations } = useTranslation("publicCourse");
  const posthog = usePostHog();
  const [step, setStep] = useState<Step>("doc");

  useEffect(() => {
    posthog.capture("pitch_scene_impression");
  }, [posthog]);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep("processing"), 1000),
      setTimeout(() => setStep("card"), 1900),
      setTimeout(() => setStep("graded"), 2600),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const t = translations.pitch;
  const graded = step === "graded";

  return (
    <SceneViewportShell>
      <MotionConfig reducedMotion="user">
        <div className="relative mx-auto flex w-full max-w-sm flex-col items-center gap-4 px-4">
          {FLOATING_DOTS.map((dot) => (
            <span
              key={dot}
              aria-hidden
              className={`absolute animate-pulse rounded-full ${dot}`}
            />
          ))}
          <div
            aria-hidden
            className="relative h-40 w-full perspective-[1000px]"
          >
            <AnimatePresence mode="wait" initial={false}>
              {step === "doc" || step === "processing" ? (
                <motion.div
                  key="doc"
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0, rotate: -2 }}
                  exit={{ rotateY: 90, opacity: 0 }}
                  transition={POP}
                  className={`bg-card absolute inset-0 flex flex-col gap-2 overflow-hidden rounded-2xl border p-4 text-left shadow-sm transition-colors duration-300 ${
                    step === "processing"
                      ? "border-blue-500/70"
                      : "border-border"
                  }`}
                >
                  <span className="text-muted-foreground flex items-center gap-1.5 text-[10px] font-medium">
                    <FileText className="size-3" />
                    {t.filename}
                  </span>
                  <p className="text-foreground/80 text-[11px] leading-snug font-bold">
                    {t.demo.question}
                  </p>
                  <div className="bg-muted h-1.5 w-full rounded" />
                  <div className="bg-muted h-1.5 w-11/12 rounded" />
                  <ul className="text-muted-foreground flex flex-col gap-1 text-[10px] leading-snug">
                    <li className="flex gap-1.5">
                      <span>•</span>
                      {t.demo.optionA}
                    </li>
                    <li className="flex gap-1.5">
                      <span>•</span>
                      {t.demo.optionB}
                    </li>
                  </ul>
                  <div className="bg-muted h-1.5 w-2/3 rounded" />
                  {step === "processing" && (
                    <>
                      <motion.div
                        initial={{ y: -48 }}
                        animate={{ y: 176 }}
                        transition={{ duration: 0.8, ease: "easeInOut" }}
                        className="pointer-events-none absolute inset-x-0 top-0 h-12 bg-linear-to-b from-transparent via-blue-500/25 to-transparent"
                      />
                      <motion.span
                        initial={{ scale: 0, rotate: -8 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={POP}
                        className="bg-card absolute top-2 right-2 rounded-full border border-blue-500/60 px-2 py-0.5 shadow-sm"
                      >
                        <span className="flex items-center gap-1">
                          <SciblyMark className="size-3" />
                          <Logo className="text-[10px] tracking-[-0.03em]" />
                        </span>
                      </motion.span>
                    </>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="card"
                  initial={{ rotateY: -90, opacity: 0 }}
                  animate={{ rotateY: 0, opacity: 1 }}
                  transition={POP}
                  className="absolute inset-0 flex flex-col gap-2 rounded-2xl border-2 border-blue-500 bg-white p-4 text-left shadow-[0_5px_0_0_var(--color-blue-600)]"
                >
                  <div className="-mx-4 -mt-4 flex items-center justify-between rounded-t-[14px] bg-blue-500 px-4 py-2">
                    <span className="flex items-center gap-1.5">
                      <SciblyMark className="size-4" />
                      <Logo className="text-sm tracking-[-0.03em] text-white" />
                    </span>
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/30">
                      <motion.div
                        initial={{ width: "55%" }}
                        animate={{ width: graded ? "100%" : "55%" }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="h-full rounded-full bg-white"
                      />
                    </div>
                  </div>
                  <p className="text-[13px] leading-snug font-semibold">
                    {t.demo.question}
                  </p>
                  <div
                    className={`flex h-8 items-center gap-2 rounded-lg border px-2.5 transition-colors duration-300 ${
                      graded
                        ? "border-emerald-500/60 bg-emerald-500/10"
                        : "border-border bg-card"
                    }`}
                  >
                    <span
                      className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition-colors duration-300 ${
                        graded
                          ? "bg-emerald-500 text-white"
                          : "bg-blue-100 text-blue-600"
                      }`}
                    >
                      A
                    </span>
                    <span className="flex-1 truncate text-[11px] font-medium">
                      {t.demo.optionA}
                    </span>
                    {graded && (
                      <motion.span
                        initial={{ scale: 0, rotate: -30 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={POP}
                        className="flex size-4 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white"
                      >
                        <Check className="size-3" strokeWidth={3} />
                      </motion.span>
                    )}
                  </div>
                  <div className="border-border bg-card flex h-8 items-center gap-2 rounded-lg border px-2.5">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-600">
                      B
                    </span>
                    <span className="text-muted-foreground flex-1 truncate text-[11px] font-medium">
                      {t.demo.optionB}
                    </span>
                  </div>
                  {graded && (
                    <motion.span
                      initial={{ scale: 0, rotate: -12 }}
                      animate={{ scale: 1, rotate: 6 }}
                      transition={POP}
                      className="text-ink absolute -top-3 -right-2 rounded-full bg-[#ffc800] px-2.5 py-1 text-xs font-bold shadow-[0_2px_0_0_#b87f02]"
                    >
                      +10 SP
                    </motion.span>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...POP, delay: 1.6 }}
            className="flex flex-col items-center gap-2 text-center"
          >
            <h2 className="text-xl font-semibold text-balance">{t.title}</h2>
            <p className="text-muted-foreground text-sm text-balance">
              {t.message}
            </p>
            <motion.a
              href={PITCH_CTA_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => posthog.capture("pitch_scene_cta_click")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.96 }}
              className="mt-1 rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-bold text-white shadow-[0_4px_0_0_var(--color-blue-600)] active:translate-y-1 active:shadow-none"
            >
              {t.cta}
            </motion.a>
          </motion.div>
        </div>
      </MotionConfig>
    </SceneViewportShell>
  );
}
