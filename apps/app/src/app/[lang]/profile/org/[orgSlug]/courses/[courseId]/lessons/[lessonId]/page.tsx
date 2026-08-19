import { LessonBuilderScreen } from "@/features/course-authoring/lessons/builder/lesson-builder-screen";

export default async function LessonManagementPage({
  params,
}: {
  params: Promise<{
    orgSlug: string;
    courseId: string;
    lessonId: string;
  }>;
}) {
  return <LessonBuilderScreen {...await params} />;
}
