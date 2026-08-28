import { describe, expect, it } from "vitest";

import { inngestFunctions } from ".";

describe("inngestFunctions", () => {
  it("is what the serve route registers, so it must not be empty", () => {
    expect(inngestFunctions.length).toBeGreaterThan(0);
  });

  it("has no duplicate ids, which would silently replace one at sync time", () => {
    const ids = inngestFunctions.map((fn) => fn.id());

    expect(new Set(ids).size).toBe(ids.length);
  });
});
