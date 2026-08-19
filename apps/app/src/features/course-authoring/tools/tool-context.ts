import type { NotebookRuntimeContext } from "@/features/notebook/server";
import type { CourseDelta } from "@/shared/ai/types";

export function writeCourseDelta(
  context: NotebookRuntimeContext,
  data: CourseDelta,
) {
  context.dataStream.write({
    type: "data-courseDelta",
    data,
    transient: true,
  });
}
