import { MemberCoursePlayerScreen } from "@/features/learning/course-player/member/screen";

export default async function CourseLearnPage(props: {
  params: Promise<{ lang: string; orgSlug: string; courseId: string }>;
}) {
  const { orgSlug, courseId } = await props.params;
  return <MemberCoursePlayerScreen orgSlug={orgSlug} courseId={courseId} />;
}
