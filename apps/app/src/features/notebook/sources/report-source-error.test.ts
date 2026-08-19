import { beforeEach, describe, expect, it, vi } from "vitest";

import en from "./i18n/sources.i18n.en.json";
import { reportSourceError } from "./report-source-error";

const toastError = vi.hoisted(() => vi.fn());

vi.mock("sonner", () => ({ toast: { error: toastError } }));

const copy = en.notebook.sources.entitlement;

const refusal = (applicationCode: string, details?: unknown) => ({
  message: "An English sentence written for whoever reads the logs.",
  data: { applicationCode, details },
});

const report = (error: Parameters<typeof reportSourceError>[1]) =>
  reportSourceError("[test]", error, copy);

const shown = () => toastError.mock.calls.at(-1)?.[0] as string | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

describe("SD12 — the refusal is read in the reader's language", () => {
  it("never shows the server's own sentence", () => {
    report(refusal("entitlement.source_cap_exhausted", { shortfall: 2 }));

    expect(shown()).not.toContain("written for whoever reads the logs");
    expect(console.error).not.toHaveBeenCalled();
  });

  it("counts the sources the notebook has no room for", () => {
    report(
      refusal("entitlement.source_cap_exhausted", {
        shortfall: 3,
        remainingSources: 1,
      }),
    );

    expect(shown()).toBe(copy.sourceCapMany.replace("{shortfall}", "3"));
  });

  it("says it in the singular when one source is over", () => {
    report(refusal("entitlement.source_cap_exhausted", { shortfall: 1 }));

    expect(shown()).toBe(copy.sourceCapOne);
  });

  it("quotes the price and the balance a batch cannot pay", () => {
    report(
      refusal("entitlement.credits_exhausted", {
        sources: 4,
        credits: 4,
        balance: 1,
      }),
    );

    expect(shown()).toContain("4 sources");
    expect(shown()).toContain("balance is 1");
  });

  it("still answers when the refusal came from the debit and carries no numbers", () => {
    report(refusal("entitlement.credits_exhausted"));

    expect(shown()).toBe(copy.creditsNone);
  });
});

describe("SD7 — everything else stays in the console", () => {
  it("does not toast our own bug", () => {
    report({ message: "boom", data: { applicationCode: null } });

    expect(toastError).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled();
  });

  it("SD12: keeps an entitlement code we have no copy for out of the toast", () => {
    report(refusal("entitlement.unresolvable"));

    expect(toastError).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled();
  });
});
