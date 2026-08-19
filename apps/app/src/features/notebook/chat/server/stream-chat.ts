import { AppError } from "@scibly/api/application-error";
import { type GenerationCharge } from "@scibly/api/entitlement";
import { type Session } from "@scibly/auth/session";
import { db } from "@scibly/db";
import {
  createAgentUIStream,
  createUIMessageStream,
  createUIMessageStreamResponse,
  type InferUIMessageChunk,
  type LanguageModel,
  type UIMessageStreamWriter,
} from "ai";

import { type NotebookMessage } from "@/features/notebook/chat/contracts";
import { getNotebookMessageText } from "@/features/notebook/chat/get-notebook-message-text";
import { createNotebookAgent } from "@/features/notebook/chat/server/notebook-agent";
import { createDeterministicImageEditStreamResponse } from "@/features/notebook/media/server/deterministic-image-edit-stream";
import { ensureNotebook, UNTITLED_NOTEBOOK } from "@/features/notebook/server";
import { buildToolRegistry } from "@/features/notebook/tools/registry.server";
import { fundGeneration } from "@/features/organizations/server";
import { createCaller } from "@/server/api/root";
import { ChatError } from "@/shared/ai/errors";
import {
  type GenerationSettlement,
  reportAndSettleStreamError,
  settleGenerationOnFailure,
} from "@/shared/ai/server/generation-settlement";
import {
  getLanguageModel,
  getModelCapabilities,
  resolveContextWindow,
} from "@/shared/ai/server/models/registry";
import { type ProtectedRouteContext } from "@/shared/api/trpc/server";

import { getNotebookSkills } from "../../skills";
import {
  assembleModelMessages,
  compactConversation,
  type ConversationSummary,
  expiringMessages,
  loadConversationSummary,
  needsCompaction,
} from "./compact-conversation";
import {
  changedMessages,
  loadNotebookMessages,
  persistMessages,
} from "./messages";
import {
  appendAuthorMessage,
  awaitsClientResponse,
  mergeClientMessagesOntoDbHistory,
} from "./utils/client-message-merge";
import { buildSystemPrompt, type SourceContextTier } from "./utils/context";
import { sanitizeUiMessagesForModel } from "./utils/sanitize-ui-messages";
import { type StreamChatInput } from "./utils/schema";

const TITLE_MAX_CHARS = 50;

function deriveNotebookTitle(messageText: string): string | undefined {
  const oneLine = messageText.replace(/\s+/g, " ").trim();
  if (!oneLine) return undefined;
  return oneLine.length > TITLE_MAX_CHARS
    ? `${oneLine.slice(0, TITLE_MAX_CHARS - 3)}...`
    : oneLine;
}

async function authorizeCourseContext(
  courseContext: StreamChatInput["courseContext"],
  organizationId: string,
): Promise<StreamChatInput["courseContext"]> {
  if (!courseContext) return undefined;

  const course = await db.course.findFirst({
    where: { id: courseContext.course.id, organizationId },
    select: { id: true },
  });
  return course ? courseContext : undefined;
}

async function ensureTurnNotebook(input: StreamChatInput, userId: string) {
  const incoming = input.message;
  const incomingText = getNotebookMessageText(incoming);
  const title = deriveNotebookTitle(incomingText);
  const { notebookId, organizationId } = await ensureNotebook({
    notebookId: input.notebookId,
    userId,
    orgSlug: input.orgSlug,
    title,
  });
  return { incoming, incomingText, notebookId, organizationId, title };
}

async function loadConversation(
  input: StreamChatInput,
  notebook: Awaited<ReturnType<typeof ensureTurnNotebook>>,
) {
  const { notebookId, incoming } = notebook;

  const summary = input.notebookId
    ? await loadConversationSummary(notebookId)
    : null;
  const dbMessages = input.notebookId
    ? await loadNotebookMessages(notebookId, summary?.throughMessageId)
    : [];

  const clientMessages = input.messages;
  const continuation =
    Boolean(clientMessages) && awaitsClientResponse(dbMessages);
  const fullMessages =
    continuation && clientMessages
      ? mergeClientMessagesOntoDbHistory(dbMessages, clientMessages)
      : appendAuthorMessage(dbMessages, incoming);
  return {
    ...notebook,
    continuation,
    dbMessages,
    fullMessages,
    summary,
    isNewNotebook: !input.notebookId,
  };
}

