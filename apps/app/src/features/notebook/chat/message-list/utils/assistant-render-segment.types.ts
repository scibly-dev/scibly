import type { NotebookToolPart } from "@/features/notebook/chat/tools/tool-parts";

export type ThinkingTimelineEntry =
  | { type: "reasoning"; text: string; partIndex: number }
  | {
      type: "tool";
      part: NotebookToolPart;
      partIndex: number;
    };

export type AssistantRenderSegment =
  | {
      type: "thinking";
      key: string;
      entries: ThinkingTimelineEntry[];
      partEndIndex: number;
    }
  | { type: "text"; key: string; text: string; partIndex: number }
  | {
      type: "inline-tool";
      key: string;
      part: NotebookToolPart;
      partIndex: number;
    };
