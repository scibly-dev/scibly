import { cn } from "@scibly/ui/utils";
import { ArrowUp, Check, ChevronDown, ShieldCheck } from "lucide-react";
import Image from "next/image";

import {
  panelStyle,
  productColumnClass,
  productLabelClass,
  productMetaClass,
  productPanelClass,
  productRootClass,
  productTitleClass,
} from "@/app/[lang]/components/home-page-section/product-surface";
import {
  chosenKey,
  IDLE_KEY,
  keyStyle,
  panelKey,
  PILLARS,
} from "@/app/[lang]/components/marketing-tokens";
import { BrandLogo } from "@/components/brand-logo";
import { SCIBLY_MARK_SRC } from "@/lib/marketing-assets";

import { BENTO_EASE } from "../keyframes";
import { type FeatureShowcaseDictionary } from "./i18n/feature-showcase.types";

type ByoAiCopy = FeatureShowcaseDictionary["byoai"];

type ModelRow = {
  name: string;
  detail: string;
  active: boolean;
  domain?: string;
  scibly?: boolean;
};

const PILLAR = PILLARS.byoai;

function chosenModel(t: ByoAiCopy): ModelRow {
  return { name: t.yoursLabel, detail: t.yoursDetail, active: true };
}

export function ByoAiVisual({ t }: { t: ByoAiCopy }) {
  return (
    <div data-bento-visual className={productRootClass}>
      <div className={cn(productColumnClass, "justify-center gap-3")}>
        <ModelPicker t={t} />
        <TrustRow t={t} delay="1100ms" />
      </div>
    </div>
  );
}

export function ByoAiDetailStage({ t }: { t: ByoAiCopy }) {
  return (
    <div className="grid items-stretch gap-4 lg:grid-cols-2 lg:gap-6">
      <div
        data-bento-anim
        className={cn(productPanelClass, "gap-3 lg:min-h-[420px]")}
        style={panelStyle(PILLAR, "200ms")}
      >
        <ModelPicker t={t} />
        <TrustRow t={t} delay="1100ms" />
      </div>

      {/* The conversation — large screens only; phone and tablet stay on the picker */}
      <div
        data-bento-anim
        className={cn(productPanelClass, "hidden gap-3 lg:flex")}
        style={panelStyle(PILLAR, "360ms")}
      >
        <Conversation t={t} />
      </div>
    </div>
  );
}

function ModelPicker({ t }: { t: ByoAiCopy }) {
  const [openai, anthropic, scibly] = t.providers;
  const models: ModelRow[] = [
    chosenModel(t),
    { ...openai, domain: "openai.com", active: false },
    { ...anthropic, domain: "anthropic.com", active: false },
    { ...scibly, scibly: true, active: false },
  ];

  return (
    <>
      <span
        data-bento-anim
        className={cn(productLabelClass, "shrink-0")}
        style={{ animation: `sc-fade-in 600ms ${BENTO_EASE} 380ms both` }}
      >
        {t.panelLabel}
      </span>

      <div className="flex min-h-0 flex-1 flex-col justify-center gap-2">
        {models.map((model, index) => (
          <div
            key={model.name}
            data-bento-anim
            className="flex min-w-0 items-center gap-3 rounded-[14px] border-2 px-3 py-2"
            style={{
              ...keyStyle(model.active ? chosenKey(PILLAR) : IDLE_KEY),
              animation: `sc-rise 700ms ${BENTO_EASE} ${520 + index * 110}ms both`,
            }}
          >
            <ModelIcon model={model} />
            <span className="min-w-0 flex-1">
              <span className={cn(productTitleClass, "block")}>
                {model.name}
              </span>
              <span className={cn(productMetaClass, "block")}>
                {model.detail}
              </span>
            </span>
            {model.active ? (
              <Check
                size={18}
                strokeWidth={3}
                className="shrink-0"
                style={{ color: PILLAR.accentColor }}
                aria-hidden
              />
            ) : null}
          </div>
        ))}
      </div>
    </>
  );
}

function ModelIcon({
  model,
  small = false,
}: {
  model: ModelRow;
  small?: boolean;
}) {
  const glyph = small ? 13 : 18;

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center",
        small ? "size-6 rounded-[7px]" : "size-9 rounded-[10px]",
      )}
      style={{
        backgroundColor: model.active ? PILLAR.softColor : "#f4f5f7",
      }}
    >
      {model.scibly ? (
        <Image src={SCIBLY_MARK_SRC} alt="" width={glyph} height={glyph} />
      ) : model.domain ? (
        <BrandLogo domain={model.domain} alt="" size={glyph} />
      ) : (
        <span
          className={cn("font-bold", small ? "text-[9px]" : "text-[11px]")}
          style={{ color: PILLAR.accentColor }}
        >
          AI
        </span>
      )}
    </span>
  );
}

