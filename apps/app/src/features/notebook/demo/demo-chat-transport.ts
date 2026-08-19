import type {
  CourseMutationEvent,
  ShowcaseFixture,
  ShowcaseGeneratedImage,
  ShowcaseLesson,
  ShowcaseScene,
  ShowcaseStore,
} from "@scibly/showcase";
import type { ChatTransport, UIMessageChunk } from "ai";
import type { NotebookMessage } from "@/features/notebook/chat/contracts";
import type { NotebookUITools } from "@/features/notebook/chat/tools";

import { isCourseMutationEvent } from "@scibly/showcase";
import { createChat } from "@shadcn/helpers/ai-sdk";

import { shouldSendChatAutomatically } from "@/features/notebook/chat/tools/approval-tools";

const DEMO_CREATED_AT = "2026-01-15T10:00:00.000Z";
const DEMO_TITLE = "Cyber safety at work";
const STREAM_DELAY_MS = 18;

// Prepended on every send while a dev script is pending, so the scripted-turn
// matcher's id lookup always lands on the canned intro (`demo-assistant-1`,
// see createDemoChat) and treats it as exhausted, instead of falling back to
// its last-message heuristic and replaying the canned intro again.
const DEV_SCRIPT_SEED_MESSAGE: NotebookMessage = {
  id: "demo-assistant-1",
  role: "assistant",
  parts: [],
};

type ToolName = keyof NotebookUITools & string;
type AssistantScript = Parameters<
  ReturnType<typeof createChat<NotebookMessage>>["assistant"]
>[0];
type DemoWriter = Parameters<
  Extract<AssistantScript, (...args: any) => any>
>[0]["writer"];

export type DevChatScriptPart =
  | { type: "text"; text: string; delayMs?: number }
  | { type: "reasoning"; text: string; delayMs?: number }
  | {
      type: "tool";
      name: string;
      input?: unknown;
      output?: unknown;
      error?: string;
    }
  | { type: "courseDelta"; delta: CourseMutationEvent }
  | { type: "chatTitle"; title: string }
  | { type: "sleep"; delayMs: number };

export type DevChatScript = {
  parts: DevChatScriptPart[];

  continuation?: boolean;
};

export type DevScriptController = {
  queue: (script: DevChatScript) => void;
  hasPending: () => boolean;
  peek: () => DevChatScript | null;
  consume: () => DevChatScript | null;
};

export function createDevScriptController(): DevScriptController {
  let pending: DevChatScript | null = null;
  return {
    queue(script) {
      pending = script;
    },
    hasPending: () => pending !== null,
    peek: () => pending,
    consume() {
      const script = pending;
      pending = null;
      return script;
    },
  };
}

// The demo's `sendAutomaticallyWhen`: also requires a queued continuation,
// since resuming without one streams into `emptyStream()`, which can never
// satisfy the SDK's condition and would resubmit forever.
export function shouldResumeDemoReply(
  devScript: DevScriptController | undefined,
  params: { messages: NotebookMessage[] },
): boolean {
  return (
    devScript?.peek()?.continuation === true &&
    shouldSendChatAutomatically(params)
  );
}

function toolInput<N extends ToolName>(
  _name: N,
  input: NotebookUITools[N]["input"],
): NotebookUITools[N]["input"] {
  return input;
}

function toolOutput<N extends ToolName>(
  _name: N,
  output: unknown,
): NotebookUITools[N]["output"] {
  // SAFETY: mirrors the production fields the notebook UI's metadata readers consume.
  return output as NotebookUITools[N]["output"];
}

function courseEntity(entity: { id: string; title: string }) {
  return { id: entity.id, title: entity.title };
}

function dataCourseDelta(writer: DemoWriter, delta: CourseMutationEvent) {
  writer.data({
    type: "data-courseDelta",
    data: delta,
    transient: true,
  });
}

function dataChatTitle(writer: DemoWriter, title: string) {
  writer.data({
    type: "data-chat-title",
    data: title,
    transient: true,
  });
}

function createCourseDelta(fixture: ShowcaseFixture): CourseMutationEvent {
  return {
    type: "course-created",
    course: courseEntity(fixture.course),
  };
}

function createLessonDelta(
  courseId: string,
  lesson: ShowcaseLesson,
): CourseMutationEvent {
  return {
    type: "lesson-created",
    courseId,
    lesson: courseEntity(lesson),
  };
}

function createSceneDelta(
  courseId: string,
  lesson: ShowcaseLesson,
  scene: ShowcaseScene,
): CourseMutationEvent {
  return {
    type: "scene-created",
    courseId,
    lessonId: lesson.id,
    scene: courseEntity(scene),
  };
}

