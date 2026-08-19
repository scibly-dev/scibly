import { OnboardingScreen } from "@/features/organizations/onboarding/screen";

export default function OnboardingPage(props: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ intent?: string }>;
}) {
  return <OnboardingScreen {...props} />;
}
