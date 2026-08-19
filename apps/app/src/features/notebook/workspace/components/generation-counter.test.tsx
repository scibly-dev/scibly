import type { NotebookTranslations } from "../../i18n/notebook.types";

import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GenerationCounter } from "./generation-counter";

const useQuery = vi.hoisted(() => vi.fn());
const useStatusQuery = vi.hoisted(() => vi.fn());

vi.mock("@/shared/api/trpc/client", () => ({
  api: {
    billing: {
      getGenerationBalance: { useQuery },
      getStatus: { useQuery: useStatusQuery },
    },
  },
}));

const t = {
  page: { generationsLeft: "{count} AI generations left" },
} as NotebookTranslations;

function balance(data: { remaining: number | null } | undefined) {
  useQuery.mockReturnValue({ data });
}

function viewer(canManageBilling: boolean) {
  useStatusQuery.mockReturnValue({ data: { canManageBilling } });
}

const counter = () => render(<GenerationCounter orgSlug="acme" t={t} />);

const balanceQueryOptions = () =>
  useQuery.mock.calls[0]?.[1] as { enabled: boolean };

beforeEach(() => {
  vi.clearAllMocks();
  viewer(true);
  balance({ remaining: 0 });
});

describe("GB1 — the author reads one number", () => {
  it("shows what the organization has left", () => {
    balance({ remaining: 165 });

    expect(counter().container.textContent).toContain("165");
  });

  it("names what the number counts, for a chip that is otherwise a digit", () => {
    balance({ remaining: 165 });

    expect(counter().getByLabelText("165 AI generations left")).toBeDefined();
  });

  it("shows an empty pool as zero rather than hiding it", () => {
    balance({ remaining: 0 });

    expect(counter().container.textContent).toContain("0");
  });
});

describe("GB13 — an unknown balance is shown as nothing", () => {
  it("renders no counter while the balance is still loading", () => {
    balance(undefined);

    expect(counter().container.textContent).toBe("");
  });

  it("renders no counter for an organization with no credit row", () => {
    balance({ remaining: null });

    expect(counter().container.textContent).toBe("");
  });
});

describe("GB15 — the pool is shown to whoever can act on it", () => {
  it("shows no counter to a member who is neither owner nor admin", () => {
    viewer(false);
    balance(undefined);

    expect(counter().container.textContent).toBe("");
  });

  it("asks for no balance a member would be refused", () => {
    viewer(false);

    counter();

    expect(balanceQueryOptions().enabled).toBe(false);
  });

  it("asks for none until the viewer's role is known", () => {
    useStatusQuery.mockReturnValue({ data: undefined });

    counter();

    expect(balanceQueryOptions().enabled).toBe(false);
  });
});

describe("GB11 — the shared pool is re-read without an event of ours", () => {
  it("re-reads on mount and when the window regains focus", () => {
    counter();

    expect(useQuery).toHaveBeenCalledWith(
      { orgSlug: "acme" },
      expect.objectContaining({
        refetchOnMount: "always",
        refetchOnWindowFocus: "always",
      }),
    );
  });
});
