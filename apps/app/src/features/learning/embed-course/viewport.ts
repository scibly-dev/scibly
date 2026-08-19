// The frame is as tall as the whole course; what the learner can see is a
// band the host page scrolls over it.

export type HostFrameRect = {
  top: number;
  height: number;
  viewportHeight: number;
};

export type OverlayBand = {
  top: number;
  height: number;
};

// `position: fixed` inside a frame anchors to the frame, which is the full
// height of the course, not what the learner can see of it.
export function computeOverlayBand(viewport: HostFrameRect): OverlayBand {
  const visibleTop = Math.min(viewport.height, Math.max(0, -viewport.top));
  const visibleBottom = Math.min(
    viewport.height,
    viewport.viewportHeight - viewport.top,
  );
  return { top: visibleTop, height: Math.max(0, visibleBottom - visibleTop) };
}

// Scrolling when the frame is already visible would yank a page the learner
// is reading.
export function shouldRequestScrollIntoView(
  viewport: HostFrameRect | null,
): boolean {
  return viewport !== null && viewport.top < 0;
}

export const MIN_LEARNER_SCREEN_HEIGHT = 320;

// Neither branch may read the frame's current height: a self-sizing frame is
// as tall as its own content, so sizing the course against it would feed the
// course's height back into itself and shrink it report by report.
export function learnerScreenHeight(
  viewport: HostFrameRect | null,
  frameHeightAtLoad: number,
): number {
  const height = viewport ? viewport.viewportHeight : frameHeightAtLoad;
  return Math.max(MIN_LEARNER_SCREEN_HEIGHT, Math.round(height));
}

// `embed-base-scale.css` steps the type scale down until a full question
// scene fits here, so anything shorter crops.
export const CALIBRATED_LAYER_HEIGHT = 600;

// The height the author chose in the snippet, not one that follows the
// scene — a frame hugging each scene would shuffle the host page on every
// advance.
export function viewportLayerFrameHeight(
  snippetHeight: number,
  screenHeight: number,
): number {
  return Math.max(
    MIN_LEARNER_SCREEN_HEIGHT,
    Math.min(
      Math.max(Math.round(snippetHeight), CALIBRATED_LAYER_HEIGHT),
      screenHeight,
    ),
  );
}

// A viewport-filling lesson view is `position: fixed`, which leaves the
// document measuring nothing and would collapse the frame to a sliver.
export function frameHeightToReport({
  contentHeight,
  layerHeight,
  viewportLayerOpen,
}: {
  contentHeight: number;
  layerHeight: number;
  viewportLayerOpen: boolean;
}): number {
  return Math.ceil(viewportLayerOpen ? layerHeight : contentHeight);
}

/** Long enough to read as the host making room, short enough to be over before
 * the lesson behind it has settled. */
export const LAYER_TRANSITION_MS = 240;

// `reducedMotion` is honoured here, not left to CSS, because the animation
// this triggers runs on the host page.
export function heightTransitionMs({
  previousLayerOpen,
  viewportLayerOpen,
  reducedMotion,
}: {
  previousLayerOpen: boolean | null;
  viewportLayerOpen: boolean;
  reducedMotion: boolean;
}): number {
  const changed =
    previousLayerOpen !== null && viewportLayerOpen !== previousLayerOpen;
  return changed && !reducedMotion ? LAYER_TRANSITION_MS : 0;
}