function TrustRow({ t, delay }: { t: ByoAiCopy; delay: string }) {
  return (
    <div
      data-bento-anim
      className="flex shrink-0 flex-wrap items-center gap-2"
      style={{ animation: `sc-fade-in 650ms ${BENTO_EASE} ${delay} both` }}
    >
      <ShieldCheck
        size={15}
        strokeWidth={2.4}
        className="shrink-0"
        style={{ color: PILLAR.accentColor }}
        aria-hidden
      />
      {t.trustChips.map((chip) => (
        <span
          key={chip}
          className="rounded-[9px] border-2 px-2.5 py-1 text-[12px] font-bold"
          style={keyStyle(IDLE_KEY, 2)}
        >
          {chip}
        </span>
      ))}
    </div>
  );
}

function Conversation({ t }: { t: ByoAiCopy }) {
  const active = chosenModel(t);

  return (
    <>
      <div
        data-bento-anim
        className="flex shrink-0 flex-col items-end gap-1.5"
        style={{ animation: `sc-rise 700ms ${BENTO_EASE} 560ms both` }}
      >
        <span className={cn(productLabelClass, "pr-1")}>{t.youLabel}</span>
        <span
          className="text-ink max-w-[92%] rounded-[14px] px-3.5 py-2.5 text-[15px] leading-snug font-semibold"
          style={{
            backgroundColor: PILLAR.softColor,
            boxShadow: `0 3px 0 0 ${PILLAR.lipColor}`,
          }}
        >
          {t.query}
        </span>
      </div>

      <div
        data-bento-anim
        className="flex min-w-0 shrink-0 items-center gap-2 pt-1"
        style={{ animation: `sc-fade-in 650ms ${BENTO_EASE} 760ms both` }}
      >
        <span
          className="flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-[8px]"
          style={{ backgroundColor: PILLAR.softColor }}
        >
          <Image src={SCIBLY_MARK_SRC} alt="" width={14} height={14} />
        </span>
        <span className="text-ink shrink-0 text-[13.5px] font-bold">
          {t.replyLabel}
        </span>
        <span
          className="min-w-0 truncate rounded-[7px] px-2 py-1 text-[11.5px] font-bold"
          style={{
            backgroundColor: PILLAR.softColor,
            color: PILLAR.accentColor,
          }}
        >
          {t.viaLabel} {active.name}
        </span>
      </div>

      <p
        data-bento-anim
        className="m-0 max-w-[95%] shrink-0 rounded-[14px] border-2 px-3.5 py-2.5 text-[13.5px] leading-[1.5]"
        style={{
          ...keyStyle(panelKey(PILLAR), 3),
          color: IDLE_KEY.ink,
          animation: `sc-rise 700ms ${BENTO_EASE} 900ms both`,
        }}
      >
        {t.reply}
      </p>

      <div
        data-bento-anim
        className="mt-auto flex shrink-0 flex-col gap-3 rounded-[16px] border-2 px-3.5 py-3"
        style={{
          ...keyStyle(panelKey(PILLAR)),
          animation: `sc-rise 750ms ${BENTO_EASE} 1060ms both`,
        }}
      >
        <span className="text-[14px] text-[#8a93b0]">{t.inputPlaceholder}</span>
        <div className="flex items-center justify-between gap-2">
          <span
            className="flex min-w-0 items-center gap-2 rounded-[10px] border-2 px-2 py-1.5"
            style={keyStyle(chosenKey(PILLAR), 2)}
          >
            <ModelIcon model={active} small />
            <span className="min-w-0 truncate text-[12.5px] font-bold">
              {active.name}
            </span>
            <ChevronDown
              size={14}
              strokeWidth={2.6}
              className="shrink-0"
              aria-hidden
            />
          </span>
          <span
            className="flex size-9 shrink-0 items-center justify-center rounded-[11px] text-white"
            style={{
              backgroundColor: PILLAR.accentColor,
              boxShadow: `0 3px 0 0 ${PILLAR.lipColor}`,
            }}
            aria-hidden
          >
            <ArrowUp size={17} strokeWidth={2.6} />
          </span>
        </div>
      </div>
    </>
  );
}
