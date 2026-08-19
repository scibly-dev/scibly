import type { NotebookToolPartOf } from "@/features/notebook/chat/tools/tool-parts";

export type DeletionToolPart = Exclude<
  NotebookToolPartOf<"deleteScenes" | "deleteLessons">,
  { state: "input-streaming" }
>;

type DeletionKind = "scene" | "lesson";

export type DeletionItem = {
  id: string;
  title?: string;
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

/**
 * Deliberately not the SDK's state names: an approved call already reads as
 * deleted here, because the browser runs the mutation and settles before the
 * continuation stream turns the part into `output-available`.
 */
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
  items: DeletionItem[];
  reason?: string;
  courseId?: string;
  focusLesson?: DeletionFocusLesson;

  approval?: DeletionApprovalRef;
  partIndex: number;
  status: DeletionDisplayStatus;
  errorText?: string;
};
