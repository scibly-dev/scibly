import { getSession } from "@scibly/auth/session";
import { routes } from "@scibly/routes";
import { redirect } from "next/navigation";

import { api, HydrateClient } from "@/shared/api/trpc/server";

import { EnrolledCourseList } from "./enrolled-course-list";

export async function EnrolledCoursesScreen({ orgSlug }: { orgSlug: string }) {
  const session = await getSession();
  if (!session?.user) return redirect(routes.app.auth.default);

  void api.learning.listEnrolledCourses.prefetch({
    orgSlug,
    limit: 6,
    cursor: 0,
  });
  return (
    <HydrateClient>
      <EnrolledCourseList orgSlug={orgSlug} />
    </HydrateClient>
  );
}
