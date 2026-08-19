"use client";

import Script from "next/script";
import { useCallback, useState } from "react";

const CALENDLY_CSS = "https://assets.calendly.com/assets/external/widget.css";
const CALENDLY_JS = "https://assets.calendly.com/assets/external/widget.js";
const CALENDLY_DEMO_URL = "https://calendly.com/felix-kuennecke/scibly-demo";

declare global {
  interface Window {
    Calendly?: {
      initPopupWidget: (options: { url: string }) => void;
    };
  }
}

function ensureCalendlyStylesheet() {
  if (document.getElementById("calendly-widget-css")) return;
  const link = document.createElement("link");
  link.id = "calendly-widget-css";
  link.rel = "stylesheet";
  link.href = CALENDLY_CSS;
  document.head.appendChild(link);
}

export function useCalendlyPopup() {
  const [scriptReady, setScriptReady] = useState(false);

  const openCalendly = useCallback(() => {
    if (!window.Calendly) return;
    window.Calendly.initPopupWidget({ url: CALENDLY_DEMO_URL });
  }, []);

  // Stylesheet is injected when the lazyOnload script arrives: after the
  // landing page's own bytes, but before any human can click — injecting at
  // click time would open the first popup unstyled while the CSS fetches.
  const handleScriptReady = useCallback(() => {
    ensureCalendlyStylesheet();
    setScriptReady(true);
  }, []);

  const calendlyScript = (
    <Script
      src={CALENDLY_JS}
      strategy="lazyOnload"
      onLoad={handleScriptReady}
      onReady={handleScriptReady}
    />
  );

  return { openCalendly, scriptReady, calendlyScript };
}
