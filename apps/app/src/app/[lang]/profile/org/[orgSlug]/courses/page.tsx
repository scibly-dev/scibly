import { CourseListScreen } from "@/features/course-authoring/courses/list/course-list-screen";

export default async function OrgCoursesPage({
  params,
}: {
  params: Promise<{ lang: string; orgSlug: string }>;
}) {
  return <CourseListScreen {...await params} />;
}
