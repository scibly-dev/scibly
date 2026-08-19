import type { api } from "@/shared/api/trpc/client";

type Utils = ReturnType<typeof api.useUtils>;

export function refreshGeneratedImageLibrary(
  listUtils: Utils["notebook"]["generatedImage"]["list"],
  args: { notebookId: string; orgSlug: string },
) {
  void listUtils.invalidate(args);
}
