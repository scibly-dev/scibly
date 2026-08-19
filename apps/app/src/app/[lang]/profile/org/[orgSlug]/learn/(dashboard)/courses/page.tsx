import { constructMetadata } from "@scibly/lib";
import { type Metadata } from "next";

import { EnrolledCoursesScreen } from "@/features/learning/dashboard/enrolled-courses/screen";

export const metadata: Metadata = constructMetadata({
  title: "My Courses",
  description: "All courses you are enrolled in.",
  noIndex: true,
});

export default async function LearnCoursesPage(props: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await props.params;
  return <EnrolledCoursesScreen orgSlug={orgSlug} />;
}
