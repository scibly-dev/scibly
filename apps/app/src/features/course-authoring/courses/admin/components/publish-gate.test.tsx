import type { CoursesTranslations } from "@/features/course-authoring/contracts";
import type { GateDecision } from "@/features/organizations/contracts";

import { routes } from "@scibly/routes";
import { render, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PublishCourseDialog } from "./course-admin-hero";

const t = {
  detail: {
    publishDialog: {
      title: "Publish course",
      description: "A new version will be created.",
      gateDialogDescription: "Publishing is not included in your plan.",
      gateTitle: "Publishing needs {{plan}} or above",
      gateDescription: "Upgrade to {{plan}} to publish this course.",
      gateLapsedTitle: "Your subscription has lapsed",
      gateLapsedDescription: "Renew to publish again.",
      gateFallbackPlan: "a paid plan",
      gateViewPlans: "View plans",
      supersedeLabel: "Invalidate previous version",
      supersedeDescription: "Learners restart the course.",
      cancel: "Cancel",
      publishing: "Publishing…",
      confirmPublish: "Publish",
      confirmForce: "Publish anyway",
    },
  },
} as CoursesTranslations;

const gated: GateDecision = {
  allowed: false,
  reason: "not_in_plan",
  requiredPlan: "Starter",
};

const onPublish = vi.fn();

function dialog(gate: GateDecision | null) {
  const { baseElement } = render(
    <PublishCourseDialog
      blockedReason={null}
      gate={gate}
      supersedePrevious={false}
      onClose={() => {}}
      onSupersedeChange={() => {}}
      onOpenChange={() => {}}
      onPublish={onPublish}
      open
      orgSlug="acme"
      pending={false}
      t={t}
    />,
  );
  return within(baseElement);
}

describe("SP1 — the confirm action is gone, not merely refused later", () => {
  it("offers no Publish button to a plan that excludes publishing", () => {
    expect(dialog(gated).queryByText("Publish")).toBeNull();
  });

  it("offers no invalidate checkbox either", () => {
    expect(dialog(gated).queryByText("Invalidate previous version")).toBeNull();
  });

  it("keeps both for a plan that includes publishing", () => {
    const open = dialog(null);

    expect(open.queryByText("Publish")).not.toBeNull();
    expect(open.queryByText("Invalidate previous version")).not.toBeNull();
  });

  it("names the tier the gate would demand", () => {
    expect(
      dialog(gated).queryByText("Publishing needs Starter or above"),
    ).not.toBeNull();
  });

  it("falls back to a generic plan when the catalogue sells none", () => {
    const text = dialog({ ...gated, requiredPlan: null }).getByRole(
      "dialog",
    ).textContent;

    expect(text).toContain("a paid plan");
    expect(text).not.toContain("{{plan}}");
  });
});

describe("SP2 — the only way out offered is a plan", () => {
  it("links to the organization's settings, where plans are bought", () => {
    const link = dialog(gated).getByText("View plans").closest("a");

    expect(link?.getAttribute("href")).toBe(
      routes.app.profile.org("acme").billing,
    );
  });
});

describe("SP3 — the description explains the refusal, not versioning", () => {
  it("swaps the wording under the gate", () => {
    const text = dialog(gated).getByRole("dialog").textContent;

    expect(text).toContain("Publishing is not included in your plan.");
    expect(text).not.toContain("A new version will be created.");
  });

  it("keeps the usual wording otherwise", () => {
    expect(dialog(null).getByRole("dialog").textContent).toContain(
      "A new version will be created.",
    );
  });
});

describe("SP5 — a lapsed subscription is not an upsell", () => {
  it("says the subscription lapsed instead of naming a tier to buy", () => {
    const text = dialog({ ...gated, reason: "lapsed" }).getByRole(
      "dialog",
    ).textContent;

    expect(text).toContain("Your subscription has lapsed");
    expect(text).not.toContain("Starter");
  });
});
