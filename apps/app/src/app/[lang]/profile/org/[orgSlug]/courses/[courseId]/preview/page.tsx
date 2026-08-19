import { CoursePreviewScreen } from "@/features/course-authoring/publishing/preview/course-preview-screen";

export default async function CoursePreviewPage({
  params,
}: {
  params: Promise<{ orgSlug: string; courseId: string }>;
}) {
  return <CoursePreviewScreen {...await params} />;
}
