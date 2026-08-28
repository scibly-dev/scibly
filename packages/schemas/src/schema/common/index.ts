import { z } from "zod";

/**
 * A URL safe to put in an `href`, an `src`, or a fetch: https only.
 *
 * Zod's own `.url()` only asks whether `new URL()` parses the string, which
 * accepts any scheme — `javascript:`, `data:` and `vbscript:` all pass it. So
 * it is a shape check, not a safety check. Use this anywhere a URL is stored,
 * rendered as a link or an image, or fetched.
 *
 * The message is a parameter because several call sites already pass their own
 * copy; the default covers the rest.
 */
export const httpsUrl = (message = "Must be a valid https:// URL") =>
  z.url({ protocol: /^https$/, message });
