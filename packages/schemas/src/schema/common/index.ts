import { z } from "zod/v4";

// Zod's own `.url()` accepts any scheme — `javascript:` and `data:` included — so it is a shape check, not a safety check.
export const httpsUrl = () =>
  z.url({ protocol: /^https$/, message: "Must be a valid https:// URL" });
