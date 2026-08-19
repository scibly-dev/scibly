import type { UIMessage } from "ai";
import type { CourseDelta } from "@/shared/ai/types";
import type { NotebookUITools } from "./tools/index";

type MessageMetadata = { createdAt: string };

export type CustomUIDataTypes = {
  courseDelta: CourseDelta;
  "chat-title": string;

  compaction: "summarizing" | "done" | "failed";
};

export type NotebookMessage = UIMessage<
  MessageMetadata,
  CustomUIDataTypes,
  NotebookUITools
>;
