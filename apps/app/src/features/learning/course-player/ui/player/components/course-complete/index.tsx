"use client";

import { CourseCompleteFail } from "./components/course-complete-fail";
import { CourseCompleteSuccess } from "./components/course-complete-success";

interface CourseCompleteProps {
  orgSlug?: string;
  courseTitle: string;
  totalSP: number;
  hasCertificate: boolean;
  achievedScorePct: number;
  requiredScorePct: number | null;
  triesCount: number;
  maxTries: number | null;

  onBackToDashboard?: () => void;

  backLabel?: string;

  onRestart?: () => void;

  isRestartPending?: boolean;
  showBranding?: boolean;
}

export function CourseComplete({
  orgSlug,
  courseTitle,
  totalSP,
  hasCertificate,
  achievedScorePct,
  requiredScorePct,
  triesCount,
  maxTries,
  onBackToDashboard,
  backLabel,
  onRestart,
  isRestartPending,
  showBranding,
}: CourseCompleteProps) {
  const hasPassed =
    requiredScorePct === null || achievedScorePct >= requiredScorePct;

  if (hasPassed) {
    return (
      <CourseCompleteSuccess
        orgSlug={orgSlug}
        courseTitle={courseTitle}
        totalSP={totalSP}
        hasCertificate={hasCertificate}
        onBackToDashboard={onBackToDashboard}
        backLabel={backLabel}
        showBranding={showBranding}
      />
    );
  }

  return (
    <CourseCompleteFail
      courseTitle={courseTitle}
      achievedScorePct={achievedScorePct}
      requiredScorePct={requiredScorePct}
      triesCount={triesCount}
      maxTries={maxTries}
      onBackToDashboard={onBackToDashboard}
      backLabel={backLabel}
      onRestart={onRestart}
      isRestartPending={isRestartPending}
      showBranding={showBranding}
    />
  );
}
