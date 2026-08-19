import { describe, expect, it } from "vitest";

import {
  ChatError,
  getChatErrorToastMessage,
  isQuotaExceededCreditsError,
} from "./errors";

function refusalFrom(error: ChatError): Error {
  const body = { code: error.applicationCode, message: error.message };
  return new Error(JSON.stringify(body));
}

const FALLBACK = "Wir konnten die Nachricht nicht senden.";

describe("what an author reads when a turn is refused", () => {
  it("CD4: a model the organization no longer offers points at the selector", () => {
    expect(
      getChatErrorToastMessage(
        refusalFrom(new ChatError("bad_request:model")),
        FALLBACK,
      ),
    ).toBe(
      "The selected AI model isn't available for this organization. Pick another model and try again.",
    );
  });

  it("CD4: being over the allowance says so rather than reading as an outage", () => {
    expect(
      getChatErrorToastMessage(
        refusalFrom(new ChatError("rate_limit:chat")),
        FALLBACK,
      ),
    ).toBe(
      "You're sending messages too quickly. Please wait a moment and try again.",
    );
  });

  it("CD4: what the server said outranks what the code generically means", () => {
    expect(
      getChatErrorToastMessage(
        new Error(
          JSON.stringify({
            code: "bad_request:model",
            message: 'The model "byoai:acme-gpt" was removed by your admin.',
          }),
        ),
        FALLBACK,
      ),
    ).toBe('The model "byoai:acme-gpt" was removed by your admin.');
  });

  it("CD4: a code that arrives without copy is still resolved to its own message", () => {
    expect(
      getChatErrorToastMessage(
        new Error(JSON.stringify({ code: "bad_request:model" })),
        FALLBACK,
      ),
    ).toContain("Pick another model");
  });

  it("CD4: a code nobody recognises reads as a generic failure, not as the code", () => {
    expect(
      getChatErrorToastMessage(
        new Error(JSON.stringify({ code: "quota_exceeded:widget" })),
        FALLBACK,
      ),
    ).toBe("Something went wrong. Please try again later.");
  });

  it("CD4: a failure that never reached the server falls back to the caller's own copy", () => {
    expect(
      getChatErrorToastMessage(new Error("Failed to fetch"), FALLBACK),
    ).toBe(FALLBACK);
  });

  it("CD4: a named cause outranks the body it came with", () => {
    const error = refusalFrom(new ChatError("bad_request:model"));
    error.cause = "Your admin removed the endpoint this chat was using.";

    expect(getChatErrorToastMessage(error, FALLBACK)).toBe(
      "Your admin removed the endpoint this chat was using.",
    );
  });
});

describe("what quota_exceeded means on the wire", () => {
  it("ER1: out of budget is 402 Payment Required, never a retryable 429 — on every surface", () => {
    expect(new ChatError("quota_exceeded:credits").statusCode).toBe(402);

    expect(new ChatError("quota_exceeded:chat").statusCode).toBe(402);
    expect(new ChatError("quota_exceeded:credits").code).toBe(
      "PAYMENT_REQUIRED",
    );
  });

  it("ER1: the response a client reads carries the 402 and the structured code", async () => {
    const response = new ChatError("quota_exceeded:credits").toResponse();

    expect(response.status).toBe(402);
    expect(await response.json()).toMatchObject({
      code: "quota_exceeded:credits",
    });
  });

  it("ER2: being out of generations names the condition and the way out", () => {
    expect(
      getChatErrorToastMessage(
        refusalFrom(new ChatError("quota_exceeded:credits")),
        FALLBACK,
      ),
    ).toMatch(/generation/i);
    expect(
      getChatErrorToastMessage(
        refusalFrom(new ChatError("quota_exceeded:credits")),
        FALLBACK,
      ),
    ).toMatch(/top-up|upgrade/i);
  });

  it("ER3: a rate limit stays a 429 — genuinely transient, genuinely retryable", () => {
    expect(new ChatError("rate_limit:chat").statusCode).toBe(429);
  });
});

describe("what the client can tell apart from every other refusal", () => {
  it("recognises the organization's own refusal by its code, not by guessing at copy", () => {
    expect(
      isQuotaExceededCreditsError(
        refusalFrom(new ChatError("quota_exceeded:credits")),
      ),
    ).toBe(true);
  });

  it("another 402 on another surface is not mistaken for this one", () => {
    expect(
      isQuotaExceededCreditsError(
        refusalFrom(new ChatError("quota_exceeded:chat")),
      ),
    ).toBe(false);
  });

  it("an unrelated refusal is not mistaken for this one", () => {
    expect(
      isQuotaExceededCreditsError(
        refusalFrom(new ChatError("bad_request:model")),
      ),
    ).toBe(false);
  });

  it("a failure that never reached the server is not mistaken for this one", () => {
    expect(isQuotaExceededCreditsError(new Error("Failed to fetch"))).toBe(
      false,
    );
  });
});
