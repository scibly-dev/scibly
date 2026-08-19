import { cn } from "@scibly/ui/utils";
import { Check, Link2 } from "lucide-react";

import {
  lipShadow,
  type Pillar,
  PILLARS,
  tint,
} from "@/app/[lang]/components/marketing-tokens";

import {
  type QualityProof,
  type QualityProofDictionary,
} from "./i18n/quality-proof.types";

interface QualitySystemMapProps {
  t: QualityProofDictionary;
}

const LAYER_TONES = [PILLARS.import, PILLARS.learner, PILLARS.analytics];

const OUTPUT_TONE = PILLARS.byoai;

const smallLabelClass = "text-[11.5px] font-semibold text-ink-soft";

const cardTitleClass =
  "m-0 text-[clamp(17px,1.6vw,19.5px)] leading-[1.25] font-semibold tracking-[-0.014em] text-ink";

const cardBodyClass =
  "mt-[7px] mb-0 max-w-[44ch] text-[14.5px] leading-[1.55] text-pretty text-ink-soft";

const proofChipClass =
  "mt-[5px] inline-flex items-center gap-2 self-start rounded-[9px] bg-[#d3f7ab] py-[7px] pr-3 pl-2.5 shadow-[0_2px_0_0_#a3e163]";

const proofChipLabelClass = "text-[12.5px] font-semibold text-[#376e00]";

const reviewerTints = [...LAYER_TONES]
  .reverse()
  .map(({ lipColor }) => lipColor);

type Rung = {
  badge?: string;
  label?: string;
  title: string;
  body: string;
  proof?: QualityProof;
  tone: Pillar;
};

export function QualitySystemMap({ t }: QualitySystemMapProps) {
  const rungs: Rung[] = [
    ...t.qualityLayers.map((layer, index) => ({
      badge: String(index + 1),
      title: layer.title,
      body: layer.body,
      proof: layer.proof,
      tone: LAYER_TONES[index % LAYER_TONES.length],
    })),
    {
      label: t.output.label,
      title: t.output.title,
      body: t.output.body,
      proof: { kind: "approved" as const, label: t.output.status },
      tone: OUTPUT_TONE,
    },
  ];

  return (
    <div className="grid gap-[clamp(34px,5vh,50px)] md:grid-cols-[minmax(280px,0.86fr)_1.14fr] md:items-start md:gap-[clamp(40px,6vw,96px)]">
      <div className="flex min-w-0 flex-col gap-5">
        <h3 className={smallLabelClass}>{t.inputLabel}</h3>

        {/* Paper stack: two sample documents peeking out from under the real card */}
        <div className="relative pt-1.5 pb-[26px]">
          {t.sourceSamples.map((sample, index) => (
            <div
              key={sample}
              className={cn(
                "relative w-full max-w-[330px] rounded-[10px] border border-[#e6eaf5] px-4 pt-[13px]",
                index === 0
                  ? "rotate-[-2.2deg] bg-[#fbfbfc] pb-[26px] shadow-[0_10px_24px_-18px_rgba(15,23,42,0.35)]"
                  : "z-[1] -mt-3.5 ml-[18px] rotate-[-0.4deg] bg-[#fcfcfd] pb-7 shadow-[0_12px_26px_-18px_rgba(15,23,42,0.35)]",
              )}
              aria-hidden
            >
              <div className="text-ink-soft text-[12.5px] font-semibold">
                {sample}
              </div>
            </div>
          ))}

          <ul
            aria-label={t.inputTitle}
            className="relative z-[2] m-0 -mt-2.5 ml-0.5 flex w-full max-w-[346px] rotate-[1.1deg] list-none flex-col gap-4 rounded-[14px] border border-[#e7eaf0] bg-white px-[22px] py-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_26px_50px_-30px_rgba(15,23,42,0.3)] [&>li+li]:border-t [&>li+li]:border-[#f1f3f6] [&>li+li]:pt-4"
          >
            {t.inputs.map((input) => (
              <li key={input.label} className="p-0">
                <div className="text-ink text-[16px] font-semibold tracking-[-0.01em]">
                  {input.label}
                </div>
                <div className="text-ink-soft mt-1 text-[14px] leading-[1.5]">
                  {input.detail}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-[clamp(16px,2.4vh,22px)]">
        <h3 className={smallLabelClass}>{t.coreLabel}</h3>

        <ol className="m-0 flex list-none flex-col gap-[clamp(16px,2.4vh,22px)] p-0">
          {rungs.map(({ badge, label, title, body, proof, tone }, index) => {
            const next = rungs[index + 1];

            return (
              <li key={title} className="flex items-stretch gap-4">
                <div className="flex w-[46px] shrink-0 flex-col items-center">
                  <span
                    className="relative z-[1] flex size-[46px] shrink-0 items-center justify-center rounded-[14px] text-[17px] font-bold tracking-[0.01em] shadow-[0_3px_0_0_var(--rung-lip),0_8px_16px_-12px_rgba(15,23,42,0.28)]"
                    style={{
                      backgroundColor: tone.softColor,
                      color: tone.accentColor,
                      "--rung-lip": tone.lipColor,
                    }}
                  >
                    {badge ?? <Check size={21} strokeWidth={3} aria-hidden />}
                  </span>

                  {/* Rail into the next rung; bleeds over the list gap to meet it */}
                  {next ? (
                    <span
                      className="mt-[5px] mb-[calc(-1*clamp(16px,2.4vh,22px))] min-h-[18px] w-0.5 flex-1 rounded-sm"
                      style={{
                        backgroundImage: `linear-gradient(180deg, ${tone.lipColor} 0%, ${next.tone.lipColor} 100%)`,
                      }}
                      aria-hidden
                    />
                  ) : null}
                </div>

                <div
                  className="flex min-w-0 flex-1 flex-col rounded-2xl border border-[#e7eaf0] bg-white px-5 py-[18px]"
                  style={{
                    boxShadow: `${lipShadow(tint(tone.lipColor, 44), 3)}, 0 6px 14px -8px rgba(15,23,42,0.16)`,
                  }}
                >
                  {label ? (
                    <span className={cn(smallLabelClass, "mb-[7px]")}>
                      {label}
                    </span>
                  ) : null}
                  <h4 className={cardTitleClass}>{title}</h4>
                  <p className={cardBodyClass}>{body}</p>

                  {proof ? <ProofMark proof={proof} /> : null}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

function ProofMark({ proof }: { proof: QualityProof }) {
  if (proof.kind === "reviewers") {
    return (
      <div className="mt-[7px] flex items-center gap-2">
        <div className="flex" aria-hidden>
          {reviewerTints.map((color, index) => (
            <span
              key={color}
              className={cn(
                "size-[26px] rounded-full border-2 border-white",
                index > 0 && "-ml-2",
              )}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        <span className="text-ink-muted text-[12.5px] font-semibold">
          {proof.label}
        </span>
      </div>
    );
  }

  return (
    <span className={proofChipClass}>
      {proof.kind === "approved" ? (
        <Check
          size={13}
          strokeWidth={3}
          className="text-[#376e00]"
          aria-hidden
        />
      ) : (
        <Link2
          size={13}
          strokeWidth={2}
          className="text-[#376e00]"
          aria-hidden
        />
      )}
      <span className={proofChipLabelClass}>{proof.label}</span>
    </span>
  );
}
