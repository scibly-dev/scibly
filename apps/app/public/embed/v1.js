/*
 * Runs on someone else's website behind a URL customers paste directly, so it
 * is a permanent commitment the moment that happens (hence `/embed/v1.js`) and
 * stays deliberately dull: no build step, module syntax, or dependencies —
 * transport only, forwarding frame position, height, and scroll, while every
 * decision behind those values lives inside the frame, in app code that can
 * still change.
 */
(function () {
  "use strict";

  /* Mirrors src/features/learning/embed-course/protocol.ts; no build step gets
     to import it here, so protocol.test.ts asserts these four still match. */
  var VERSION = 1;
  var FRAME_SOURCE = "scibly-embed";
  var HOST_SOURCE = "scibly-embed-host";
  var SELECTOR = "iframe[data-scibly-embed]";

  var frames = [];

  function originOf(element) {
    /* The attribute, not `element.src` — that resolves a missing value to the
       host page's own origin, silently attaching a frame still waiting on a
       lazy-loading plugin's `data-src`. */
    var src = element.getAttribute("src");
    if (!src) return null;
    try {
      return new URL(src, window.location.href).origin;
    } catch (error) {
      return null;
    }
  }

  function report(frame) {
    if (!frame.element.contentWindow) return;
    var rect = frame.element.getBoundingClientRect();
    frame.element.contentWindow.postMessage(
      {
        source: HOST_SOURCE,
        version: VERSION,
        type: "viewport",
        top: Math.round(rect.top),
        height: Math.round(rect.height),
        viewportHeight: Math.round(
          window.innerHeight || document.documentElement.clientHeight,
        ),
      },
      frame.origin,
    );
  }

  var reportScheduled = false;

  function scheduleReport() {
    if (reportScheduled) return;
    reportScheduled = true;
    window.requestAnimationFrame(function () {
      reportScheduled = false;
      /* Iterated backwards so splicing a disconnected frame doesn't skip the
         next one — a removed frame never reappears (routing mounts a fresh
         element), so keeping it would leak its listeners for the tab's life. */
      for (var i = frames.length - 1; i >= 0; i--) {
        if (!frames[i].element.isConnected) {
          window.clearTimeout(frames[i].easeTimer);
          frames.splice(i, 1);
          continue;
        }
        report(frames[i]);
      }
    });
  }

  function attach(element) {
    if (element.sciblyEmbedAttached) return;
    var origin = originOf(element);
    if (!origin) return;
    element.sciblyEmbedAttached = true;
    var frame = { element: element, origin: origin };
    frames.push(frame);
    element.addEventListener("load", function () {
      report(frame);
    });
    /* An animated height leaves the rectangle reported above mid-flight. */
    element.addEventListener("transitionend", function (event) {
      if (event.propertyName === "height") report(frame);
    });
    report(frame);
  }

  function scan() {
    var found = document.querySelectorAll(SELECTOR);
    for (var i = 0; i < found.length; i++) attach(found[i]);
  }

  var scanScheduled = false;

  function scheduleScan() {
    if (scanScheduled) return;
    scanScheduled = true;
    window.requestAnimationFrame(function () {
      scanScheduled = false;
      scan();
    });
  }

  /* Believed only from a frame we attached to, at that frame's own origin. */
  function frameFor(event) {
    for (var i = 0; i < frames.length; i++) {
      if (
        frames[i].element.contentWindow === event.source &&
        frames[i].origin === event.origin
      ) {
        return frames[i];
      }
    }
    return null;
  }

  window.addEventListener("message", function (event) {
    var data = event.data;
    if (!data || data.source !== FRAME_SOURCE || data.version !== VERSION) {
      return;
    }
    var frame = frameFor(event);
    if (!frame) return;

    if (data.type === "resize" && typeof data.height === "number") {
      /* The frame decides whether a change is worth animating and for how long.
         Only the curve is settled here — taste rather than behaviour. */
      var ms = typeof data.transitionMs === "number" ? data.transitionMs : 0;
      if (ms > 0) {
        window.clearTimeout(frame.easeTimer);
        frame.element.style.transition = "height " + ms + "ms ease-out";
        /* On a timer, not on `transitionend` — that never fires when the height
           doesn't actually change, and reporting on the next message instead
           would report unanimated mid-transition, cutting the animation short. */
        frame.easeTimer = window.setTimeout(function () {
          frame.easeTimer = 0;
          frame.element.style.transition = "";
        }, ms + 50);
      } else if (!frame.easeTimer) {
        frame.element.style.transition = "";
      }
      frame.element.style.height = Math.round(data.height) + "px";
      scheduleReport();
      return;
    }
    if (data.type === "scroll-into-view") {
      frame.element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });

  window.addEventListener("scroll", scheduleReport, true);
  window.addEventListener("resize", scheduleReport);

  /* Frames can appear long after load — tabs, accordions, client-side routing —
     and can be inserted before the `src` a lazy-loading plugin will give them. */
  if (window.MutationObserver) {
    new MutationObserver(scheduleScan).observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["src"],
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scan);
  } else {
    scan();
  }
})();
