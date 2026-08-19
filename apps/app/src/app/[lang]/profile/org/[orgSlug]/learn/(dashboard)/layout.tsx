import { LearningDashboardLayout } from "@/features/learning/dashboard/shell/learning-dashboard-layout";

export default async function LearnLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  return (
    <LearningDashboardLayout lang={lang}>{children}</LearningDashboardLayout>
  );
}
