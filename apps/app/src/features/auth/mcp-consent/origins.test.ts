import { describe, expect, it } from "vitest";

import { consentDestinations } from "./origins";

describe("naming where an approved agent's code will land", () => {
  it("reduces a redirect URL to its origin", () => {
    expect(
      consentDestinations("https://claude.ai/api/mcp/auth_callback"),
    ).toEqual(["https://claude.ai"]);
  });

  it("keeps a non-default port, which distinguishes a local agent", () => {
    expect(consentDestinations("http://localhost:6274/oauth/callback")).toEqual(
      ["http://localhost:6274"],
    );
  });

  it("lists every registered destination once", () => {
    expect(
      consentDestinations(
        "https://claude.ai/cb, https://claude.ai/other,https://other.test/cb",
      ),
    ).toEqual(["https://claude.ai", "https://other.test"]);
  });

  it("shows an unparseable destination rather than hiding it", () => {
    expect(consentDestinations("not-a-url")).toEqual(["not-a-url"]);
  });

  it("has nothing to show for an empty registration", () => {
    expect(consentDestinations("")).toEqual([]);
  });
});
