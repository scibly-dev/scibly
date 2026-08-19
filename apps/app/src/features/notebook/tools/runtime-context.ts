import type { Session } from "@scibly/auth/session";
import type { UIMessageStreamWriter } from "ai";
import type { TrpcCaller } from "@/server/api/root";
import type { NotebookMessage } from "../chat/contracts";

export type NotebookRuntimeContext = {
  caller: TrpcCaller;
  session: Session;
  notebookId?: string;
  orgSlug: string;
  dataStream: UIMessageStreamWriter<NotebookMessage>;
};
