import { cn } from "@scibly/ui/utils";
import { FileText, FileType2, Presentation } from "lucide-react";
import Image from "next/image";

import {
  panelStyle,
  productColumnClass,
  productMetaClass,
  productPanelClass,
  productRootClass,
  productTitleClass,
} from "@/app/[lang]/components/home-page-section/product-surface";
import {
  IDLE_KEY,
  keyStyle,
  panelKey,
  PILLARS,
} from "@/app/[lang]/components/marketing-tokens";
import { BrandLogo } from "@/components/brand-logo";
import { SCIBLY_MARK_SRC } from "@/lib/marketing-assets";

import { BENTO_EASE } from "../keyframes";
import { type FeatureShowcaseDictionary } from "./i18n/feature-showcase.types";

type ImportCopy = FeatureShowcaseDictionary["import"];

const PILLAR = PILLARS.import;

const ROW_HEIGHT = 52;
const ROW_PITCH = ROW_HEIGHT + 8;

function getImportSources(t: ImportCopy) {
  return [
    {
      domain: "confluence.atlassian.com" as const,
      kind: "integration" as const,
      label: t.source1Label,
      detail: t.source1Sub,
    },
    {
      domain: "notion.so" as const,
      kind: "integration" as const,
      label: t.source2Label,
      detail: t.source2Sub,
    },
    {
      domain: null,
      kind: "pdf" as const,
      label: t.source3Label,
      detail: t.source3Sub,
    },
    {
      domain: null,
      kind: "docx" as const,
      label: t.source4Label,
      detail: t.source4Sub,
    },
    {
      domain: null,
      kind: "slides" as const,
      label: t.source5Label,
      detail: t.source5Sub,
    },
  ];
}

function SourceIcon({
  source,
}: {
  source: ReturnType<typeof getImportSources>[number];
}) {
  if (source.domain) {
    return <BrandLogo domain={source.domain} alt="" size={19} />;
  }

  if (source.kind === "docx") {
    return <FileType2 size={19} strokeWidth={2.1} className="text-[#2563eb]" />;
  }

  if (source.kind === "slides") {
    return (
      <Presentation size={19} strokeWidth={2.1} className="text-[#e66a2c]" />
    );
  }

  return <FileText size={19} strokeWidth={2.1} className="text-[#e5252a]" />;
}

export function ImportVisual({ t }: { t: ImportCopy }) {
  return (
    <div data-bento-visual className={productRootClass}>
      <div className={cn(productColumnClass, "gap-3")}>
        <ImportSystem t={t} />
      </div>
    </div>
  );
}

export function ImportDetailStage({ t }: { t: ImportCopy }) {
  return (
    <div className="mx-auto max-w-[560px]">
      <div
        data-bento-anim
        className={cn(productPanelClass, "min-h-[440px] gap-3")}
        style={panelStyle(PILLAR, "200ms")}
      >
        <ImportSystem t={t} />
      </div>
    </div>
  );
}

