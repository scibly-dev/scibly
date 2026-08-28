import { Mic, X } from "lucide-react";

import { PRODUCT_INK } from "@/app/[lang]/components/marketing-tokens";
import { SciblyMark } from "@/components/brand-logo";

import { enter } from "../mock/mock-theme";
import { type InterviewDictionary } from "./i18n/knowledge-sources.types";
import { INTERVIEW_TONE } from "./knowledge-sources-tones";

const WAVEFORM_HEIGHTS = [5, 10, 14, 8, 12, 6, 9];

export function InterviewCanvas({ t }: { t: InterviewDictionary }) {
  return (
    <div
      className="relative flex h-[328px] flex-col items-center justify-center gap-3 overflow-hidden rounded-[14px] px-6 text-center"
      style={{ backgroundColor: PRODUCT_INK }}
      aria-hidden
    >
      <span className="absolute top-3.5 left-3.5 size-1.5 animate-pulse rounded-full bg-[#ff5c5c]" />
      <span className="absolute top-3 right-3.5 font-mono text-[11px] font-medium text-white/45 tabular-nums">
        {t.timer}
      </span>

      <div className="relative flex items-center justify-center">
        <span
          className="absolute size-20 rounded-[26px] opacity-50 blur-xl"
          style={{ backgroundColor: INTERVIEW_TONE.lipColor }}
        />
        <span className="relative flex size-16 items-center justify-center rounded-[20px] bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
          <SciblyMark size={34} alt="" />
        </span>
      </div>

      <div className="flex flex-col gap-0.5">
        <span className="text-[15px] font-bold text-white">{t.aiName}</span>
        <span className="text-[12.5px] font-medium text-white/55">
          {t.listeningLabel}
        </span>
      </div>

      <div className="flex h-5 items-end gap-1">
        {WAVEFORM_HEIGHTS.map((height, index) => (
          <span
            key={index}
            className="w-[3px] animate-pulse rounded-full"
            style={{
              height: height + 4,
              backgroundColor: INTERVIEW_TONE.lipColor,
              animationDelay: `${index * 0.13}s`,
            }}
          />
        ))}
      </div>

      <p
        data-bento-anim
        className="m-0 max-w-[30ch] rounded-[14px] border border-white/12 bg-white/[0.07] px-4 py-2.5 text-[13px] leading-[1.45] font-medium text-white/90"
        style={enter("sc-catch", 480)}
      >
        {t.question}
      </p>

      <div className="mt-0.5 flex items-center gap-2.5">
        <span className="flex size-9 items-center justify-center rounded-full bg-white/10 text-white">
          <Mic size={15} strokeWidth={2.2} />
        </span>
        <span className="flex size-9 items-center justify-center rounded-full bg-[#ef4a4a] text-white">
          <X size={15} strokeWidth={2.6} />
        </span>
      </div>
    </div>
  );
}
