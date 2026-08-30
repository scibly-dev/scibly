import type { Principal } from "@scibly/auth/session";
import type { UIMessageStreamWriter } from "ai";
import type { TrpcCaller } from "@/server/api/root";
import type { NotebookMessage } from "../chat/contracts";

export type NotebookRuntimeContext = {
  caller: TrpcCaller;
  session: Principal;
  notebookId?: string;
  orgSlug: string;
  dataStream: UIMessageStreamWriter<NotebookMessage>;
};
