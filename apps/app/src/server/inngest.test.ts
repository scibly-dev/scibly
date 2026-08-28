import { describe, expect, it } from "vitest";

import { inngestFunctions } from "./inngest";

describe("inngestFunctions", () => {
  it("has no duplicate ids, which would silently replace one at sync time", () => {
    const ids = inngestFunctions.map((fn) => fn.id());

    expect(new Set(ids).size).toBe(ids.length);
  });
});
