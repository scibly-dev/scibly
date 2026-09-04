import { describe, expect, it } from "vitest";

import { translatePublishFailure } from "./publish-failure";

const MESSAGES = {
  EMPTY_SCENE: "Die Szene „{{scene}}“ hat keinen Inhalt.",
  OUTDATED_SCENES: "{{count}} Szenen sind veraltet.",
};

describe("publish refusals reach the author in their own language", () => {
  it("fills the server's parameters into the localized message", () => {
    expect(
      translatePublishFailure(
        { details: { code: "EMPTY_SCENE", params: { scene: "Einführung" } } },
        MESSAGES,
      ),
    ).toEqual({
      code: "EMPTY_SCENE",
      message: "Die Szene „Einführung“ hat keinen Inhalt.",
    });
  });

  it("numbers interpolate the same way", () => {
    expect(
      translatePublishFailure(
        { details: { code: "OUTDATED_SCENES", params: { count: 3 } } },
        MESSAGES,
      )?.message,
    ).toBe("3 Szenen sind veraltet.");
  });

  it.each([
    ["a code with no translation yet", { details: { code: "SOMETHING_NEW" } }],
    ["an error that carries no code at all", { details: { questions: [] } }],
    ["no details at all", undefined],
  ])("%s falls back to the raw error", (_case, details) => {
    expect(translatePublishFailure(details, MESSAGES)).toBeNull();
  });
});
