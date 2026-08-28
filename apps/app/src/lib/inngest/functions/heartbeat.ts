import { inngest } from "../client";

export const HEARTBEAT_EVENT = "scibly/heartbeat.requested";

export const heartbeat = inngest.createFunction(
  {
    id: "heartbeat",
    name: "Heartbeat",
    retries: 2,
    triggers: [{ cron: "*/15 * * * *" }, { event: HEARTBEAT_EVENT }],
  },
  async ({ event, step }) => {
    const beatAt = await step.run("record-beat", () =>
      new Date().toISOString(),
    );

    await step.run("fail-when-asked", () => {
      const data: unknown = event.data;
      if (
        typeof data === "object" &&
        data !== null &&
        "fail" in data &&
        data.fail === true
      ) {
        throw new Error("Heartbeat failed on request");
      }
      return null;
    });

    return { beatAt, trigger: event.name };
  },
);