function sourceHits(fixture: ShowcaseFixture) {
  const [handbook, briefing] = fixture.sources;
  return [
    handbook
      ? {
          sourceId: handbook.id,
          sourceName: handbook.name,
          offset: 1240,
          content:
            "Never share your work password by email or chat. IT will never ask you to send it. Report suspicious messages through the known IT channel.",
        }
      : undefined,
    briefing
      ? {
          sourceId: briefing.id,
          sourceName: briefing.name,
          offset: 480,
          content:
            "Common red flags: unexpected urgency, odd sender addresses, and links that ask you to sign in again. Pause and verify before you click.",
        }
      : undefined,
  ].filter(Boolean);
}

function emitSceneReveal(
  writer: DemoWriter,
  courseId: string,
  lesson: ShowcaseLesson,
  scene: ShowcaseScene,
) {
  writer.sleep(90);
  dataCourseDelta(writer, createSceneDelta(courseId, lesson, scene));
}

function emitLessonScenes(
  writer: DemoWriter,
  courseId: string,
  lesson: ShowcaseLesson,
) {
  for (const scene of lesson.scenes) {
    emitSceneReveal(writer, courseId, lesson, scene);
  }
}

function imageOutput(image: ShowcaseGeneratedImage) {
  return {
    imageId: image.id,
    url: image.url,
    prompt: image.prompt,
    alt: image.alt,
    mediaType: "image/webp",
    aspectRatio: image.aspectRatio,
    width: image.width,
    height: image.height,
    byteSize: image.byteSize,
  };
}

