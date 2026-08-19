import "dotenv/config";

import { config } from "./config.js";
import { shutdownPersistence } from "./persistence.js";
import { purgeExpired } from "./rate-limiter.js";
import { createCollabServer } from "./server.js";

const cleanupTimer = setInterval(purgeExpired, config.cleanupIntervalMs);
const server = createCollabServer();

async function shutdown() {
  console.log("[collab] Shutting down server...");
  clearInterval(cleanupTimer);
  await server.destroy();

  await shutdownPersistence();

  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

server.listen().then(() => {
  console.log(`[collab] Listening on port ${config.port}`);
});
