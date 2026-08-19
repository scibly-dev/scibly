import type { OrgBillingPage } from "../../i18n/org-billing.types";

import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useTopupReturn } from "./use-topup-return";

const mutate = vi.hoisted(() => vi.fn());
const useMutation = vi.hoisted(() => vi.fn());
const toastSuccess = vi.hoisted(() => vi.fn());
const toastMessage = vi.hoisted(() => vi.fn());

const invalidate = vi.hoisted(() => ({
  getUsageOverview: vi.fn(),
  getStatus: vi.fn(),
  getAllowanceWarning: vi.fn(),
  getGenerationBalance: vi.fn(),
  getFeatureAccess: vi.fn(),
}));

vi.mock("@/shared/api/trpc/client", () => ({
  api: {
    useUtils: () => ({
      billing: {
        getUsageOverview: { invalidate: invalidate.getUsageOverview },
        getStatus: { invalidate: invalidate.getStatus },
        getAllowanceWarning: { invalidate: invalidate.getAllowanceWarning },
        getGenerationBalance: { invalidate: invalidate.getGenerationBalance },
        getFeatureAccess: { invalidate: invalidate.getFeatureAccess },
      },
    }),
    billing: { claimTopupPurchase: { useMutation } },
  },
}));
vi.mock("sonner", () => ({
  toast: { success: toastSuccess, message: toastMessage },
}));

const t = {
  title: "Top up",
  description: "Buy generations on top of the plan's monthly allowance.",
  unavailableDescription: "Top-ups are sold on a paid plan.",
  packCredits: "{credits} generations",
  packPrice: "€{price}",
  vatNote: "excl. VAT",
  buyButton: "Buy",
  upgradeNote: "A bigger plan costs less per generation.",
  checkoutFailed: "We could not start the checkout.",
  purchaseConfirmed: "Your generations have been added.",
  purchasePending: "Your payment is still settling.",
} satisfies OrgBillingPage["topup"];

const arriveAt = (search: string) =>
  window.history.replaceState(null, "", `/app/acme/billing${search}`);

const returnToBilling = () => renderHook(() => useTopupReturn("acme", t));

const callbacks = () =>
  mutate.mock.calls[0][1] as {
    onSuccess: (result: { granted: boolean }) => void;
    onError: () => void;
    onSettled: () => void;
  };

beforeEach(() => {
  vi.clearAllMocks();
  useMutation.mockReturnValue({ mutate });
  arriveAt("");
});

describe("TU9 — an abandoned checkout comes back saying nothing", () => {
  it("claims nothing when the return carries no session", () => {
    returnToBilling();

    expect(mutate).not.toHaveBeenCalled();
    expect(toastSuccess).not.toHaveBeenCalled();
    expect(toastMessage).not.toHaveBeenCalled();
  });
});

describe("TC6/TU8 — the return claims the purchase it was sent back with", () => {
  it("claims the session named in the URL, for this organization", () => {
    arriveAt("?topup=cs_test_123");

    returnToBilling();

    expect(mutate).toHaveBeenCalledWith(
      { orgSlug: "acme", sessionId: "cs_test_123" },
      expect.anything(),
    );
  });

  it("claims once, however often the page re-renders", () => {
    arriveAt("?topup=cs_test_123");

    const { rerender } = returnToBilling();
    rerender();
    rerender();

    expect(mutate).toHaveBeenCalledTimes(1);
  });
});

describe("TG3/TG5 — what the buyer is told, and what is re-read", () => {
  beforeEach(() => {
    arriveAt("?topup=cs_test_123");
    returnToBilling();
  });

  it("confirms a grant the claim made", () => {
    act(() => callbacks().onSuccess({ granted: true }));

    expect(toastSuccess).toHaveBeenCalledWith(t.purchaseConfirmed);
  });

  it("says the payment is still settling when nothing was granted", () => {
    act(() => callbacks().onSuccess({ granted: false }));

    expect(toastSuccess).toHaveBeenCalledWith(t.purchasePending);
  });

  it("leaves the webhook to credit a claim that could not be made", () => {
    act(() => callbacks().onError());

    expect(toastMessage).toHaveBeenCalledWith(t.purchasePending);
  });

  it("TU10: re-reads every number the purchase moved, and nothing else", () => {
    act(() => callbacks().onSuccess({ granted: true }));

    for (const query of [
      invalidate.getUsageOverview,
      invalidate.getStatus,
      invalidate.getAllowanceWarning,
      invalidate.getGenerationBalance,
    ]) {
      expect(query).toHaveBeenCalledWith({ orgSlug: "acme" });
    }
    expect(invalidate.getFeatureAccess).not.toHaveBeenCalled();
  });

  it("takes the session out of the URL once the claim has settled", () => {
    act(() => callbacks().onSettled());

    expect(window.location.search).toBe("");
    expect(window.location.pathname).toBe("/app/acme/billing");
  });
});
