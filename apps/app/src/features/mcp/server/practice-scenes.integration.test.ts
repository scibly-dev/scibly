/**
 * @vitest-environment node
 *
 * Prisma refuses `documentState` bytes built from jsdom's cross-realm `Uint8Array`.
 */
import type { Principal } from "@scibly/auth/session";
import type * as DbModule from "@scibly/db";
import type * as NextServer from "next/server";

import { createTestPrismaClient } from "@scibly/db/test-client";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

// Opt in via MCP_INT_TEST_DATABASE_URL (docs/integration-tests.md).
const url = vi.hoisted(() => process.env.MCP_INT_TEST_DATABASE_URL ?? "");

vi.mock("@scibly/db", async (importOriginal) => ({
  ...(await importOriginal<typeof DbModule>()),
  db: (await import("@scibly/db/test-client")).createTestPrismaClient(url),
}));

// The broadcast every scene write fires runs inside `after`, which needs a
// request scope this harness has none of.
vi.mock("next/server", async (importOriginal) => ({
  ...(await importOriginal<typeof NextServer>()),
  after: () => {},
}));

const { handleMcpRequest } = await import("./handler");
const { createTRPCContext } = await import("@scibly/api/trpc");
const { createCaller } = await import("@/server/api/root");
const { practiceContentHash } =
  await import("@/shared/content/practice/practice-content-hash");

const RUN_ID = `int-practice-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const ORG = `${RUN_ID}-org`;
const ACTOR = `${RUN_ID}-actor`;

const PRACTICE_TOOLS = [
  "getPracticeContract",
  "getPractice",
  "writePractice",
  "validatePractice",
] as const;

/** A real app: it draws, it reacts to every click, it submits what the play arrived at. */
const PRACTICE_HTML = `<div id="app"></div>
<script>
  const STEPS = ["render(data)", "fetch(url)", "await res.json()"];
  const order = [0, 1, 2];
  let picked = null;
  const app = document.getElementById("app");
  const payload = () => ({ order: order.map((step) => STEPS[step]).join(" > ") });

  function render() {
    app.replaceChildren();
    order.forEach((step, slot) => {
      const button = document.createElement("button");
      button.textContent = STEPS[step];
      button.dataset.slot = String(slot);
      button.style.borderColor = picked === slot ? "#0066FF" : "#eceae4";
      button.onclick = () => {
        if (picked === null) picked = slot;
        else {
          const from = picked;
          picked = null;
          const swap = order[from];
          order[from] = order[slot];
          order[slot] = swap;
        }
        render();
      };
      app.append(button);
    });
    const submit = document.createElement("button");
    submit.id = "go";
    submit.textContent = "Submit";
    submit.onclick = () => window.scibly.submit(payload());
    app.append(submit);
  }

  render();

  window.scibly.onGraded((grade) => {
    const field = grade.fields.order;
    document.getElementById("go").textContent = field.correct
      ? "Correct — " + grade.sp + " SP"
      : "Right order: " + field.expected;
  });

  window.__sciblySelfTest = () => ({
    order: "fetch(url) > await res.json() > render(data)",
  });
</script>`;

const EXPLORATORY_HTML = `<div id="stage"></div>
<script>
  const stage = document.getElementById("stage");
  let mass = 1;
  const draw = () => {
    stage.textContent = "Period: " + (2 * Math.PI * Math.sqrt(mass)).toFixed(2) + "s";
  };
  const slider = document.createElement("input");
  slider.type = "range";
  slider.min = "1";
  slider.max = "20";
  slider.oninput = () => {
    mass = Number(slider.value);
    draw();
  };
  document.body.append(slider);
  draw();
