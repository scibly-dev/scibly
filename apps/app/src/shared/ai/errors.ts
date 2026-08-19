import { AppError, getHttpStatus } from "@scibly/api/application-error";
import { z } from "zod";

type ErrorType =
  | "bad_request"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "rate_limit"
  | "quota_exceeded"
  | "offline";

export type Surface =
  | "chat"
  | "notebook"
  | "api"
  | "image"
  | "model"
  | "credits";

type ErrorCode = `${ErrorType}:${Surface}`;

export class ChatError extends AppError {
  statusCode: number;

  constructor(errorCode: ErrorCode, cause?: string) {
    // SAFETY: `ErrorCode` is `${ErrorType}:${Surface}` and no member of either

    const [type] = errorCode.split(":") as [ErrorType];
    super({
      code: getTrpcCodeByType(type),
      applicationCode: errorCode,
      message: getMessageByErrorCode(errorCode),
      cause,
    });
    this.statusCode = getHttpStatus(this.code);
  }

  toResponse() {
    return Response.json(
      { code: this.applicationCode, message: this.message },
      { status: this.statusCode },
    );
  }
}

function getTrpcCodeByType(type: ErrorType) {
  switch (type) {
    case "bad_request":
      return "BAD_REQUEST" as const;
    case "unauthorized":
      return "UNAUTHORIZED" as const;
    case "forbidden":
      return "FORBIDDEN" as const;
    case "not_found":
      return "NOT_FOUND" as const;
    case "rate_limit":
      return "TOO_MANY_REQUESTS" as const;

    case "quota_exceeded":
      return "PAYMENT_REQUIRED" as const;
    case "offline":
      return "SERVICE_UNAVAILABLE" as const;
  }
}

function getMessageByErrorCode(code: string): string {
  switch (code) {
    case "bad_request:api":
      return "The request couldn't be processed. Please check your input and try again.";
    case "bad_request:chat":
      return "The message format was invalid. Please try again.";

    case "bad_request:model":
      return "The selected AI model isn't available for this organization. Pick another model and try again.";
    case "unauthorized:chat":
      return "You need to sign in to continue chatting.";
    case "forbidden:notebook":
      return "You don't have access to this notebook.";
    case "not_found:notebook":
      return "The notebook was not found. It may have been deleted.";
    case "offline:chat":
      return "We're having trouble sending your message. Please check your connection and try again.";
    case "rate_limit:chat":
      return "You're sending messages too quickly. Please wait a moment and try again.";
    case "rate_limit:image":
      return "You're generating images too quickly. Please wait a moment and try again.";
    case "quota_exceeded:credits":
      return "Your organization has used all of its AI generations. An admin can buy a top-up or upgrade the plan to continue.";
    default:
      return "Something went wrong. Please try again later.";
  }
}

const chatErrorBodySchema = z.object({
  code: z.string().optional(),
  message: z.string().optional(),
});

function parseChatErrorBody(error: Error) {
  try {
    return chatErrorBodySchema.parse(JSON.parse(error.message));
  } catch {
    return null;
  }
}

export function getChatErrorToastMessage(
  error: Error,
  fallback: string,
): string {
  const cause = error.cause;
  if (typeof cause === "string" && cause.trim().length > 0) {
    return cause;
  }

  const parsed = parseChatErrorBody(error);
  if (parsed?.message) return parsed.message;
  if (parsed?.code) return getMessageByErrorCode(parsed.code);

  if (error.message && error.message !== "Failed to fetch") {
    return error.message;
  }

  return fallback;
}

export function isQuotaExceededCreditsError(error: Error): boolean {
  return parseChatErrorBody(error)?.code === "quota_exceeded:credits";
}
