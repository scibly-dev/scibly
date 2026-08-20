import { beforeEach, describe, expect, it, vi } from "vitest";

import { analyticsConsentCookieName } from "../consent/cookie";
import { applyConsentAndIdentity } from "./apply-consent-and-identity";

function fakeClient(properties: Record<string, string> = {}) {
  return {
    get_property: vi.fn((key: string) => properties[key]),
    reset: vi.fn(),
    identify: vi.fn(),
    opt_in_capturing: vi.fn(),
    opt_out_capturing: vi.fn(),
  };
}

function answerConsent(value: "v1" | "declined" | null) {
  document.cookie = `${analyticsConsentCookieName}=; max-age=0; path=/`;
  if (value) document.cookie = `${analyticsConsentCookieName}=${value}; path=/`;
}

describe("applyConsentAndIdentity", () => {
  beforeEach(() => answerConsent(null));

  it("identifies a signed-in user who granted consent", () => {
    answerConsent("v1");
    const posthog = fakeClient();

    applyConsentAndIdentity(posthog, "user_1");

    expect(posthog.opt_in_capturing).toHaveBeenCalled();
    expect(posthog.identify).toHaveBeenCalledWith("user_1");
  });

  it("leaves a user who has not answered the banner anonymous", () => {
    const posthog = fakeClient();

    applyConsentAndIdentity(posthog, "user_1");

    expect(posthog.identify).not.toHaveBeenCalled();
    expect(posthog.opt_in_capturing).not.toHaveBeenCalled();
    expect(posthog.opt_out_capturing).not.toHaveBeenCalled();
  });

  it("leaves a user who declined anonymous, and opts capturing out", () => {
    answerConsent("declined");
    const posthog = fakeClient();

    applyConsentAndIdentity(posthog, "user_1");

    expect(posthog.opt_out_capturing).toHaveBeenCalled();
    expect(posthog.identify).not.toHaveBeenCalled();
  });

  it("clears the browser when a different person signs in", () => {
    answerConsent("v1");
    const posthog = fakeClient({ $user_id: "user_1" });

    applyConsentAndIdentity(posthog, "user_2");

    expect(posthog.reset).toHaveBeenCalledWith(true);
    expect(posthog.identify).toHaveBeenCalledWith("user_2");
  });

  it("keeps the browser for the same person signing in again", () => {
    answerConsent("v1");
    const posthog = fakeClient({ $user_id: "user_1" });

    applyConsentAndIdentity(posthog, "user_1");

    expect(posthog.reset).not.toHaveBeenCalled();
  });

  it("keeps an identified browser on the pages that have no session", () => {
    answerConsent("v1");
    const posthog = fakeClient({ $user_id: "user_1" });

    applyConsentAndIdentity(posthog, undefined);

    expect(posthog.reset).not.toHaveBeenCalled();
    expect(posthog.identify).not.toHaveBeenCalled();
  });
});
