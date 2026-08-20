import { beforeEach, describe, expect, it } from "vitest";

import { setAnalyticsContext, withAnalyticsContext } from "./event-context";

const stamp = withAnalyticsContext({ surface: "app", env: "test" });

const event = (name = "course_created") => ({
  event: name,
  properties: { kind: "topup" },
});

describe("withAnalyticsContext", () => {
  beforeEach(() => setAnalyticsContext({}));

  it("stamps every event with the properties fixed at init", () => {
    expect(stamp(event())?.properties).toMatchObject({
      surface: "app",
      env: "test",
    });
  });

  it("adds whatever the app last set as context", () => {
    setAnalyticsContext({ area: "organization", org_id: "org_1" });

    expect(stamp(event())?.properties).toMatchObject({
      area: "organization",
      org_id: "org_1",
    });
  });

  it("drops the properties of an area the user has left", () => {
    setAnalyticsContext({ area: "organization", org_id: "org_1" });
    setAnalyticsContext({ area: "personal" });

    expect(stamp(event())?.properties).not.toHaveProperty("org_id");
  });

  it("keeps the properties the event already carried", () => {
    expect(stamp(event())?.properties).toMatchObject({ kind: "topup" });
  });

  it("leaves session recording payloads alone", () => {
    expect(stamp(event("$snapshot"))?.properties).not.toHaveProperty("surface");
  });

  it("passes through an event another hook already dropped", () => {
    expect(stamp(null)).toBeNull();
  });
});
