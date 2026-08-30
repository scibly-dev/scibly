import type { Principal } from "@scibly/auth/session";
import type { UIMessageStreamWriter } from "ai";
import type { TrpcCaller } from "@/server/api/root";
import type { NotebookMessage } from "../chat/contracts";

export type NotebookRuntimeContext = {
  caller: TrpcCaller;
  session: Principal;
  notebookId?: string;
  // Absent outside a notebook: an external agent reaches the tools through an
  // endpoint that names no organization, and passes one per call instead.
  orgSlug?: string;
  dataStream: UIMessageStreamWriter<NotebookMessage>;
};
