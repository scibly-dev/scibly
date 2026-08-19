import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";

import { useTranslation } from "@/i18n/hooks/use-translation";

interface SPAnimationProps {
  show: boolean;
  sp: number;
}

export const PointsPill = ({ sp, earned }: { sp: number; earned: string }) => (
  <div className="border-hairline relative flex items-center gap-4 overflow-hidden rounded-full border-2 bg-white px-6 py-3 shadow-[0_4px_0_0_var(--color-lip)] dark:border-white/10 dark:bg-neutral-900/80">
    <motion.div
      initial={{ x: "-150%" }}
      animate={{ x: "200%" }}
      transition={{ duration: 1.5, ease: "easeInOut", delay: 0.1 }}
      className="absolute inset-0 z-10 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/60 to-transparent dark:via-white/10"
    />
    <motion.div
      initial={{ scale: 0, rotate: -45 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{
        type: "spring",
        damping: 12,
        stiffness: 250,
        delay: 0.1,
      }}
      className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[#ffc800] shadow-[0_3px_0_0_#b87f02,inset_0_2px_0_0_rgba(255,255,255,0.35)]"
    >
      <Sparkles className="h-5 w-5 text-white" strokeWidth={2.5} />
    </motion.div>
    <div className="flex flex-col pr-2">
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.15, duration: 0.3 }}
        className="flex items-baseline gap-1.5"
      >
        <span className="text-2xl font-extrabold tracking-tight text-[#925f04] dark:text-amber-400">
          +{sp}
        </span>
        <span className="text-lg font-extrabold tracking-tight text-[#925f04] dark:text-amber-400">
          SP
        </span>
      </motion.div>
      <motion.span
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className="text-[10px] font-bold tracking-[0.2em] text-neutral-400 uppercase dark:text-neutral-500"
      >
        {earned}
      </motion.span>
    </div>
  </div>
);

export function SPAnimation({ show, sp }: SPAnimationProps) {
  const { translations: t } = useTranslation("learningPlayer");
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ type: "spring", damping: 22, stiffness: 400 }}
          className="pointer-events-none absolute inset-0 z-[200] flex items-center justify-center"
        >
          <div className="relative flex flex-col items-center justify-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 1 }}
              animate={{ scale: 2.5, opacity: 0 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="absolute h-20 w-20 rounded-full border border-amber-500/40 dark:border-amber-400/40"
            />
            <motion.div
              initial={{ scale: 0.8, opacity: 1 }}
              animate={{ scale: 3.5, opacity: 0 }}
              transition={{ duration: 1.5, ease: "easeOut", delay: 0.1 }}
              className="absolute h-20 w-20 rounded-full border border-amber-500/20 dark:border-amber-400/20"
            />

            <PointsPill sp={sp} earned={t.spAnimation.earned} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
