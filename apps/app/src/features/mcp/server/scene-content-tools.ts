import type { McpServer } from "@modelcontextprotocol/server";
import type { Principal } from "@scibly/auth/session";

import { AppError } from "@scibly/api/application-error";
import { z } from "zod";

import "server-only";
import {
  getSceneContent,
  writeSceneContent,
} from "@/features/course-authoring/server";

// In the app the browser owns scene content, so the registry declares these
// two tools with no `execute`; over MCP there is no browser, so they run
// through the headless writer against the live author document.

const READ_DESCRIPTION =
  "Read the current HTML content of a draft scene, as the author sees it in the editor right now. " +
  "Call this before writing to a scene that may already have content — a write with mode 'replace' discards whatever it does not carry.";

const WRITE_DESCRIPTION =
  "Write HTML into a draft scene's editor. " +
  "The HTML must match the schema returned by getEditorSchema — call that first. " +
  "Content that the schema would not accept is refused whole; nothing partial is written. " +
  "Use mode 'append' to add to what the scene already holds, 'replace' (the default) to write it from scratch.";

const sceneIdSchema = z
  .string()
  .describe("The ID of the draft scene, from listScenes.");

export function registerSceneContentTools(
  server: McpServer,
  principal: Principal["user"],
) {
  // The author the agent acts for (ADR 0004), which is who the collab server
  // attributes the write to and shows to anyone else in the room.
  const user = {
    id: principal.id,
    name: principal.name,
    username: "username" in principal ? principal.username : null,
  };

  server.registerTool(
    "getSceneContent",
    {
      description: READ_DESCRIPTION,
      inputSchema: z.object({ sceneId: sceneIdSchema }),
    },
    async ({ sceneId }) => {
      const { html } = await readable(() => getSceneContent(user, sceneId));
      // Lineage is dropped: an external agent cannot write sourceIds back
      // (docs/adr/0005-external-scenes-carry-no-lineage.md), so it is noise.
      return text({ sceneId, html });
    },
  );

  server.registerTool(
    "insertContent",
    {
      description: WRITE_DESCRIPTION,
      inputSchema: z.object({
        sceneId: sceneIdSchema,
        html: z.string().describe("The HTML to write into the scene."),
        mode: z.enum(["replace", "append"]).optional(),
      }),
    },
    async ({ sceneId, html, mode }) => {
      // The one scene-content write path, the same one the editor's own agent
      // tools use, so an external agent is held to the same schema and limits.
      await readable(() => writeSceneContent(user, { sceneId, html, mode }));
      return text({ sceneId, success: true });
    },
  );
}

/** The SDK hands a thrown error's message to the calling agent, so internal failures are logged here and replaced. */
async function readable<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (error) {
    if (error instanceof AppError && error.code !== "INTERNAL_SERVER_ERROR") {
      throw error;
    }
    console.error("[mcp] scene content failed:", error);
    throw new Error("The scene could not be reached. Try again.");
  }
}

function text(output: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(output) }] };
}
