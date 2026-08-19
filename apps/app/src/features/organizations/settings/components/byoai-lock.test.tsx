import type { GateDecision } from "@/features/organizations/contracts";
import type { OrgByoaiModel } from "@/shared/ai/byoai/types";
import type { OrgSettingsPage } from "../i18n/org-settings.types";

import { Tabs } from "@scibly/ui/components/tabs";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ByoaiUpgradeNotice } from "./byoai-upgrade-notice";
import { OrgAiChatModelsTab } from "./org-ai-chat-models-tab";

const t = {
  byoaiLockedTitle: "Own endpoints are included from {plan}",
  byoaiLockedDescription: "Upgrade to {plan} to connect one.",
  byoaiLockedFallbackPlan: "a paid plan",
  byoaiLapsedTitle: "Your subscription has lapsed",
  byoaiLapsedDescription: "Renew to use your own endpoints again.",
  byoaiLockedRemovalNote: "You can still remove endpoints you added.",
  chatSectionDescription: "Chat models",
  defaultChatModelScibly: "Scibly",
  defaultChatModelSciblyDescription: "Managed",
  addChatModelButton: "Add chat model",
  managedBadge: "Managed",
  editButton: "Edit",
  removeButton: "Remove",
  endpointActionsLabel: "Actions for",
} as OrgSettingsPage["aiConfig"];

const locked: GateDecision = {
  allowed: false,
  reason: "not_in_plan",
  requiredPlan: "Business",
};

const notice = (
  access: GateDecision,
  { hasEndpoints = false }: { hasEndpoints?: boolean } = {},
) =>
  render(
    <ByoaiUpgradeNotice access={access} hasEndpoints={hasEndpoints} t={t} />,
  );

const model = {
  id: "m-1",
  name: "In-house chat",
  modelId: "gpt-x",
  lastTestStatus: null,
} as OrgByoaiModel;

function chatTab(isLocked: boolean) {
  return render(
    <Tabs value="chat">
      <OrgAiChatModelsTab
        t={t}
        chatModels={[model]}
        defaultChatModelId={null}
        isSciblyDefaultChatActive
        isPending={false}
        isLocked={isLocked}
        onSetDefault={() => {}}
        onEdit={() => {}}
        onDelete={() => {}}
        onAdd={() => {}}
      />
    </Tabs>,
  );
}

describe("the plan is named before the form is filled in", () => {
  it("names the tier the gate would demand", () => {
    expect(notice(locked).container.textContent).toContain("Business");
  });

  it("falls back to a generic plan when the catalogue sells none", () => {
    const text = notice({ ...locked, requiredPlan: null }).container
      .textContent;

    expect(text).toContain("a paid plan");
    expect(text).not.toContain("{plan}");
  });
});

describe("a lapsed subscription is not an upsell", () => {
  it("says the subscription lapsed instead of naming a tier to buy", () => {
    const text = notice({ ...locked, reason: "lapsed" }).container.textContent;

    expect(text).toContain("Your subscription has lapsed");
    expect(text).not.toContain("Business");
  });
});

describe("what is left behind can still be removed", () => {
  it("says so when endpoints exist", () => {
    expect(
      notice(locked, { hasEndpoints: true }).container.textContent,
    ).toContain("You can still remove endpoints you added.");
  });

  it("stays quiet when there is nothing to remove", () => {
    expect(notice(locked).container.textContent).not.toContain(
      "You can still remove endpoints you added.",
    );
  });
});

describe("locking closes configuration, never the way out", () => {
  it("stops an endpoint being adopted", () => {
    const radio = chatTab(true).container.querySelector("#chat-m-1");

    expect((radio as HTMLInputElement).disabled).toBe(true);
  });

  it("stops another being added", () => {
    const add = chatTab(true)
      .getByText("Add chat model")
      .closest("button") as HTMLButtonElement;

    expect(add.disabled).toBe(true);
  });

  it("leaves the row reachable, so Remove is still clickable", () => {
    const { getByLabelText } = chatTab(true);

    expect(
      getByLabelText("Actions for In-house chat").closest(
        ".pointer-events-none",
      ),
    ).toBeNull();
  });

  it("leaves the managed Scibly option selectable, so a downgrade is escapable", () => {
    const scibly = chatTab(true).container.querySelector("#chat-scibly");

    expect((scibly as HTMLInputElement).disabled).toBe(false);
  });

  it("opens everything again once the plan includes it", () => {
    const { container, getByText } = chatTab(false);

    expect(
      (container.querySelector("#chat-m-1") as HTMLInputElement).disabled,
    ).toBe(false);
    expect(
      (getByText("Add chat model").closest("button") as HTMLButtonElement)
        .disabled,
    ).toBe(false);
  });
});
