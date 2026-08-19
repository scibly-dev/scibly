"use client";

import { autocaptureAttributes } from "@scibly/observability/autocapture";
import { useRouter } from "next/navigation";

import { api } from "@/shared/api/trpc/client";

/** Leaves onboarding for good — the same transition as finishing it. */
export function SkipOnboardingButton({
  label,
  destination,
}: {
  label: string;
  destination: string;
}) {
  const router = useRouter();
  const complete = api.organization.completeOnboarding.useMutation({
    onSettled: () => router.push(destination),
  });

  return (
    <button
      type="button"
      disabled={complete.isPending}
      onClick={() => complete.mutate()}
      className="text-ink-soft hover:text-ink text-sm transition-colors disabled:opacity-50"
      {...autocaptureAttributes({ action: "onboarding_skip", destination })}
    >
      {label}
    </button>
  );
}
