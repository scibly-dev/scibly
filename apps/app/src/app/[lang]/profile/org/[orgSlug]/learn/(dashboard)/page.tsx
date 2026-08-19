import { constructMetadata } from "@scibly/lib";
import { type Metadata } from "next";

import { LearningOverviewScreen } from "@/features/learning/dashboard/overview/screen";

export const metadata: Metadata = constructMetadata({
  title: "Learning Dashboard",
  description: "Your learning overview — SP, courses, and progress.",
  noIndex: true,
});

export default async function LearnOverviewPage(props: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await props.params;
  return <LearningOverviewScreen orgSlug={orgSlug} />;
}
