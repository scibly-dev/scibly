import { describe, expect, it } from "vitest";

import { failureMessage } from "./failure-message";

describe("a stored failure has to say enough to act on", () => {
  it("names the status and the host, because 'Not Found' alone names nothing", () => {
    expect(
      failureMessage({
        message: "Not Found",
        statusCode: 404,
        url: "https://tunnel.example.dev/v1/chat/completions?key=secret",
      }),
    ).toBe("Not Found (404 from tunnel.example.dev)");
  });

  it("keeps the message alone when there is nothing to add", () => {
    expect(failureMessage(new Error("gateway down"))).toBe("gateway down");
  });

  it("survives what Inngest actually hands it", () => {
    // A serialized error: no prototype, so `String()` gives "[object Object]".
    expect(
      failureMessage(
        Object.assign(Object.create(null), {
          message: "boom",
          status: 500,
        }),
      ),
    ).toBe("boom (500)");
    expect(failureMessage("plain string")).toBe("plain string");
  });

  it("caps what it stores", () => {
    expect(failureMessage({ message: "x".repeat(900) })).toHaveLength(500);
  });
});
