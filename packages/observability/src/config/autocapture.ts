type PostHogAutocaptureConfig = {
  dom_event_allowlist: ["click"];
  css_selector_allowlist: string[];
  css_selector_ignorelist: string[];
};

export const POSTHOG_AUTOCAPTURE_CONFIG: PostHogAutocaptureConfig = {
  dom_event_allowlist: ["click"],
  css_selector_allowlist: ["[data-ph-capture]"],
  css_selector_ignorelist: [
    ".ph-no-autocapture",
    "[data-ph-no-autocapture]",
  ],
};
