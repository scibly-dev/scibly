import type { NotebookMessage } from "@/features/notebook/chat/contracts";
import type { NotebookTranslations } from "../../i18n/notebook.types";

export interface MessageListProps {
  messages: NotebookMessage[];
  isChatLoading: boolean;
  isCompacting: boolean;
  hasChats: boolean;
  notebookId?: string;
  onRetryMessage?: (text: string) => void;
  t: NotebookTranslations;
}
