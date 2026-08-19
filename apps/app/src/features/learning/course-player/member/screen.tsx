import { hasAppErrorCode } from "@scibly/api/application-error";
import { getSession } from "@scibly/auth/session";
import { routes } from "@scibly/routes";
import { notFound, redirect } from "next/navigation";

import { api, HydrateClient } from "@/shared/api/trpc/server";

import { LearnPageClient } from "./learn-page-client";
import { SessionConfirmationScreen } from "./learn-page-client/components/session-confirmation-screen";

export async function MemberCoursePlayerScreen({
  orgSlug,
  courseId,
}: {
  orgSlug: string;
  courseId: string;
}) {
  const session = await getSession();
  if (!session?.user) redirect(routes.app.auth.default);

  let pendingConfirmation:
    | { mode: "retry" | "version-update"; courseTitle: string }
    | undefined;

  try {
    const learningSession = await api.learning.openLearningSession({
      courseId,
    });
    if (learningSession.pendingAction) {
      pendingConfirmation = {
        mode: learningSession.pendingAction,
        courseTitle: learningSession.courseTitle,
      };
    } else {
      void api.learning.getLearnerCourse.prefetch({ courseId });
      void api.sceneProgress.getLearnerProgress.prefetch({ courseId });
    }
  } catch (error) {
    if (hasAppErrorCode(error, "NOT_FOUND")) notFound();
    throw error;
  }

  if (pendingConfirmation) {
    return (
      <SessionConfirmationScreen
        mode={pendingConfirmation.mode}
        orgSlug={orgSlug}
        courseId={courseId}
        courseTitle={pendingConfirmation.courseTitle}
      />
    );
  }

  return (
    <HydrateClient>
      <LearnPageClient orgSlug={orgSlug} courseId={courseId} />
    </HydrateClient>
  );
}
