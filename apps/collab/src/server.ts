import { Database } from "@hocuspocus/extension-database";
import { Server } from "@hocuspocus/server";
import { db } from "@scibly/db";
import { CollabDocument } from "@scibly/lib";
import { wrapRawHtmlState } from "@scibly/lib/collab-yjs";

import { authenticateConnection } from "./auth.js";
import { config } from "./config.js";
import { scheduleDbFlush } from "./persistence.js";
import { isRateLimited } from "./rate-limiter.js";
import { clientIp } from "./request.js";

export function createCollabServer({
  database = db,
  port = config.port,
}: {
  database?: Pick<typeof db, "scene">;
  port?: number;
} = {}) {
  return new Server({
    port,
    stopOnSignals: false,

    async onRequest({ request, response }) {
      if (request.url === "/" || request.url === "/health") {
        response.writeHead(200, { "Content-Type": "application/json" });
        response.end(JSON.stringify({ status: "ok" }));
        throw null;
      }

      if (isRateLimited(clientIp(request))) {
        response.writeHead(429, { "Content-Type": "application/json" });
        response.end(JSON.stringify({ error: "Too many requests" }));
        throw null;
      }
    },

    async onAuthenticate({ documentName, token, connectionConfig }) {
      const authContext = authenticateConnection(token, documentName);
      if (authContext.access === "read") {
        connectionConfig.readOnly = true;
      }
      return authContext;
    },

    async onStateless({ document, payload }) {
      document.broadcastStateless(payload);
    },

    extensions: [
      new Database({
        fetch: async ({ documentName }) => {
          if (documentName.startsWith("course-meta-")) return null;

          const { sceneId } = CollabDocument.parse(documentName);
          const scene = await database.scene.findUnique({
            where: { id: sceneId },
            select: { documentState: true },
          });

          if (!scene) return null;
          return wrapRawHtmlState(scene.documentState);
        },
        store: async ({ documentName, state }) => {
          if (documentName.startsWith("course-meta-")) return;
          scheduleDbFlush(documentName, state);
        },
      }),
    ],
  });
}
