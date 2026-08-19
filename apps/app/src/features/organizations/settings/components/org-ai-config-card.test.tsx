import type { OrgSettingsPage } from "../i18n/org-settings.types";

import { render, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OrgAIConfigCard } from "./org-ai-config-card";

const useQuery = vi.hoisted(() => vi.fn());
const useController = vi.hoisted(() => vi.fn());

const renderNothing = vi.hoisted(() => () => null);

vi.mock("@/shared/api/trpc/client", () => ({
  api: { billing: { getFeatureAccess: { useQuery } } },
}));
vi.mock("./use-org-ai-config-controller", () => ({
  useOrgAiConfigController: useController,
}));
vi.mock("./org-ai-model-dialog", () => ({ OrgAIModelDialog: renderNothing }));
vi.mock("./delete-model-dialog", () => ({
  DeleteModelDialog: renderNothing,
}));

const t = {
  title: "AI configuration",
  description: "Connect your own endpoints",
  chatModelsTab: "Chat",
  imageTab: "Images",
  chatSectionDescription: "Chat models",
  defaultChatModelScibly: "Scibly",
  defaultChatModelSciblyDescription: "Managed",
  addChatModelButton: "Add chat model",
  managedBadge: "Managed",
  byoaiLockedTitle: "Own endpoints are included from {plan}",
  byoaiLockedDescription: "Upgrade to {plan} to connect one.",
  byoaiLockedFallbackPlan: "a paid plan",
  byoaiLapsedTitle: "Your subscription has lapsed",
  byoaiLapsedDescription: "Renew to use your own endpoints again.",
  byoaiLockedRemovalNote: "You can still remove endpoints you added.",
} as OrgSettingsPage["aiConfig"];

function answers(byoai: unknown) {
  useQuery.mockReturnValue({
    data: byoai === undefined ? undefined : { byoai },
  });
}

const card = () => render(<OrgAIConfigCard orgSlug="acme" t={t} />);

const addButton = () =>
  within(card().container)
    .getByText("Add chat model")
    .closest("button") as HTMLButtonElement;

const noEndpoints = {
  activeTab: "chat",
  setActiveTab: () => {},
  chatModels: [],
  imageModels: [],
  preferences: { defaultChatModelId: null },
  isSciblyDefaultChatActive: true,
  isDefaultChatPending: false,
  isImagePending: false,
  dialogState: null,
  credentialSources: [],
  isSaving: false,
  setDefaultChatModel: () => {},
  setActiveImageModel: () => {},
  openEditDialog: () => {},
  setDeleteTarget: () => {},
  openAddForTab: () => {},
  handleDialogSave: () => {},
  setDialogState: () => {},
};

beforeEach(() => {
  vi.clearAllMocks();
  useController.mockReturnValue(noEndpoints);
  answers({ allowed: true, reason: null, requiredPlan: "Business" });
});

describe("the notice appears exactly when the plan excludes BYOAI", () => {
  it("shows it to an organization the gate would refuse", () => {
    answers({
      allowed: false,
      reason: "not_in_plan",
      requiredPlan: "Business",
    });

    expect(card().container.textContent).toContain(
      "Own endpoints are included from Business",
    );
  });

  it("shows nothing to an organization whose plan includes it", () => {
    expect(card().container.textContent).not.toContain(
      "Own endpoints are included",
    );
  });

  it("disables adding under the lock and leaves it open otherwise", () => {
    answers({
      allowed: false,
      reason: "not_in_plan",
      requiredPlan: "Business",
    });
    const lockedAdd = addButton();
    answers({ allowed: true, reason: null, requiredPlan: "Business" });
    const openAdd = addButton();

    expect([lockedAdd.disabled, openAdd.disabled]).toEqual([true, false]);
  });
});

describe("an unanswered query accuses nobody", () => {
  it("shows no notice while the plan is still being read", () => {
    answers(undefined);

    expect(card().container.textContent).not.toContain(
      "Own endpoints are included",
    );
  });

  it("leaves adding open while the plan is still being read", () => {
    answers(undefined);

    expect(addButton().disabled).toBe(false);
  });
});
