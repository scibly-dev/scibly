import type { McpServer } from "@modelcontextprotocol/server";
import type { Principal } from "@scibly/auth/session";

import { z } from "zod";

import "server-only";
import {
  getSceneContent,
  writeSceneContent,
} from "@/features/course-authoring/server";

import { readable, text } from "./tool-response";

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
  // The author the agent acts for (ADR 0004), who the collab server attributes the write to.
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
      const { html } = await readable("getSceneContent", () =>
        getSceneContent(user, sceneId),
      );
      // Lineage is dropped: an external agent cannot write sourceIds back (ADR 0005).
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
      await readable("insertContent", () =>
        writeSceneContent(user, { sceneId, html, mode }),
      );
      return text({ sceneId, success: true });
    },
  );
}