async function buildModelMessages(params: {
  writer: UIMessageStreamWriter<NotebookMessage>;
  notebookId: string;
  model: LanguageModel;
  systemPrompt: string;
  contextWindow: number;
  messages: NotebookMessage[];
  summary: ConversationSummary | null;
}): Promise<NotebookMessage[]> {
  const { summary } = params;
  const assembled = assembleModelMessages(params.messages, summary);
  if (!needsCompaction(params.systemPrompt, assembled, params.contextWindow)) {
    return assembled;
  }

  const expiring = expiringMessages(params.messages, summary);

  if (expiring.length === 0) {
    console.warn(
      `[chat] Notebook ${params.notebookId} is past its context window with nothing left to compact.`,
    );
    return assembled;
  }

  params.writer.write({
    type: "data-compaction",
    data: "summarizing",
    transient: true,
  });
  const compacted = await compactConversation({
    notebookId: params.notebookId,
    model: params.model,
    expiring,
    summary,
  });
  params.writer.write({
    type: "data-compaction",
    data: compacted ? "done" : "failed",
    transient: true,
  });

  const rebuilt = assembleModelMessages(params.messages, compacted ?? summary);
  if (needsCompaction(params.systemPrompt, rebuilt, params.contextWindow)) {
    console.warn(
      `[chat] Notebook ${params.notebookId} is still past its context window after compacting.`,
    );
  }
  return rebuilt;
}

export const MODEL_OUTPUT_CHUNK = /^(text|reasoning|tool|source)-|^file$/;

function watchForModelOutput<T extends { type: string }>(
  stream: ReadableStream<T>,
  settlement: GenerationSettlement,
): ReadableStream<T> {
  return stream.pipeThrough(
    new TransformStream({
      transform(chunk, controller) {
        if (MODEL_OUTPUT_CHUNK.test(chunk.type)) settlement.markProduced();
        controller.enqueue(chunk);
      },
    }),
  );
}

type TurnModel = {
  model: LanguageModel;
  contextWindow: number;
  supportsTools: boolean;
  sourceTier: SourceContextTier;
  systemPrompt: string;
};

type TurnRequest = {
  userId: string;
  orgSlug: string;
  session: Session;
  caller: ReturnType<typeof createCaller>;
  correlationId: string;

  settlement: GenerationSettlement;

  abortSignal: AbortSignal | undefined;
};

interface TurnParams {
  conversation: Awaited<ReturnType<typeof loadConversation>>;
  model: TurnModel;
  request: TurnRequest;
  skills: Awaited<ReturnType<typeof getNotebookSkills>>;
}

async function executeAgentStream(
  { conversation, model, request, skills }: TurnParams,
  writer: UIMessageStreamWriter<NotebookMessage>,
) {
  if (conversation.isNewNotebook && !conversation.continuation) {
    writer.write({
      type: "data-chat-title",
      data: conversation.title ?? UNTITLED_NOTEBOOK,
    });
  }
  const runtimeContext = {
    caller: request.caller,
    dataStream: writer,
    session: request.session,
    notebookId: conversation.notebookId,
    orgSlug: request.orgSlug,
  };
  const modelMessages = await buildModelMessages({
    writer,
    notebookId: conversation.notebookId,
    model: model.model,
    systemPrompt: model.systemPrompt,
    contextWindow: model.contextWindow,
    messages: conversation.fullMessages,
    summary: conversation.summary,
  });
  const tools = await buildToolRegistry(runtimeContext, skills);
  const agent = createNotebookAgent({
    model: model.model,
    instructions: model.systemPrompt,
    tools,
    runtimeContext,
    supportsTools: model.supportsTools,
    sourceTier: model.sourceTier,
  });
  const agentStream = await createAgentUIStream({
    agent,
    uiMessages: sanitizeUiMessagesForModel(modelMessages),
    sendReasoning: true,

    abortSignal: request.abortSignal,
    onError: (error) =>
      reportAndSettleStreamError(error, {
        correlationId: request.correlationId,
        endpoint: "chat.agent-stream",
        actorId: request.userId,
        settlement: request.settlement,
      }),
  });
  // SAFETY: the SDK types an agent's chunks with no data parts at all

  writer.merge(
    watchForModelOutput(agentStream, request.settlement) as ReadableStream<
      InferUIMessageChunk<NotebookMessage>
    >,
  );
}

