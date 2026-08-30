import { z } from "zod";

import { inngest } from "@/lib/inngest/client";

import {
  loadDueConnections,
  pollConnection,
  recordPollFailure,
} from "./sync-source-freshness";

export const INTEGRATION_POLL_EVENT = "scibly/integration-poll.requested";

// Notion allows roughly three requests a second against one token, and a poll paginates.
const POLL_CONCURRENCY = 3;

// Never a credential: the event log is not a place for tokens.
const pollRequest = z.object({
  connectionId: z.string().min(1),
  provider: z.string().min(1),
});

export async function requestDuePolls(
  sendEvent: (
    id: string,
    events: { name: string; data: z.infer<typeof pollRequest> }[],
  ) => Promise<void>,
): Promise<{ requested: number }> {
  const due = await loadDueConnections(new Date());
  if (due.length === 0) return { requested: 0 };

  await sendEvent(
    "request-polls",
    due.map((connection) => ({
      name: INTEGRATION_POLL_EVENT,
      data: { connectionId: connection.id, provider: connection.provider },
    })),
  );
  return { requested: due.length };
}

export async function recordFailedPoll(
  request: unknown,
  error: unknown,
): Promise<void> {
  const { connectionId, provider } = pollRequest.parse(request);
  console.error(
    `[IntegrationFreshness] Poll failed for connection ${connectionId} (${provider}):`,
    error,
  );
  await recordPollFailure(connectionId, new Date());
}

export const integrationSync = inngest.createFunction(
  {
    id: "integration-sync",
    name: "Integration sync",
    retries: 2,
    triggers: [{ cron: "0 4 * * *" }],
  },
  ({ step }) =>
    requestDuePolls(async (id, events) => {
      await step.sendEvent(id, events);
    }),
);

export const integrationPoll = inngest.createFunction(
  {
    id: "integration-poll",
    name: "Integration poll",
    retries: 2,
    concurrency: { key: "event.data.provider", limit: POLL_CONCURRENCY },
    triggers: [{ event: INTEGRATION_POLL_EVENT }],
    onFailure: ({ event }) =>
      recordFailedPoll(event.data.event.data, event.data.error),
  },
  ({ event }) => pollConnection(pollRequest.parse(event.data).connectionId),
);
