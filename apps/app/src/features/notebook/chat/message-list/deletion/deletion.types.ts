import type { NotebookToolPartOf } from "@/features/notebook/chat/tools/tool-parts";

export type DeletionToolPart = Exclude<
  NotebookToolPartOf<"deleteScenes" | "deleteLessons">,
  { state: "input-streaming" }
>;

type DeletionKind = "scene" | "lesson";

export type DeletionItem = {
  id: string;
  title: string;
  subtitle?: string;
  lessonId?: string;
};

type DeletionFocusLesson = {
  id: string;
  title?: string;
};

type DeletionApprovalRef = {
  approvalId: string;
  toolCallId: string;
};

/** Not the SDK's state names: the browser runs the mutation, so an approved call reads as deleted before the stream turns the part into `output-available`. */
export type DeletionDisplayStatus =
  | "streaming"
  | "awaiting-approval"
  | "deleting"
  | "deleted"
  | "denied"
  | "failed";

export type DeletionInvocation = {
  key: string;
  kind: DeletionKind;
  ids: string[];
  courseId: string;
  reason?: string;

  approval?: DeletionApprovalRef;
  partIndex: number;
  status: DeletionDisplayStatus;
  errorText?: string;
};

export type DeletionResolution = {
  items: DeletionItem[];
  courseTitle: string;
  focusLesson?: DeletionFocusLesson;
};
