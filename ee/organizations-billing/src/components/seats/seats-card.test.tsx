import type { OrgBillingPage } from "../../i18n/org-billing.types";

import { MAX_SEAT_PURCHASE } from "@scibly/ee-billing/plan-catalogue";
import { act, fireEvent, render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SeatsCard } from "./seats-card";

const useQuery = vi.hoisted(() => vi.fn());
const previewQuery = vi.hoisted(() => vi.fn());
const mutate = vi.hoisted(() => vi.fn());
const useMutation = vi.hoisted(() => vi.fn());
const invalidateOverview = vi.hoisted(() => vi.fn());
const invalidateAccess = vi.hoisted(() => vi.fn());
const searchParams = vi.hoisted(() => new Map<string, string>());

vi.mock("@/shared/api/trpc/client", () => ({
  api: {
    useUtils: () => ({
      billing: {
        getUsageOverview: { invalidate: invalidateOverview },
        getFeatureAccess: { invalidate: invalidateAccess },
      },
    }),
    billing: {
      getStatus: { useQuery },
      previewLearnerSeats: { useQuery: previewQuery },
      purchaseLearnerSeats: { useMutation },
    },
  },
}));
vi.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: (key: string) => searchParams.get(key) ?? null,
  }),
}));

const t = {
  title: "Learner seats",
  description: "Who can be enrolled.",
  usedOfCapacity: "{used} of {capacity} seats used",
  included: "{included} included, {purchased} purchased",
  none: "This plan includes no learner seats.",
  pricePerSeat: "€{price} per seat per month",
  vatNote: "excl. VAT",
  quantityLabel: "Seats",
  buyButton: "Buy seats",
  prorationNote: "You see the price before anything is charged.",
  unavailableNote: "Seats are sold on a paid plan.",
  purchaseSuccess: "Seats added — {purchased} purchased in total.",
  purchaseFailed: "The purchase failed.",
  confirmTitle: "Add {quantity} learner seats?",
  confirmLoading: "Working out what this costs…",
  confirmFailed: "We could not work out the price just now.",
  confirmChargeNow:
    "€{amount} plus VAT is charged now — {quantity} seats for the rest of the period.",
  confirmRenewal:
    "From {date} your plan carries {seats} seats at €{recurring} a month.",
  confirmRenewalNoDate:
    "From the next renewal your plan carries {seats} seats at €{recurring} a month.",
  confirmAction: "Pay €{amount}",
  confirmActionPending: "Pay",
  confirmCancel: "Cancel",
} satisfies OrgBillingPage["seats"];

const seats = { used: 40, capacity: 50, included: 50, purchased: 0 };

function status(
  data:
    | {
        seatsSellable?: boolean;
        extraSeatPriceCents?: number | null;
      }
    | undefined,
) {
  useQuery.mockReturnValue({
    data: data && {
      seatsSellable: data.seatsSellable ?? true,
      extraSeatPriceCents:
        data.extraSeatPriceCents === undefined ? 200 : data.extraSeatPriceCents,
    },
  });
}

function quote(
  data:
    | {
        amountDueCents?: number;
        recurringCents?: number;
        seatsAfter?: number;
        periodEnd?: Date | null;
      }
    | "pending"
    | "failed",
) {
  previewQuery.mockReturnValue({
    data:
      typeof data === "string"
        ? undefined
        : {
            amountDueCents: data.amountDueCents ?? 13_333,
            recurringCents: data.recurringCents ?? 20_000,
            seatsAfter: data.seatsAfter ?? 100,
            periodEnd:
              data.periodEnd === undefined
                ? new Date("2026-08-26T00:00:00Z")
                : data.periodEnd,
          },
    isError: data === "failed",
  });
}

const card = (overrides: Partial<typeof seats> = {}) =>
  render(
    <SeatsCard
      orgSlug="acme"
      seats={{ ...seats, ...overrides }}
      lang="en"
      t={t}
    />,
  );

const seatField = (rendered: ReturnType<typeof card>) =>
  rendered.container.querySelector("input") as HTMLInputElement;

beforeEach(() => {
  vi.clearAllMocks();
  searchParams.clear();
  status({});
  quote({});
  useMutation.mockReturnValue({ mutate, isPending: false });
});

describe("LU1 — the price sits beside the count it changes", () => {
  it("says what one more seat costs per month", () => {
    expect(card().container.textContent).toContain("€2.00 per seat per month");
  });

  it("still reports what is used against what is owned", () => {
    expect(card().container.textContent).toContain("40 of 50 seats used");
  });
});

describe("LB7 — the button is the owner's, and nobody else is here", () => {
  it("offers the owner a way to buy", () => {
    expect(card().queryByText("Buy seats")).not.toBeNull();
  });
});

describe("LU5/LU6 — the shortfall arrives as a default, not a charge", () => {
  it("pre-fills the field with the number the refusal carried", () => {
    searchParams.set("seats", "7");

    expect(seatField(card()).value).toBe("7");

    expect(mutate).not.toHaveBeenCalled();
  });

  it("buys what the owner confirms, not what the URL said", () => {
    searchParams.set("seats", "7");
    const rendered = card();

    fireEvent.change(seatField(rendered), { target: { value: "3" } });
    fireEvent.click(rendered.getByText("Buy seats"));
    fireEvent.click(rendered.getByText("Pay €133.33"));

    expect(mutate).toHaveBeenCalledWith({ orgSlug: "acme", quantity: 3 });
  });

  it.each([
    ["a missing number", null, "1"],
    ["nonsense", "many", "1"],
    ["zero", "0", "1"],
    ["a negative", "-4", "1"],
    ["a fraction", "2.5", "1"],
    ["more than one purchase may add", "99999", String(MAX_SEAT_PURCHASE)],
  ])("clamps %s to a sane default", (_case, raw, expected) => {
    if (raw !== null) searchParams.set("seats", raw);

    expect(seatField(card()).value).toBe(expected);
  });
});