function ImportSystem({ t }: { t: ImportCopy }) {
  const sources = getImportSources(t);

  return (
    <>
      <div
        data-bento-anim
        data-import-document-viewport
        className="relative min-h-[72px] flex-1 overflow-hidden"
        style={{ animation: `sc-fade-in 700ms ${BENTO_EASE} 320ms both` }}
      >
        {/* Lifts the second row of the stack onto the capture frame */}
        <div
          className="absolute inset-x-0 top-1/2"
          style={{
            transform: `translateY(-${ROW_PITCH + ROW_HEIGHT / 2}px)`,
          }}
        >
          <div data-import-document-track>
            {[0, 1, 2].map((setIndex) => (
              <div
                key={setIndex}
                className="flex flex-col gap-2 pb-2"
                aria-hidden={setIndex > 0 ? true : undefined}
              >
                {sources.map((source) => (
                  <div
                    key={`${setIndex}-${source.label}`}
                    className="flex min-w-0 items-center gap-3 rounded-[14px] border-2 px-3"
                    style={{ ...keyStyle(IDLE_KEY), height: ROW_HEIGHT }}
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-[#f4f5f7]">
                      <SourceIcon source={source} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={cn(productTitleClass, "block")}>
                        {source.label}
                      </span>
                      <span className={cn(productMetaClass, "block")}>
                        {source.detail}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div
          data-import-capture
          className="pointer-events-none absolute inset-x-0 top-1/2 h-[64px] -translate-y-1/2 rounded-[16px] border-2"
          style={{ borderColor: `${PILLAR.lipColor}73` }}
          aria-hidden
        />
      </div>

      <ScanLine t={t} />

      <div
        data-bento-anim
        className="flex flex-col gap-2 rounded-[16px] border-2 px-4 py-2.5"
        style={{
          ...keyStyle(panelKey(PILLAR)),
          animation: `sc-rise 700ms ${BENTO_EASE} 980ms both`,
        }}
      >
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-ink truncate text-[15.5px] font-bold">
            {t.courseLabel}
          </span>
          <span className="shrink-0 text-[12.5px] font-semibold text-[#376e00]">
            {t.lessonCount}
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          {t.lessons.map((lesson, index) => (
            <div
              key={lesson}
              data-import-course-node={index}
              className="flex min-w-0 items-center gap-2.5"
            >
              <span
                className="flex size-[22px] shrink-0 items-center justify-center rounded-[7px] text-[12px] font-bold"
                style={{
                  backgroundColor: PILLAR.softColor,
                  color: PILLAR.accentColor,
                }}
              >
                {index + 1}
              </span>
              <span className="min-w-0 flex-1 truncate text-[14px] text-[#3b4574]">
                {lesson}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 border-t border-[#f1f3f6] pt-2.5">
          <span
            className="size-2 shrink-0 rounded-full"
            style={{ backgroundColor: PILLAR.accentColor }}
            aria-hidden
          />
          <span className={cn(productMetaClass, "min-w-0")}>
            {t.syncBadge} · {t.syncedLabel}
          </span>
        </div>
      </div>
    </>
  );
}

function ScanLine({ t }: { t: ImportCopy }) {
  return (
    <div
      data-bento-anim
      className="relative flex shrink-0 items-center gap-2.5"
      style={{ animation: `sc-fade-in 650ms ${BENTO_EASE} 680ms both` }}
    >
      <span className="h-px flex-1 bg-[#e7eaf0]" aria-hidden />

      <div
        data-import-ai-lens
        className="flex items-center gap-2 rounded-[11px] px-3 py-2"
        style={{
          backgroundColor: PILLAR.softColor,
          boxShadow: `0 3px 0 0 ${PILLAR.lipColor}`,
        }}
      >
        <span className="relative flex size-[22px] shrink-0 items-center justify-center rounded-full bg-white">
          <span
            data-import-ai-orbit
            className="absolute -inset-[3px] rounded-full border"
            style={{
              borderColor: `${PILLAR.lipColor}66`,
              borderTopColor: PILLAR.accentColor,
            }}
            aria-hidden
          />
          <Image src={SCIBLY_MARK_SRC} alt="" width={14} height={14} />
          <span
            data-import-lens-document
            className="absolute inset-0 flex items-center justify-center rounded-full text-white opacity-0"
            style={{ backgroundColor: PILLAR.accentColor }}
            aria-hidden
          >
            <FileText size={12} strokeWidth={2.4} />
          </span>
        </span>
        <span
          className="text-[13px] font-bold"
          style={{ color: PILLAR.accentColor }}
        >
          Scibly AI
        </span>
        <span className="text-ink-muted text-[12px] font-medium">
          · {t.modelLabel}
        </span>
      </div>

      <span className="h-px flex-1 bg-[#e7eaf0]" aria-hidden />

      <span
        data-import-signal="input"
        className="absolute top-1/2 size-1.5 -translate-y-1/2 rounded-full"
        style={{ backgroundColor: PILLAR.lipColor }}
        aria-hidden
      />
      <span
        data-import-signal="output"
        className="absolute top-1/2 size-1.5 -translate-y-1/2 rounded-full"
        style={{ backgroundColor: PILLAR.accentColor }}
        aria-hidden
      />
    </div>
  );
}
