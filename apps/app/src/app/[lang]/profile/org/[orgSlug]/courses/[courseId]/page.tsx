import { CourseAdminScreen } from "@/features/course-authoring/courses/admin/course-admin-screen";

export default async function CourseAdminOverviewPage({
  params,
}: {
  params: Promise<{ lang: string; orgSlug: string; courseId: string }>;
}) {
  return <CourseAdminScreen {...await params} />;
}
