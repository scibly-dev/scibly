import type { api } from "@/shared/api/trpc/client";

type TRPCUtils = ReturnType<typeof api.useUtils>;

export function invalidateCourseAdmin(trpcUtils: TRPCUtils, courseId: string) {
  void trpcUtils.course.getById.invalidate({ courseId });
  void trpcUtils.course.getStats.invalidate({ courseId });
  void trpcUtils.course.listLessons.invalidate({ courseId });
  void trpcUtils.course.getOutdatedScenes.invalidate({ courseId });
}
