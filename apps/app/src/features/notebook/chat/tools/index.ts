import type { InferUITools } from "ai";
import type { buildToolRegistry } from "../../tools/registry.server";

export type AppTools = Awaited<ReturnType<typeof buildToolRegistry>>;
export type NotebookUITools = InferUITools<AppTools>;
