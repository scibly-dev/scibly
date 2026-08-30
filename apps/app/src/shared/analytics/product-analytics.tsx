"use client";

import type { RouterMutationPath } from "@/shared/api/trpc/contracts";

import { usePostHog } from "@scibly/observability/client";
import { PLAN_CHECKOUT_QUERY_PARAM } from "@scibly/routes";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

type TrackedMutation = { event: string; kind?: string };

// Untracked is the default: a row here should mean someone has a question it answers.
const TRACKED_MUTATIONS = {
  "course.create": { event: "course_created" },
  "course.createLesson": { event: "lesson_created" },
  "course.publishCourse": { event: "course_published" },
  "course.enrollMembers": { event: "learners_enrolled" },

  "notebook.source.addText": { event: "source_added" },
  "notebook.source.confirmUpload": { event: "source_added" },

  "learning.openLearningSession": { event: "course_started" },
  "sceneProgress.completeScene": { event: "scene_completed" },

  "organization.create": { event: "organization_created" },
  "organization.inviteMembers": { event: "members_invited" },
  "organization.acceptInvitation": { event: "invitation_accepted" },

  // Topup leaves for Stripe, so its completion only lands when useTopupReturn claims the session.
  "billing.startTopupCheckout": { event: "checkout_started", kind: "topup" },
  "billing.claimTopupPurchase": { event: "checkout_completed", kind: "topup" },
  "billing.purchaseLearnerSeats": {
    event: "checkout_completed",
    kind: "seats",
  },

  "integration.linkPages": { event: "integration_pages_linked" },

  "knowledge.create": { event: "knowledge_topic_created" },
  "knowledge.update": { event: "knowledge_topic_updated" },
  "knowledge.delete": { event: "knowledge_topic_deleted" },
} satisfies Partial<Record<RouterMutationPath, TrackedMutation>>;

const TRACKED_BY_PATH = new Map<string, TrackedMutation>(
  Object.entries(TRACKED_MUTATIONS),
);

// orgSlug is not here: AnalyticsArea puts the organization on every event already.
const TRACKED_INPUTS = ["pack", "quantity"];

function trackedInputsOf(variables: unknown) {
  const properties: Record<string, string | number> = {};
  if (typeof variables !== "object" || variables === null) return properties;

  for (const [key, value] of Object.entries(variables)) {
    if (!TRACKED_INPUTS.includes(key)) continue;
    if (typeof value === "string" || typeof value === "number") {
      properties[key] = value;
    }
  }
  return properties;
}

export function ProductAnalytics() {
  const posthog = usePostHog();
  const queryClient = useQueryClient();

  // A subscription upgrade completes at Stripe, so the returning tab is the only thing left to report it.
  useEffect(() => {
    const url = new URL(window.location.href);
    const plan = url.searchParams.get(PLAN_CHECKOUT_QUERY_PARAM);
    if (!plan) return;

    posthog.capture("checkout_completed", { kind: "plan", plan });

    // Drop the marker so a refresh doesn't report the same upgrade twice.
    url.searchParams.delete(PLAN_CHECKOUT_QUERY_PARAM);
    window.history.replaceState(null, "", url);
  }, [posthog]);

  useEffect(
    () =>
      queryClient.getMutationCache().subscribe((event) => {
        if (event.type !== "updated" || event.action.type !== "success") return;

        const path = event.mutation.options.mutationKey?.[0];
        if (!Array.isArray(path)) return;

        const tracked = TRACKED_BY_PATH.get(path.join("."));
        if (!tracked) return;

        posthog.capture(tracked.event, {
          kind: tracked.kind,
          ...trackedInputsOf(event.mutation.state.variables),
        });
      }),
    [posthog, queryClient],
  );

  return null;
}
