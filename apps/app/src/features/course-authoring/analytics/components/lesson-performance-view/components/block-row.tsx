"use client";

import type { BlockData } from "../types";

import Icon from "@scibly/ui/components/icon";
import { cn } from "@scibly/ui/utils";
import { CheckCircle } from "lucide-react";
import React from "react";

import { type CoursesTranslations } from "@/features/course-authoring/contracts";

import { getBlockStyle } from "../utils/block-styles";
import { ScoreTierSection } from "./score-tier-section";

interface BlockRowProps {
  block: BlockData;
  index: number;
  t: CoursesTranslations;
}

function getBlockLabel(type: string, t: CoursesTranslations) {
  const labels = t.detail.analyticsTab.blockTypes;
  if (type === "input-field") return labels.inputField;
  if (type === "multiple-choice") return labels.multipleChoice;
  if (type === "drag-and-drop") return labels.dragAndDrop;
  return labels.unknown.replace("{{type}}", type);
}

export function PerformanceCard({
  color,
  count,
  label,
  points,
  attemptsTemplate,
}: {
  color: string;
  count: number;
  label: string;
  points: number;
  attemptsTemplate: string;
}) {
  return (
    <div className="border-edge bg-ground-soft rounded-xl border-2 p-3">
      <div className="text-ink-soft mb-1 flex items-center gap-1 text-[9px] font-semibold tracking-wider uppercase">
        <span className={cn("h-1.5 w-1.5 rounded-full", color)} />
        {label}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-ink text-[14px] font-bold">
          {count > 0 ? `${points} SP` : "—"}
        </span>
        {count > 0 && (
          <span className="text-ink-soft text-[10px]">
            {attemptsTemplate.replace("{{count}}", String(count))}
          </span>
        )}
      </div>
    </div>
  );
}

export function BlockHeader({ block, index, t }: BlockRowProps) {
  const style = getBlockStyle(block.blockType);
  return (
    <div className="border-edge bg-ground-soft flex items-center justify-between border-b-2 px-4 py-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <div
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
            style.bgClass,
          )}
        >
          <Icon
            name={style.icon}
            className={cn("h-4 w-4", style.iconClass)}
            size={16}
          />
        </div>
        <span className="text-ink text-[12px] font-semibold">
          {getBlockLabel(block.blockType, t)}{" "}
          <span className="text-ink-soft font-normal">#{index + 1}</span>
        </span>
      </div>
      <div className="text-ink-muted border-edge flex items-center gap-1 rounded-full border-2 bg-white px-2.5 py-0.5 text-[11px] font-semibold">
        {t.detail.analyticsTab.blockMaxSp.replace(
          "{{points}}",
          String(block.maxPoints),
        )}
      </div>
    </div>
  );
}

export function BlockRow({ block, index, t }: BlockRowProps) {
  const rowT = t.detail.analyticsTab;
  const totalBlockAttempts = block.enrolled.count + block.anonymous.count;

  return (
    <div className="border-edge flex flex-col overflow-hidden rounded-2xl border-2 bg-white shadow-[0_3px_0_0_var(--color-lip)]">
      <BlockHeader block={block} index={index} t={t} />
      <div className="space-y-4 p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <PerformanceCard
            color="bg-blue-500"
            count={block.enrolled.count}
            label={rowT.blockEnrolledHeader}
            points={block.enrolled.avgAchieved}
            attemptsTemplate={rowT.blockEnrolledAttempts}
          />
          <PerformanceCard
            color="bg-purple-500"
            count={block.anonymous.count}
            label={rowT.blockAnonHeader}
            points={block.anonymous.avgAchieved}
            attemptsTemplate={rowT.blockEnrolledAttempts}
          />
        </div>
        <div className="border-edge bg-ground-soft rounded-xl border-2 p-3">
          <div className="text-ink-muted mb-1 flex items-center gap-1.5 text-[11px] font-semibold">
            <CheckCircle className="text-ink-soft h-3.5 w-3.5" />
            {rowT.blockSolutionHeader}
          </div>
          <p className="text-ink text-[11px] leading-relaxed font-medium whitespace-pre-wrap select-text">
            {block.correctAnswer || rowT.blockNoSolution}
          </p>
        </div>

        {block.scoreDistribution.length > 0 && (
          <div className="space-y-3 pt-1">
            <div className="text-ink-soft text-[10px] font-semibold tracking-wider uppercase">
              {rowT.blockDistributionHeader}
            </div>
            <div className="space-y-2.5">
              {block.scoreDistribution.map((dist, idx) => (
                <ScoreTierSection
                  key={idx}
                  dist={dist}
                  maxPoints={block.maxPoints}
                  totalBlockAttempts={totalBlockAttempts}
                  t={t}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