function createDemoChat(fixture: ShowcaseFixture) {
  const [lessonOne, lessonTwo] = fixture.course.lessons;
  const [image] = fixture.generatedImages;
  const firstSource = fixture.sources[0];

  if (!lessonOne || !lessonTwo || !image || !firstSource) {
    throw new Error("The notebook demo fixture is missing required content.");
  }

  const [sceneOne, sceneTwo, ...remainingLessonOneScenes] = lessonOne.scenes;
  if (!sceneOne || !sceneTwo) {
    throw new Error("The notebook demo fixture needs at least two scenes.");
  }

  const courseId = fixture.course.id;
  const sourceIds = fixture.sources.map((source) => source.id);
  const searchResults = sourceHits(fixture);

  return createChat<NotebookMessage>({
    messageIdPrefix: "demo-message",
    toolCallIdPrefix: "demo-tool",
    now: DEMO_CREATED_AT,
  })
    .user(fixture.promptOptions[0]?.prompt, {
      id: "demo-author-1",
      metadata: { createdAt: DEMO_CREATED_AT },
    })
    .assistant(
      ({ writer }) => {
        writer.stepStart();
        writer.reasoning(
          "Audience: non-technical office staff. Keep language plain, search the notebook sources first, then build short practice-heavy lessons.",
          { id: "demo-reasoning-plan", delayMs: 12 },
        );
        writer
          .tool("loadSkill", {
            toolCallId: "demo-tool-load-lesson-design",
            input: toolInput("loadSkill", { name: "lesson-design" }),
          })
          .sleep(120)
          .output(
            toolOutput("loadSkill", {
              content:
                "Use one objective per lesson, a hook-nugget-practice rhythm, and plain examples.",
            }),
          );
        writer
          .tool("loadSkill", {
            toolCallId: "demo-tool-load-scene-content",
            input: toolInput("loadSkill", { name: "scene-content" }),
          })
          .sleep(120)
          .output(
            toolOutput("loadSkill", {
              content:
                "Write schema-valid scene HTML, vary block types, and ground source-based scenes.",
            }),
          );
        writer
          .tool("searchNotebookSources", {
            toolCallId: "demo-tool-search-sources",
            input: toolInput("searchNotebookSources", {
              query: "phishing urgency password report IT",
              limit: 4,
            }),
          })
          .sleep(180)
          .output(
            toolOutput("searchNotebookSources", {
              results: searchResults,
            }),
          );
        writer
          .tool("readSource", {
            toolCallId: "demo-tool-read-source",
            input: toolInput("readSource", {
              sourceId: firstSource.id,
              offset: 1240,
            }),
          })
          .sleep(130)
          .output(
            toolOutput("readSource", {
              content:
                "Never share your work password by email or chat. Report suspicious messages through the known IT channel.",
            }),
          );

        writer.text(
          `I found enough in your sources to build a short course: ${lessonOne.title}, then ${lessonTwo.title}. I will keep it plain and use interactive checks throughout.`,
          { id: "demo-text-intro", delayMs: 14 },
        );
        dataChatTitle(writer, DEMO_TITLE);

        writer
          .tool("createCourse", {
            toolCallId: "demo-tool-create-course",
            input: toolInput("createCourse", {
              orgSlug: fixture.orgSlug,
              title: fixture.course.title,
              description: fixture.course.description,
              category: fixture.course.category,
              tags: [...fixture.course.tags],
            }),
          })
          .sleep(160)
          .output(toolOutput("createCourse", courseEntity(fixture.course)));
        dataCourseDelta(writer, createCourseDelta(fixture));

        writer
          .tool("createLesson", {
            toolCallId: "demo-tool-create-lesson-1",
            input: toolInput("createLesson", {
              courseId,
              title: lessonOne.title,
              description: lessonOne.description,
              estimatedTimeToCompleteMinutes:
                lessonOne.estimatedTimeToCompleteMinutes,
            }),
          })
          .sleep(140)
          .output(
            toolOutput("createLesson", {
              lesson: courseEntity(lessonOne),
              scenes: [courseEntity(sceneOne)],
            }),
          );
        dataCourseDelta(writer, createLessonDelta(courseId, lessonOne));
        emitSceneReveal(writer, courseId, lessonOne, sceneOne);

        writer
          .tool("getEditorSchema", {
            toolCallId: "demo-tool-editor-schema",
            input: toolInput("getEditorSchema", {}),
          })
          .sleep(100)
          .output(
            toolOutput("getEditorSchema", {
              schema:
                "Guide character, flashcard, multiple choice, input field, matching pairs, cloze, drag-and-drop, free-form input, image, and inline hint blocks.",
            }),
          );
        writer
          .tool("insertContent", {
            toolCallId: "demo-tool-insert-intro",
            input: toolInput("insertContent", {
              sceneId: sceneOne.id,
              html: sceneOne.previewHtml,
              sourceIds,
            }),
          })
          .sleep(180)
          .output(
            toolOutput("insertContent", {
              success: true,
              html: sceneOne.previewHtml,
            }),
          );

        writer.text(
          "I will add a calm visual next, then turn the rest into quick practice scenes.",
          { id: "demo-text-image-setup", delayMs: 12 },
        );
        writer
          .tool("listNotebookMedia", {
            toolCallId: "demo-tool-list-media",
            input: toolInput("listNotebookMedia", { limit: 6 }),
          })
          .sleep(110)
          .output(
            toolOutput("listNotebookMedia", {
              items: [],
              nextCursor: undefined,
            }),
          );
        writer
          .tool("generateImage", {
            toolCallId: image.toolCallId,
            input: toolInput("generateImage", {
              prompt: image.prompt,
              alt: image.alt,
              aspectRatio: image.aspectRatio,
            }),
          })
          .sleep(320)
          .output(toolOutput("generateImage", imageOutput(image)));

        emitSceneReveal(writer, courseId, lessonOne, sceneTwo);
        for (const scene of remainingLessonOneScenes) {
          writer
            .tool("createScene", {
              toolCallId: `demo-tool-create-${scene.id}`,
              input: toolInput("createScene", {
                lessonId: lessonOne.id,
                title: scene.title,
              }),
            })
            .sleep(90)
            .output(toolOutput("createScene", courseEntity(scene)));
          dataCourseDelta(writer, createSceneDelta(courseId, lessonOne, scene));
        }

        writer.reasoning(
          "Lesson 1 now covers phishing cues. Lesson 2 should practice password safety and trusted escalation.",
          { id: "demo-reasoning-lesson-two", delayMs: 12 },
        );
        writer
          .tool("createLesson", {
            toolCallId: "demo-tool-create-lesson-2",
            input: toolInput("createLesson", {
              courseId,
              title: lessonTwo.title,
              description: lessonTwo.description,
              estimatedTimeToCompleteMinutes:
                lessonTwo.estimatedTimeToCompleteMinutes,
            }),
          })
          .sleep(140)
          .output(
            toolOutput("createLesson", {
              lesson: courseEntity(lessonTwo),
              scenes: lessonTwo.scenes.slice(0, 1).map(courseEntity),
            }),
          );
        dataCourseDelta(writer, createLessonDelta(courseId, lessonTwo));
        emitLessonScenes(writer, courseId, lessonTwo);

        writer.text(
          "Done. I created a two-lesson cyber safety course with source-grounded explanations, a generated padlock visual, and practice checks for phishing and password safety. Open Studio to review the scenes.",
          { id: "demo-text-done", delayMs: 12 },
        );
      },
      {
        id: "demo-assistant-1",
        metadata: { createdAt: DEMO_CREATED_AT },
      },
    );
}

function hasStringType(value: unknown): value is { type: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    // SAFETY: `typeof value === "object" && value !== null` just checked

    typeof (value as { type?: unknown }).type === "string"
  );
}