describe("LU9/LU10 — the charge is put to the owner before it is made", () => {
  function ask(quantity = "100") {
    const rendered = card();
    fireEvent.change(seatField(rendered), { target: { value: quantity } });
    fireEvent.click(rendered.getByText("Buy seats"));
    return rendered;
  }

  it("buys nothing on the click that asks", () => {
    ask();

    expect(mutate).not.toHaveBeenCalled();
  });

  it("names the pro-rata amount, the seats it buys and what recurs", () => {
    const text = ask().baseElement.textContent ?? "";

    expect(text).toContain(
      "€133.33 plus VAT is charged now — 100 seats for the rest of the period.",
    );
    expect(text).toContain(
      "From August 26, 2026 your plan carries 100 seats at €200.00 a month.",
    );
    expect(text).not.toContain("{");
  });

  it("asks the price of the seats in the field, not the ones in the URL", () => {
    searchParams.set("seats", "7");
    const rendered = card();
    fireEvent.change(seatField(rendered), { target: { value: "12" } });
    fireEvent.click(rendered.getByText("Buy seats"));

    expect(previewQuery).toHaveBeenLastCalledWith(
      { orgSlug: "acme", quantity: 12 },
      expect.objectContaining({ enabled: true }),
    );
  });

  it("asks Stripe nothing until a purchase is being weighed", () => {
    card();

    expect(previewQuery).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({ enabled: false }),
    );
  });

  it("offers nothing to confirm while the price is being fetched", () => {
    quote("pending");

    const rendered = ask();

    expect(rendered.getByText("Working out what this costs…")).not.toBeNull();
    fireEvent.click(rendered.getByText("Pay"));
    expect(mutate).not.toHaveBeenCalled();
  });

  it("offers nothing to confirm when the price cannot be had", () => {
    quote("failed");

    const rendered = ask();

    expect(
      rendered.getByText("We could not work out the price just now."),
    ).not.toBeNull();
    fireEvent.click(rendered.getByText("Pay"));
    expect(mutate).not.toHaveBeenCalled();
  });

  it("names the renewal without inventing a date Stripe did not give", () => {
    quote({ periodEnd: null });

    const text = ask().baseElement.textContent ?? "";

    expect(text).toContain(
      "From the next renewal your plan carries 100 seats at €200.00 a month.",
    );
  });

  it("prices a sane number even when the field holds nonsense", () => {
    const rendered = card();
    fireEvent.change(seatField(rendered), { target: { value: "0" } });
    fireEvent.click(rendered.getByText("Buy seats"));

    expect(previewQuery).toHaveBeenLastCalledWith(
      { orgSlug: "acme", quantity: 1 },
      expect.anything(),
    );
  });

  it("closes once the purchase goes through, so it cannot be paid twice", () => {
    const rendered = ask();

    act(() => useMutation.mock.calls[0][0].onSuccess({ purchasedSeats: 100 }));

    expect(rendered.baseElement.textContent).not.toContain("Pay €133.33");
  });

  it("closes when the purchase fails, leaving the toast to explain", () => {
    const rendered = ask();

    act(() => useMutation.mock.calls[0][0].onError(new Error("declined")));

    expect(rendered.baseElement.textContent).not.toContain("Pay €133.33");
  });

  it("charges nothing when the owner backs out", () => {
    const rendered = ask();

    fireEvent.click(rendered.getByText("Cancel"));

    expect(mutate).not.toHaveBeenCalled();
    expect(rendered.baseElement.textContent).not.toContain("Pay €133.33");
  });
});

describe("LU7 — what a purchase changes is re-asked", () => {
  it("refreshes the page's numbers and the enrollment gate", () => {
    card();

    useMutation.mock.calls[0][0].onSuccess({ purchasedSeats: 7 });

    expect(invalidateOverview).toHaveBeenCalledWith({ orgSlug: "acme" });
    expect(invalidateAccess).toHaveBeenCalledWith({ orgSlug: "acme" });
  });
});

describe("LU8 — a plan with no seats is not offered one more", () => {
  it("explains the ratio it cannot show, and sells nothing", () => {
    const rendered = card({ capacity: 0, included: 0, used: 0 });

    expect(rendered.container.textContent).toContain(
      "This plan includes no learner seats.",
    );
    expect(rendered.queryByText("Buy seats")).toBeNull();
  });

  it("LB8: names the way out when the plan sells no extra seats", () => {
    status({ seatsSellable: false, extraSeatPriceCents: null });

    const rendered = card();

    expect(
      rendered.queryByText("Seats are sold on a paid plan."),
    ).not.toBeNull();
    expect(rendered.queryByText("Buy seats")).toBeNull();
  });

  it("claims nothing while the status is unanswered", () => {
    status(undefined);

    const rendered = card();

    expect(rendered.queryByText("Buy seats")).toBeNull();
    expect(rendered.container.textContent).not.toContain("per seat per month");
  });
});
