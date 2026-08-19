import { getSession } from "@scibly/auth/session";
import { routes } from "@scibly/routes";
import { redirect } from "next/navigation";

import { api, HydrateClient } from "@/shared/api/trpc/server";

import { PreviewPageClient } from "./components/preview-page-client";

export async function CoursePreviewScreen({
  orgSlug,
  courseId,
}: {
  orgSlug: string;
  courseId: string;
}) {
  const session = await getSession();
  if (!session?.user) {
    redirect(routes.app.auth.default);
  }

  void api.course.getPreview.prefetch({ courseId });

  return (
    <HydrateClient>
      <PreviewPageClient orgSlug={orgSlug} courseId={courseId} />
    </HydrateClient>
  );
}