function applyDemoDataChunk(chunk: UIMessageChunk, store: ShowcaseStore): void {
  if (chunk.type === "data-chat-title") {
    store.applyTimelineEvent({
      type: "notebook-title-updated",
      title: String(chunk.data),
    });
    return;
  }

  if (
    chunk.type === "data-courseDelta" &&
    hasStringType(chunk.data) &&
    isCourseMutationEvent(chunk.data)
  ) {
    store.applyTimelineEvent(chunk.data);
  }
}

function withShowcaseStoreUpdates(
  stream: ReadableStream<UIMessageChunk>,
  store: ShowcaseStore,
): ReadableStream<UIMessageChunk> {
  return stream.pipeThrough(
    new TransformStream<UIMessageChunk, UIMessageChunk>({
      transform(chunk, controller) {
        applyDemoDataChunk(chunk, store);
        controller.enqueue(chunk);
      },
    }),
  );
}

// Continuations must not name a message: naming one makes the SDK rename it,
// leaving both the original and the renamed copy in the transcript.
function withoutStartMessageId(
  stream: ReadableStream<UIMessageChunk>,
): ReadableStream<UIMessageChunk> {
  return stream.pipeThrough(
    new TransformStream<UIMessageChunk, UIMessageChunk>({
      transform(chunk, controller) {
        controller.enqueue(
          chunk.type === "start" ? { ...chunk, messageId: undefined } : chunk,
        );
      },
    }),
  );
}

function emptyStream(): ReadableStream<UIMessageChunk> {
  return new ReadableStream({
    start(controller) {
      controller.close();
    },
  });
}

function devTool(
  writer: DemoWriter,
  name: string,
  input: unknown,
): { output: (output: unknown) => void; error: (errorText?: string) => void } {
  const untypedTool: unknown = writer.tool;
  // SAFETY: dev-only script authoring intentionally accepts arbitrary tool

  const tool = untypedTool as (
    toolName: string,
    toolOptions?: { input?: unknown },
  ) => {
    output: (output: unknown) => void;
    error: (errorText?: string) => void;
  };
  return tool(name, { input });
}

// Mirrors production human-in-the-loop tools (askMultipleChoice, proposePlan):
// the stream stops at a pending tool call, and the remainder resumes once
// `sendAutomaticallyWhen` auto-resubmits (see the `fallback` wiring below).
function applyDevChatScript(
  writer: DemoWriter,
  script: DevChatScript,
): DevChatScript | null {
  for (const [index, part] of script.parts.entries()) {
    switch (part.type) {
      case "text":
        writer.text(part.text, { delayMs: part.delayMs });
        break;
      case "reasoning":
        writer.reasoning(part.text, { delayMs: part.delayMs });
        break;
      case "tool": {
        const handle = devTool(writer, part.name, part.input);
        if (part.error !== undefined) {
          handle.error(part.error);
        } else if (part.output !== undefined) {
          handle.output(part.output);
        } else {
          return { parts: script.parts.slice(index + 1), continuation: true };
        }
        break;
      }
      case "courseDelta":
        dataCourseDelta(writer, part.delta);
        break;
      case "chatTitle":
        dataChatTitle(writer, part.title);
        break;
      case "sleep":
        writer.sleep(part.delayMs);
        break;
    }
  }
  return null;
}

export function createDemoChatTransport(
  fixture: ShowcaseFixture,
  store: ShowcaseStore,
  options: { delayMs?: number; devScript?: DevScriptController } = {},
): ChatTransport<NotebookMessage> {
  const chat = createDemoChat(fixture);
  const devScript = options.devScript;
  const transport = chat.transport({
    delayMs: options.delayMs ?? STREAM_DELAY_MS,
    fallback: devScript
      ? ({ writer }) => {
          const script = devScript.consume();
          if (!script) return;

          if (script.continuation) writer.stepStart();
          const remainder = applyDevChatScript(writer, script);

          if (remainder) devScript.queue(remainder);
        }
      : undefined,
  });

  return {
    async sendMessages(sendOptions) {
      const isFirstReplay = store.beginTimelineReplay();
      if (!isFirstReplay && !devScript?.hasPending()) return emptyStream();

      const isContinuation = devScript?.peek()?.continuation === true;
      const stream = await transport.sendMessages(
        devScript?.hasPending()
          ? {
              ...sendOptions,
              messages: [DEV_SCRIPT_SEED_MESSAGE, ...sendOptions.messages],
            }
          : sendOptions,
      );
      return withShowcaseStoreUpdates(
        isContinuation ? withoutStartMessageId(stream) : stream,
        store,
      );
    },
    async reconnectToStream() {
      return null;
    },
  };
}
