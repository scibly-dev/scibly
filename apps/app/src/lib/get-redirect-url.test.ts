import { describe, expect, it } from "vitest";

import { getRedirectUrl } from "./get-redirect-url";

describe("choosing where to send a user after they sign in", () => {
  it("keeps a path on this origin", () => {
    expect(getRedirectUrl("/profile/org/acme")).toBe("/profile/org/acme");
  });

  it("falls back when there is nothing to honour", () => {
    expect(getRedirectUrl(undefined)).toBe("/");
    expect(getRedirectUrl(null, "/home")).toBe("/home");
    expect(getRedirectUrl("")).toBe("/");
  });

  it("refuses an absolute URL to another origin", () => {
    expect(getRedirectUrl("https://evil.com")).toBe("/");
  });

  it("refuses a protocol-relative URL", () => {
    expect(getRedirectUrl("//evil.com")).toBe("/");
  });

  it("refuses a backslash-authority URL", () => {
    expect(getRedirectUrl("/\\evil.com")).toBe("/");
  });

  it("refuses one hiding its authority behind stripped whitespace", () => {
    expect(getRedirectUrl("/\t/evil.com")).toBe("/");
    expect(getRedirectUrl("/\n\\evil.com")).toBe("/");
  });
});
