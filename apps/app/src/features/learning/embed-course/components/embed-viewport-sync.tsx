"use client";

import { useEffect, useRef } from "react";

import "./embed-overlay-band.css";

import {
  PLAYER_VIEWPORT_LAYER_SELECTOR,
  PLAYER_VIEWPORT_UNIT,
} from "../../course-player/ui/player/utils/viewport-layer";
import { recordHostRect } from "../host-rect-store";
import { postToHost, viewportFromHost } from "../protocol";
import {
  computeOverlayBand,
  frameHeightToReport,
  heightTransitionMs,
  learnerScreenHeight,
  type OverlayBand,
  viewportLayerFrameHeight,
} from "../viewport";

/* The DOM half of the sync; the decisions are all in viewport.ts. */

// Not `scrollHeight` alone: it never reports less than the frame's current
// height, which would let the frame only ever grow.
function measureContentHeight(): number {
  return Math.max(
    document.documentElement.getBoundingClientRect().height,
    document.body.scrollHeight,
  );
}

/** One percent of the learner's screen: what `vh` would mean if the player had
 * a viewport of its own. */
function setPlayerViewportUnit(screenHeight: number): void {
  document.documentElement.style.setProperty(
    PLAYER_VIEWPORT_UNIT,
    `${screenHeight / 100}px`,
  );
}

// An unchanged band is not rewritten: a custom property on the root
// invalidates style for every element in the course, and the host reports on
// any scroll on its page, most of which leave our frame put.
function applyOverlayBand(band: OverlayBand, previous: OverlayBand | null) {
  if (
    previous &&
    band.top === previous.top &&
    band.height === previous.height
  ) {
    return;
  }
  const root = document.documentElement;
  root.style.setProperty("--scibly-embed-band-top", `${band.top}px`);
  root.style.setProperty("--scibly-embed-band-height", `${band.height}px`);

  root.dataset.sciblyEmbedViewport = "synced";
}

interface EmbedViewportSyncProps {
  hostOrigin: string | null;
}

// No-op without a host script: the frame keeps the snippet's height and the
// course scrolls inside it.
export function EmbedViewportSync({ hostOrigin }: EmbedViewportSyncProps) {
  const frameHeightAtLoad = useRef<number | null>(null);

  useEffect(() => {
    frameHeightAtLoad.current ??= window.innerHeight;
    const snippetHeight = frameHeightAtLoad.current;
    let screenHeight = learnerScreenHeight(null, snippetHeight);
    setPlayerViewportUnit(screenHeight);

    let scheduled = 0;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let previousLayerOpen: boolean | null = null;
    let lastReportedHeight: number | null = null;
    let lastBand: OverlayBand | null = null;

    const report = () => {
      scheduled = 0;
      const layerOpen =
        document.querySelector(PLAYER_VIEWPORT_LAYER_SELECTOR) !== null;
      const transitionMs = heightTransitionMs({
        previousLayerOpen,
        viewportLayerOpen: layerOpen,
        reducedMotion: reducedMotion.matches,
      });
      previousLayerOpen = layerOpen;

      const height = frameHeightToReport({
        contentHeight: measureContentHeight(),
        layerHeight: viewportLayerFrameHeight(snippetHeight, screenHeight),
        viewportLayerOpen: layerOpen,
      });

      if (height === lastReportedHeight && transitionMs === 0) return;
      lastReportedHeight = height;

      postToHost({ type: "resize", height, transitionMs }, hostOrigin);
    };

    const scheduleReport = () => {
      scheduled ||= window.requestAnimationFrame(report);
    };

    const documentObserver = new ResizeObserver(scheduleReport);
    documentObserver.observe(document.documentElement);

    const layerObserver = new MutationObserver(scheduleReport);
    layerObserver.observe(document.body, { childList: true, subtree: true });

    const onMessage = (event: MessageEvent) => {
      const viewport = viewportFromHost(event, hostOrigin);
      if (!viewport) return;

      recordHostRect(viewport);

      const measured = learnerScreenHeight(viewport, 0);
      if (measured !== screenHeight) {
        screenHeight = measured;
        setPlayerViewportUnit(screenHeight);
        scheduleReport();
      }

      const band = computeOverlayBand(viewport);
      applyOverlayBand(band, lastBand);
      lastBand = band;
    };
    window.addEventListener("message", onMessage);

    report();

    return () => {
      documentObserver.disconnect();
      layerObserver.disconnect();
      window.removeEventListener("message", onMessage);
      if (scheduled) window.cancelAnimationFrame(scheduled);
    };
  }, [hostOrigin]);

  return null;
}
