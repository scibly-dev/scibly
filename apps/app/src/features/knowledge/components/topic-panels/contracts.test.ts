import { describe, expect, it } from "vitest";

import { isSettled, outcomeLabels } from "./contracts";

type Bundle = Parameters<typeof isSettled>[0];

const bundle = (outcome: Bundle["outcome"]) => ({ outcome }) as Bundle;

describe("what counts as read", () => {
  it.each(["EXTRACTED", "NO_INSIGHTS", "LOW_VALUE", "OFF_TOPIC"] as const)(
    "%s is the funnel's last word",
    (outcome) => expect(isSettled(bundle(outcome))).toBe(true),
  );

  it.each(["READING", "FAILED", "UNFUNDED"] as const)(
    "%s is still on its way",
    (outcome) => expect(isSettled(bundle(outcome))).toBe(false),
  );
});

it("names every outcome the wire can carry", () => {
  const labels = outcomeLabels({
    feed: {
      outcomeReading: "reading",
      outcomeExtracted: "extracted",
      outcomeNoInsights: "nothing",
      outcomeLowValue: "routine",
      outcomeOffTopic: "off topic",
      outcomeUnfunded: "unfunded",
      outcomeFailed: "failed",
    },
  } as Parameters<typeof outcomeLabels>[0]);
  expect(Object.values(labels).every(Boolean)).toBe(true);
});
