import { Inngest } from "inngest";

import { env } from "@/env";

export const inngest = new Inngest({
  id: "scibly-app",
  baseUrl: env.INNGEST_BASE_URL,
  isDev:
    env.INNGEST_DEV === undefined
      ? env.NODE_ENV === "development"
      : env.INNGEST_DEV === "true",
  eventKey: env.INNGEST_EVENT_KEY,
  signingKey: env.INNGEST_SIGNING_KEY,
});
