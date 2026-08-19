import type { OrgSettingsPage } from "../i18n/org-settings.types";

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { EMPTY_FORM, useOrgAiModelForm } from "./use-org-ai-model-form";

const idleMutation = vi.hoisted(() => () => ({
  mutate: vi.fn(),
  isPending: false,
}));

vi.mock("@/shared/api/trpc/client", () => ({
  api: {
    orgAiConfig: {
      listRemoteModels: { useMutation: idleMutation },
      testConnection: { useMutation: idleMutation },
    },
  },
}));

const t = { apiKeyPlaceholder: "sk-…" } as OrgSettingsPage["aiConfig"];

function addForm(onSave: (values: unknown) => void) {
  return renderHook(() =>
    useOrgAiModelForm({
      orgSlug: "acme",
      modelType: "CHAT",
      initial: EMPTY_FORM,
      isEdit: false,
      t,
      onSave,
    }),
  );
}

describe("useOrgAiModelForm", () => {
  it("submits the preset URL the locked field shows", async () => {
    const onSave = vi.fn();
    const { result } = addForm(onSave);

    act(() => {
      result.current.setValue("name", "My endpoint");
      result.current.setValue("modelId", "gpt-4o-mini");
      result.current.setValue("apiKey", "sk-test");
    });
    await act(async () => {
      await result.current.submit();
    });

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ baseUrl: "https://api.openai.com/v1" }),
    );
  });

  it("moves the field onto the preset that was picked", () => {
    const { result } = addForm(vi.fn());

    act(() => result.current.applyPreset("gemini"));

    expect(result.current.effectiveBaseUrl).toBe(
      "https://generativelanguage.googleapis.com/v1beta/openai",
    );
  });
});