async function dispatchChatStream(
  input: StreamChatInput,
  ctx: ProtectedRouteContext,
  conversation: Awaited<ReturnType<typeof loadConversation>>,
  correlationId: string,
  { id: modelId, model }: Awaited<ReturnType<typeof getLanguageModel>>,

  charge: GenerationCharge | null,
  abortSignal: AbortSignal | undefined,
): Promise<Response> {
  const userId = ctx.session.user.id;
  const { notebookId, fullMessages } = conversation;
  const settlement = settleGenerationOnFailure(charge);

  if (input.imageEdit?.sourceImageId) {
    return createDeterministicImageEditStreamResponse({
      notebookId,
      orgSlug: input.orgSlug,
      userId,
      fullMessages,
      imageEdit: input.imageEdit,
      persistMessages,
      correlationId,
      settlement,
    });
  }

  const caller = createCaller(ctx);

  const [skills, capabilities, courseContext] = await Promise.all([
    getNotebookSkills(),
    getModelCapabilities(modelId, input.orgSlug),
    authorizeCourseContext(input.courseContext, conversation.organizationId),
  ]);
  const contextWindow = resolveContextWindow(capabilities);

  const { prompt: systemPrompt, tier: sourceTier } = await buildSystemPrompt(
    {
      notebookId,
      query: conversation.incomingText,
      orgSlug: input.orgSlug,
      contextWindow,
      courseContext,
    },
    skills,
  );

  const request: TurnRequest = {
    userId,
    orgSlug: input.orgSlug,
    session: ctx.session,
    caller,
    correlationId,
    settlement,
    abortSignal,
  };
  const turn: TurnParams = {
    conversation,
    skills,
    request,
    model: {
      model,
      systemPrompt,
      sourceTier,
      contextWindow,
      supportsTools: capabilities.tools,
    },
  };

  const stream = createUIMessageStream<NotebookMessage>({
    originalMessages: fullMessages,
    execute: ({ writer }) => executeAgentStream(turn, writer),
    generateId: () => crypto.randomUUID(),
    onEnd: async ({ messages }) => {
      try {
        const moved = changedMessages(conversation.dbMessages, messages);
        if (moved.length > 0)
          await persistMessages({ notebookId, messages: moved });
      } catch (error) {
        console.error("[chat] Post-stream persistence failed:", error);
      }
    },
    onError: (error) =>
      reportAndSettleStreamError(error, {
        correlationId,
        endpoint: "chat.stream",
        actorId: userId,
        settlement,
      }),
  });

  return createUIMessageStreamResponse({
    stream,
    headers: { "x-notebook-id": notebookId },
  });
}

export const streamNotebookChat = async (
  input: StreamChatInput,
  ctx: ProtectedRouteContext,
  abortSignal?: AbortSignal,
) => {
  const userId = ctx.session.user.id;
  const correlationId = ctx.correlationId ?? crypto.randomUUID();

  const notebook = await ensureTurnNotebook(input, userId);
  const [conversation, languageModel] = await Promise.all([
    loadConversation(input, notebook),
    getLanguageModel(input.modelId, input.orgSlug),
  ]);
  const dispatch = (charge: GenerationCharge | null) =>
    dispatchChatStream(
      input,
      ctx,
      conversation,
      correlationId,
      languageModel,
      charge,
      abortSignal,
    );

  try {
    return await fundGeneration(
      {
        db,
        organizationId: conversation.organizationId,
        actorId: userId,
        action: "CHAT_MESSAGE",
        notebookId: conversation.notebookId,

        ownEndpoint: languageModel.isByoai,
      },
      dispatch,
    );
  } catch (error) {
    if (
      error instanceof AppError &&
      error.applicationCode === "entitlement.credits_exhausted"
    ) {
      throw new ChatError("quota_exceeded:credits");
    }
    throw error;
  }
};
