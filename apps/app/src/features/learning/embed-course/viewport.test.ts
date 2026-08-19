import { describe, expect, it } from "vitest";

import {
  CALIBRATED_LAYER_HEIGHT,
  computeOverlayBand,
  frameHeightToReport,
  heightTransitionMs,
  LAYER_TRANSITION_MS,
  learnerScreenHeight,
  MIN_LEARNER_SCREEN_HEIGHT,
  shouldRequestScrollIntoView,
  viewportLayerFrameHeight,
} from "./viewport";

describe("embed overlay band", () => {
  it("a frame inside the viewport spans its full height", () => {
    expect(
      computeOverlayBand({ top: 40, height: 500, viewportHeight: 900 }),
    ).toEqual({ top: 0, height: 500 });
  });

  it("a frame scrolled past yields a band offset by the scrolled distance", () => {
    expect(
      computeOverlayBand({ top: -300, height: 2000, viewportHeight: 800 }),
    ).toEqual({ top: 300, height: 800 });
  });

  it("a frame starting below the viewport top yields a shortened band", () => {
    expect(
      computeOverlayBand({ top: 200, height: 2000, viewportHeight: 800 }),
    ).toEqual({ top: 0, height: 600 });
  });

  it("a frame outside the viewport yields a zero-height band", () => {
    expect(
      computeOverlayBand({ top: 900, height: 500, viewportHeight: 800 }),
    ).toEqual({ top: 0, height: 0 });
    expect(
      computeOverlayBand({ top: -1200, height: 500, viewportHeight: 800 }),
    ).toEqual({ top: 500, height: 0 });
  });
});

describe("embed scroll requests", () => {
  it("a scroll is requested only when the frame top is above the viewport", () => {
    const viewport = { height: 2000, viewportHeight: 800 };

    expect(shouldRequestScrollIntoView({ ...viewport, top: -1 })).toBe(true);
    expect(shouldRequestScrollIntoView({ ...viewport, top: 0 })).toBe(false);
    expect(shouldRequestScrollIntoView({ ...viewport, top: 120 })).toBe(false);
  });

  it("no scroll is requested before any rectangle has been received", () => {
    expect(shouldRequestScrollIntoView(null)).toBe(false);
  });
});

describe("the learner's screen height", () => {
  it("the learner's screen is the host viewport, not the frame", () => {
    expect(
      learnerScreenHeight(
        { top: -100, height: 4000, viewportHeight: 900 },
        600,
      ),
    ).toBe(900);
  });

  it("before any rectangle, the frame's height at load is used", () => {
    expect(learnerScreenHeight(null, 720)).toBe(720);
  });

  it("an implausibly short height is raised to the floor", () => {
    expect(learnerScreenHeight(null, 0)).toBe(MIN_LEARNER_SCREEN_HEIGHT);
    expect(
      learnerScreenHeight({ top: 0, height: 600, viewportHeight: 12 }, 600),
    ).toBe(MIN_LEARNER_SCREEN_HEIGHT);
  });
});

describe("the height the frame asks for", () => {
  it("the frame asks for the content height", () => {
    expect(
      frameHeightToReport({
        contentHeight: 1840,
        layerHeight: 600,
        viewportLayerOpen: false,
      }),
    ).toBe(1840);
  });

  it("a viewport-filling layer takes the snippet's height", () => {
    expect(
      frameHeightToReport({
        contentHeight: 84,
        layerHeight: viewportLayerFrameHeight(600, 900),
        viewportLayerOpen: true,
      }),
    ).toBe(600);
  });

  it("a fractional height is rounded up", () => {
    expect(
      frameHeightToReport({
        contentHeight: 1840.2,
        layerHeight: 600,
        viewportLayerOpen: false,
      }),
    ).toBe(1841);
  });

  it("the height a layer gets does not vary with the scene", () => {
    const layerHeight = viewportLayerFrameHeight(600, 900);
    const shortScene = {
      contentHeight: 84,
      layerHeight,
      viewportLayerOpen: true,
    };
    const longScene = {
      contentHeight: 2400,
      layerHeight,
      viewportLayerOpen: true,
    };

    expect(frameHeightToReport(shortScene)).toBe(
      frameHeightToReport(longScene),
    );
  });

  it("the snippet height is capped at the screen and floored", () => {
    expect(viewportLayerFrameHeight(900, 540)).toBe(540);
    expect(viewportLayerFrameHeight(0, 100)).toBe(MIN_LEARNER_SCREEN_HEIGHT);
  });

  it("a snippet height under the calibration is raised to it", () => {
    expect(viewportLayerFrameHeight(480, 900)).toBe(CALIBRATED_LAYER_HEIGHT);
    expect(viewportLayerFrameHeight(720, 900)).toBe(720);
  });

  it("the learner's screen still wins over the calibration", () => {
    expect(viewportLayerFrameHeight(480, 420)).toBe(420);
  });
});

describe("how suddenly the host may change height", () => {
  it("only a layer opening or closing is eased", () => {
    expect(
      heightTransitionMs({
        previousLayerOpen: false,
        viewportLayerOpen: true,
        reducedMotion: false,
      }),
    ).toBe(LAYER_TRANSITION_MS);
    expect(
      heightTransitionMs({
        previousLayerOpen: true,
        viewportLayerOpen: false,
        reducedMotion: false,
      }),
    ).toBe(LAYER_TRANSITION_MS);
    expect(
      heightTransitionMs({
        previousLayerOpen: true,
        viewportLayerOpen: true,
        reducedMotion: false,
      }),
    ).toBe(0);
  });

  it("reduced motion is never eased", () => {
    expect(
      heightTransitionMs({
        previousLayerOpen: false,
        viewportLayerOpen: true,
        reducedMotion: true,
      }),
    ).toBe(0);
  });

  it("the first height reported is never eased", () => {
    expect(
      heightTransitionMs({
        previousLayerOpen: null,
        viewportLayerOpen: true,
        reducedMotion: false,
      }),
    ).toBe(0);
  });
});
