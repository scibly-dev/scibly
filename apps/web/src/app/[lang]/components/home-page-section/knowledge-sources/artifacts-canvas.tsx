import { GitPullRequest, Ticket } from "lucide-react";

import { CORRECT_KEY } from "@/app/[lang]/components/marketing-tokens";
import { BrandLogo } from "@/components/brand-logo";

import { enter, FAINT, HAIRLINE, MUTED } from "../mock/mock-theme";
import { MockWindow } from "../mock/mock-window";
import { MockWindowBar } from "../mock/mock-window-bar";
import { CapturedChip } from "./captured-chip";
import { CardCanvas } from "./card-canvas";
import { type ArtifactsDictionary } from "./i18n/knowledge-sources.types";
import { SLACK_TONE, WORK_TONE } from "./knowledge-sources-tones";

export function ArtifactsCanvas({
  t,
  capturedLabel,
}: {
  t: ArtifactsDictionary;
  capturedLabel: string;
}) {
  return (
    <CardCanvas tone={WORK_TONE}>
      <div className="absolute inset-x-5 top-5 flex flex-col gap-2.5">
        <MockWindow data-bento-anim style={enter("sc-rise", 360)}>
          <MockWindowBar>
            <BrandLogo domain="slack.com" alt="" size={12} />
            <span>{t.slackChannel}</span>
            <span className="font-medium" style={{ color: FAINT }}>
              {t.slackTime}
            </span>
            <CapturedChip tone={SLACK_TONE} label={capturedLabel} />
          </MockWindowBar>
          <div className="flex items-start gap-2 px-3 py-2.5">
            <span
              className="flex size-6 shrink-0 items-center justify-center rounded-[6px] text-[10px] font-bold text-white"
              style={{ backgroundColor: SLACK_TONE.accentColor }}
            >
              {t.slackAuthor.charAt(0)}
            </span>
            <p
              className="m-0 min-w-0 text-[11.5px] leading-[1.45]"
              style={{ color: MUTED }}
            >
              <span className="text-ink font-bold">{t.slackAuthor}</span>{" "}
              {t.slackText}
            </p>
          </div>
        </MockWindow>

        <MockWindow data-bento-anim style={enter("sc-rise", 480)}>
          <MockWindowBar>
            <GitPullRequest
              size={12}
              strokeWidth={2.6}
              style={{ color: WORK_TONE.accentColor }}
            />
            <span className="font-mono font-medium">{t.codeFile}</span>
            <span
              className="rounded-[4px] px-1 py-px text-[9.5px] font-bold"
              style={{ backgroundColor: HAIRLINE, color: MUTED }}
            >
              {t.codeReview}
            </span>
            <CapturedChip tone={WORK_TONE} label={capturedLabel} />
          </MockWindowBar>
          <div className="font-mono text-[10.5px] leading-[1.7]">
            <div className="flex gap-2 bg-[#ffecec] px-3 text-[#b3261e]">
              <span className="w-2 select-none">-</span>
              <span className="truncate">{t.codeRemoved}</span>
            </div>
            <div className="flex gap-2 bg-[#e6f8e0] px-3 text-[#2f6a00]">
              <span className="w-2 select-none">+</span>
              <span className="truncate">{t.codeAdded}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-2">
            <span
              className="flex size-5 shrink-0 items-center justify-center rounded-full text-[8.5px] font-bold text-white"
              style={{ backgroundColor: WORK_TONE.accentColor }}
            >
              TK
            </span>
            <p
              className="m-0 min-w-0 truncate text-[11.5px]"
              style={{ color: MUTED }}
            >
              {t.codeComment}
            </p>
          </div>
        </MockWindow>

        <MockWindow data-bento-anim style={enter("sc-rise", 600)}>
          <MockWindowBar>
            <Ticket
              size={12}
              strokeWidth={2.6}
              style={{ color: WORK_TONE.accentColor }}
            />
            <span className="font-mono font-medium">{t.ticketId}</span>
            <span
              className="rounded-[4px] px-1.5 py-px text-[9.5px] font-bold"
              style={{
                backgroundColor: CORRECT_KEY.face,
                color: CORRECT_KEY.ink,
              }}
            >
              {t.ticketStatus}
            </span>
            <CapturedChip tone={WORK_TONE} label={capturedLabel} />
          </MockWindowBar>
          <div className="flex flex-col gap-0.5 px-3 py-2.5">
            <span className="text-ink text-[12px] font-bold">
              {t.ticketTitle}
            </span>
            <span className="text-[11px]" style={{ color: MUTED }}>
              {t.ticketCause}
            </span>
          </div>
        </MockWindow>
      </div>
    </CardCanvas>
  );
}
