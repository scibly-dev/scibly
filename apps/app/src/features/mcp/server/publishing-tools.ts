import type { McpServer } from "@modelcontextprotocol/server";

import { routes } from "@scibly/routes";
import { z } from "zod";

import "server-only";
import {
  getCourse,
  publishCourse,
  updateCourse,
} from "@/features/course-authoring/server";
import {
  buildEmbedSnippet,
  DEFAULT_EMBED_HEIGHT,
  EMBED_LANGUAGE_AUTO,
} from "@/features/learning/contracts";

import { approval, type ApprovalRefusals, approvalToken } from "./approval";
import { readable, text } from "./tool-response";

const courseIdSchema = z.string().describe("The ID of the course.");

const REFUSALS: ApprovalRefusals = {
  cancelled:
    "The author did not answer; nothing changed. Ask again if this still needs doing.",
  declined: "The author declined. Nothing changed.",
  mismatched:
    "This approval was given for a different change, so nothing changed. " +
    "Call the tool again with what you actually mean, and the author will be asked about that.",
};

export function registerPublishingTools(server: McpServer, userId: string) {
  server.registerTool(
    "publishCourse",
    {
      description:
        "Publish the course's current draft as a new version, which is what learners open. " +
        "Everything written since the last publish stays invisible to them until this is called. " +
        "Refused when the draft has no lessons, when any lesson has no scenes, or when nothing has changed since the last version — the message says which.",
      inputSchema: z.object({
        courseId: courseIdSchema,
        supersedePrevious: z
          .boolean()
          .optional()
          .describe(
            "Move learners already enrolled in earlier versions onto this one. They may lose progress where scenes were removed or changed, so leave this off unless the author asked for it.",
          ),
      }),
      annotations: { idempotentHint: false },
    },
    async ({ courseId, supersedePrevious }) =>
      text(
        await readable("publishCourse", () =>
          publishCourse(userId, {
            courseId,
            supersedePrevious: supersedePrevious ?? false,
          }),
        ),
      ),
  );

  server.registerTool(
    "getCourseEmbed",
    {
      description:
        "Get the <iframe> snippet that embeds a published course in someone else's page, plus its public link. " +
        "Reads only — the snippet points at whatever is published right now, so publish first and the embed follows along.",
      inputSchema: z.object({
        courseId: courseIdSchema,
        heightPx: z
          .number()
          .int()
          .min(320)
          .max(2000)
          .optional()
          .describe(
            `How tall the frame should be, in pixels. Defaults to ${DEFAULT_EMBED_HEIGHT}, which fits the player without inner scrolling.`,
          ),
      }),
      annotations: { readOnlyHint: true },
    },
    async ({ courseId, heightPx = DEFAULT_EMBED_HEIGHT }) => {
      const course = await readable("getCourseEmbed", () =>
        getCourse(userId, courseId),
      );

      const blockers = [
        ...(course.versions.length === 0
          ? ["it has never been published — call publishCourse first"]
          : []),
        ...(!course.allowAnonymous
          ? ["public access is off — call setCoursePublic to turn it on"]
          : []),
      ];
      if (blockers.length > 0) {
        return text({
          success: false,
          message: `"${course.title}" cannot be embedded yet: ${blockers.join("; and ")}.`,
        });
      }

      const publicUrl = routes.app.public.course(courseId);
      return text({
        success: true,
        courseId,
        title: course.title,
        version: course.versions[0]?.version,
        publicUrl,
        heightPx,
        html: buildEmbedSnippet({
          appOrigin: new URL(publicUrl).origin,
          courseId,
          lang: EMBED_LANGUAGE_AUTO,
          courseTitle: course.title,
          heightPx,
          includeScript: true,
        }),
      });
    },
  );

  server.registerTool(
    "setCoursePublic",
    {
      description:
        "Turn public access to a course on or off. Public means anyone holding the link — or visiting a page carrying the embed — can open the course without signing in or being enrolled. " +
        "This is what makes a getCourseEmbed snippet actually render, so it is the last step of publishing a course to the outside world. " +
        "The calling client asks the author to approve before anything changes; never ask for that approval in plain text. " +
        "A declined call comes back as success:false with nothing changed — an answer, not a failure, so do not call again.",
      inputSchema: z.object({
        courseId: courseIdSchema,
        isPublic: z
          .boolean()
          .describe(
            "true opens the course to anyone with the link; false closes it again, and any embed of it stops rendering.",
          ),
      }),
      annotations: { idempotentHint: true },
    },
    async ({ courseId, isPublic }, ctx) => {
      const course = await readable("setCoursePublic", () =>
        getCourse(userId, courseId),
      );

      if (course.allowAnonymous === isPublic) {
        return text({
          success: true,
          courseId,
          isPublic,
          message: `"${course.title}" is already ${isPublic ? "public" : "private"}.`,
        });
      }

      const gate = approval(ctx, {
        token: approvalToken("setCoursePublic", courseId, [String(isPublic)]),
        refusals: REFUSALS,
        message: isPublic
          ? `Make "${course.title}" public? Anyone with the link, and anyone visiting a page that embeds it, will be able to open the course without signing in or enrolling. This can be turned off again.`
          : `Make "${course.title}" private again? The public link will stop working, and any page already embedding this course will show "not publicly accessible" instead.`,
      });
      if (gate) return gate;

      await readable("setCoursePublic", () =>
        updateCourse(userId, { courseId, allowAnonymous: isPublic }),
      );
      return text({ success: true, courseId, isPublic });
    },
  );
}