</script>`;

const SOLUTION = {
  order: { value: "fetch(url) > await res.json() > render(data)", points: 10 },
};
const CORRECT_WORK = { order: "fetch(url) > await res.json() > render(data)" };
const WRONG_WORK = { order: "render(data) > fetch(url) > await res.json()" };
const EXPLANATION = "You fetch, then parse, then paint.";

/** Only the parts of a JSON Schema this test reads back. */
type McpToolDescriptor = {
  name: string;
  description?: string;
  inputSchema: { required?: string[] };
};

/** Tool arguments are arbitrary JSON, so this is as concrete as they get. */
type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

type McpResponse = {
  result?: {
    content?: { type: string; text: string }[];
    isError?: boolean;
    tools?: McpToolDescriptor[];
  };
  error?: { code: number; message: string };
};

describe.runIf(url !== "")(
  "IT3 — an external agent building a PRACTICE scene",
  () => {
    const db = createTestPrismaClient(url);
    const advertised = new Map<string, McpToolDescriptor>();

    let courseId = "";
    let lessonId = "";
    let documentSceneId = "";
    let gradedSceneId = "";
    let exploratorySceneId = "";

    beforeAll(async () => {
      await db.user.create({
        data: {
          id: ACTOR,
          name: "Integration Actor",
          email: `${ACTOR}@int-test.local`,
        },
      });
      await db.organization.create({
        data: {
          id: ORG,
          name: "Integration Org",
          slug: ORG,
          createdAt: new Date(),
          members: {
            create: {
              id: `${RUN_ID}-member`,
              userId: ACTOR,
              role: "owner",
              createdAt: new Date(),
            },
          },
          // publishCourse fails closed without a resolvable subscription.
          subscription: {
            create: { plan: "TRIAL", currentPeriodStart: new Date() },
          },
        },
      });
    });

    afterAll(async () => {
      await db.course.deleteMany({ where: { organizationId: ORG } });
      await db.organization.deleteMany({ where: { id: ORG } });
      await db.user.deleteMany({ where: { id: ACTOR } });
      await db.$disconnect();
    });

    async function rpc(
      method: string,
      params: Record<string, Json>,
    ): Promise<McpResponse> {
      const session: Principal = {
        user: { id: ACTOR, name: "Integration Actor" } as Principal["user"],
      };
      const headers = new Headers({
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
      });

      const response = await handleMcpRequest(
        new Request("https://app.scibly.com/api/mcp", {
          method: "POST",
          headers,
          body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
        }),
        {
          session,
          caller: createCaller(
            await createTRPCContext({ headers, principal: session }),
          ),
        },
      );

      const text = await response.text();
      const frame = text.match(/^data: (.*)$/m);
      return JSON.parse(frame ? frame[1]! : text) as McpResponse;
    }

    function payloadText(body: McpResponse): string {
      return body.result?.content?.[0]?.text ?? JSON.stringify(body);
    }

    /** What an agent receives when a tool refuses: the message, whatever the transport wrapped it in. */
    async function refusal(name: string, args: Record<string, Json>) {
      const body = await rpc("tools/call", { name, arguments: args });
      const message = body.error?.message ?? payloadText(body);
      expect(
        body.error !== undefined || body.result?.isError === true,
        `expected ${name} to refuse, got ${message}`,
      ).toBe(true);
      return message;
    }

    async function call<T>(
      name: string,
      args: Record<string, Json>,
    ): Promise<T> {
      const body = await rpc("tools/call", { name, arguments: args });
      expect(body.error, JSON.stringify(body)).toBeUndefined();
      expect(body.result?.isError, payloadText(body)).toBeFalsy();
      return JSON.parse(payloadText(body)) as T;
    }

    /** The stamp validatePractice refuses to give an agent, applied the way the editor would. */
    async function stampValidated(sceneId: string) {
      const scene = await db.scene.findUniqueOrThrow({
        where: { id: sceneId },
        select: { practiceHtml: true, practiceSolution: true },
      });
      await db.scene.update({
        where: { id: sceneId },
        data: {
          practiceValidated: practiceContentHash(
            scene.practiceHtml,
            scene.practiceSolution,
          ),
        },
      });
    }

    it("IT3: advertises the four practice tools, and a createScene that accepts PRACTICE", async () => {
      const body = await rpc("tools/list", {});
      expect(body.error, JSON.stringify(body)).toBeUndefined();
      for (const tool of body.result?.tools ?? []) {
        advertised.set(tool.name, tool);
      }

      expect([...advertised.keys()]).toEqual(
        expect.arrayContaining([...PRACTICE_TOOLS]),
      );
      for (const name of PRACTICE_TOOLS) {
        expect(advertised.get(name)?.description ?? "").not.toBe("");
      }

      const createScene = advertised.get("createScene")!;
      expect(JSON.stringify(createScene.inputSchema)).toContain("PRACTICE");
      // ADR 0005: an external agent has no notebook, so lineage is not offered.
      expect(JSON.stringify(createScene.inputSchema)).not.toContain(
        "sourceIds",
      );

      // Both are `.nullable()` without `.optional()`, so an agent that omits
      // either gets a schema error rather than a default.
      const writePractice = advertised.get("writePractice")!;
      expect(writePractice.inputSchema.required).toEqual(
        expect.arrayContaining(["sceneId", "html", "solution", "explanation"]),
      );
    });

    it("IT3: hands back the practice contract before anything is written", async () => {
      const { contract } = await call<{ contract: string }>(
        "getPracticeContract",
        {},
      );

      expect(contract).toContain("window.scibly.submit(work)");
      expect(contract).toContain("window.__sciblySelfTest");
      expect(contract).toContain("cdnjs.cloudflare.com");
    });

    it("IT3: creates a course, a lesson and a PRACTICE scene", async () => {
      const course = await call<{ id: string }>("createCourse", {
        orgSlug: ORG,
        title: "Async in order",
      });
      courseId = course.id;

      const lesson = await call<{
        lesson: { id: string };
        scenes: { id: string; title: string }[];
      }>("createLesson", { courseId, title: "Promises" });
      lessonId = lesson.lesson.id;
      documentSceneId = lesson.scenes[0]!.id;

      const scene = await call<{ id: string; kind: string }>("createScene", {
        lessonId,
        title: "Order the steps",
        kind: "PRACTICE",
      });
      gradedSceneId = scene.id;

      expect(scene.kind).toBe("PRACTICE");
      await expect(
        db.scene.findUniqueOrThrow({ where: { id: gradedSceneId } }),
      ).resolves.toMatchObject({ kind: "PRACTICE", documentState: null });
    });

    it("IT3: reads the empty practice back before anything is written", async () => {
      const practice = await call("getPractice", { sceneId: gradedSceneId });

      expect(practice).toEqual({
        sceneId: gradedSceneId,
        html: "",
        solution: null,
        explanation: null,
        validated: false,
      });
    });

    it("IT3: round-trips html, solution and explanation through writePractice", async () => {
      const written = await call("writePractice", {
        sceneId: gradedSceneId,
        html: PRACTICE_HTML,
        solution: SOLUTION,
        explanation: EXPLANATION,
      });
      expect(written).toEqual({ sceneId: gradedSceneId, success: true });

      const practice = await call("getPractice", { sceneId: gradedSceneId });
      expect(practice).toEqual({
        sceneId: gradedSceneId,
        html: PRACTICE_HTML,
        solution: SOLUTION,
        explanation: EXPLANATION,
        validated: false,
      });
    });

    it("IT3: grades a correct and a wrong payload without stamping the publish gate", async () => {
      const right = await call<{
        gradedFields: { achievedPoints: number; maxPoints: number }[];
        totalSpEarned: number;
        explanation: string;
        validated: boolean;
      }>("validatePractice", { sceneId: gradedSceneId, work: CORRECT_WORK });

      expect(right.gradedFields).toEqual([
        {
          blockId: "order",
          blockType: "practice",
          achievedPoints: 10,
          maxPoints: 10,
          spEarned: 10,
          correctAnswer: SOLUTION.order.value,
        },
      ]);
      expect(right.totalSpEarned).toBe(10);
      expect(right.explanation).toBe(EXPLANATION);
      // Full marks, and still unvalidated: only the editor's self-test stamps.
      expect(right.validated).toBe(false);

      const wrong = await call<{
        gradedFields: { achievedPoints: number }[];
        totalSpEarned: number;
        validated: boolean;
      }>("validatePractice", { sceneId: gradedSceneId, work: WRONG_WORK });
      expect(wrong.gradedFields[0]?.achievedPoints).toBe(0);
      expect(wrong.totalSpEarned).toBe(0);
      expect(wrong.validated).toBe(false);

      await expect(
        db.scene.findUniqueOrThrow({
          where: { id: gradedSceneId },
          select: { practiceValidated: true },
        }),
      ).resolves.toEqual({ practiceValidated: null });
    });

    it("IT3: accepts an exploratory scene with no solution and grades nothing", async () => {
      const scene = await call<{ id: string }>("createScene", {
        lessonId,
        title: "Feel the period",
        kind: "PRACTICE",
      });
      exploratorySceneId = scene.id;

      await call("writePractice", {
        sceneId: exploratorySceneId,
        html: EXPLORATORY_HTML,
        solution: null,
        explanation: "Period grows with the square root of mass.",
      });

      const practice = await call<{ solution: unknown; explanation: string }>(
        "getPractice",
        { sceneId: exploratorySceneId },
      );
      expect(practice.solution).toBeNull();

      const graded = await call<{
        gradedFields: unknown[];
        totalSpEarned: number;
        explanation: string;
        validated: boolean;
      }>("validatePractice", { sceneId: exploratorySceneId, work: null });
      expect(graded.gradedFields).toEqual([]);
      expect(graded.totalSpEarned).toBe(0);
      expect(graded.explanation).toBe(
        "Period grows with the square root of mass.",
      );
      expect(graded.validated).toBe(false);
    });

    it("IT3: refuses insertContent on a PRACTICE scene and names the tool to use", async () => {
      const message = await refusal("insertContent", {
        sceneId: gradedSceneId,
        html: "<p>hello</p>",
      });
      expect(message).toContain("writePractice");

      // The DOCUMENT scene is the control: same tool, same course, and its only
      // obstacle is the collab server no unit harness runs.
      const document = await refusal("insertContent", {
        sceneId: documentSceneId,
        html: "<p>hello</p>",
      });
      expect(document).not.toContain("writePractice");
    }, 30_000);

    it("IT3: getSceneContent says nothing useful about a PRACTICE scene", async () => {
      // No collab server here, so this is the timeout path; in production the room returns "".
      const message = await refusal("getSceneContent", {
        sceneId: gradedSceneId,
      });
      expect(message).not.toContain("writePractice");
      expect(message).not.toContain("PRACTICE");
    }, 30_000);

    it("IT3: refuses to publish an unvalidated practice scene", async () => {
      const refused = await refusal("publishCourse", { courseId });

      expect(refused).toContain("has not passed its self-test");
      expect(refused).toContain("press Validate");
      await expect(
        db.courseVersion.count({ where: { courseId } }),
      ).resolves.toBe(0);
    });

    it("IT3: refuses to publish the Introduction scene createLesson made, until something writes it", async () => {
      await stampValidated(gradedSceneId);
      await stampValidated(exploratorySceneId);

      // createLesson's auto-created scene parks raw HTML publish calls unreadable
      // until insertContent (or a browser) converts it.
      const refused = await refusal("publishCourse", { courseId });

      expect(refused).toContain('Scene "Introduction" cannot be read');
      expect(refused).toContain("Open the scene and re-save it");
    });

    it("IT3: publishes the practice scenes, html, solution and explanation included", async () => {
      // The only way past the Introduction scene without a collab server.
      const asked = await call<{ confirmationToken: string }>("deleteScenes", {
        courseId,
        sceneIds: [documentSceneId],
      });
      await call("deleteScenes", {
        courseId,
        sceneIds: [documentSceneId],
        confirmationToken: asked.confirmationToken,
      });

      const published = await call<{ version?: { version: number } }>(
        "publishCourse",
        { courseId },
      );
      expect(JSON.stringify(published)).toContain("1");

      const version = await db.courseVersion.findFirstOrThrow({
        where: { courseId },
        orderBy: { version: "desc" },
      });
      const snapshot = await db.scene.findMany({
        where: { courseVersionId: version.id, kind: "PRACTICE" },
        orderBy: { order: "asc" },
      });

      expect(snapshot).toHaveLength(2);
      expect(snapshot[0]).toMatchObject({
        learnerContent: PRACTICE_HTML,
        gradingManifest: { solution: SOLUTION, explain: EXPLANATION },
        maxSp: 10,
      });
      expect(snapshot[1]).toMatchObject({
        learnerContent: EXPLORATORY_HTML,
        gradingManifest: {
          solution: null,
          explain: "Period grows with the square root of mass.",
        },
      });
    });

    it("IT3: hands back an embed for the published course once it is public", async () => {
      const closed = await call<{ success: boolean; message: string }>(
        "getCourseEmbed",
        { courseId },
      );
      expect(closed).toMatchObject({ success: false });
      expect(closed.message).toContain("setCoursePublic");

      const asked = await call<{
        needsConfirmation: boolean;
        confirmationToken: string;
      }>("setCoursePublic", { courseId, isPublic: true });
      expect(asked.needsConfirmation).toBe(true);
      await call("setCoursePublic", {
        courseId,
        isPublic: true,
        confirmationToken: asked.confirmationToken,
      });

      const embed = await call<{ success: boolean; html: string }>(
        "getCourseEmbed",
        { courseId },
      );
      expect(embed.success).toBe(true);
      expect(embed.html).toContain(courseId);
    });
  },
);
