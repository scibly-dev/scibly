import type {
  BlockSubmission,
  DisplayedGrade,
} from "@/shared/content/contracts";

import { getContiguousCompletedIndex } from "@/features/learning/progression/scene-order-rules";

import {
  buildSceneFeedbackSummary,
  type SceneFeedbackSummary,
} from "../utils/scene-feedback-summary";

export type PendingSceneSubmission = {
  sceneId: string;
  blocks: BlockSubmission[] | undefined;
  gradedBlocks?: DisplayedGrade[];
  feedbackSummary?: SceneFeedbackSummary;
  explanation?: string | null;
  /** The payload submit(work) sent, replayed into the app on a revisit. */
  practiceWork?: unknown;
};

export interface SceneResult {
  spEarned: number;
  gradedBlocks?: DisplayedGrade[] | null;
  explanation?: string | null;
}

export type ScenePlayMode = "assessment" | "content" | "pitch";

export interface SceneSubmissionCommand {
  requestId: string;
  sceneId: string;
  blocks: BlockSubmission[] | undefined;
  practiceWork?: unknown;
}

export type SubmitScene = (
  command: SceneSubmissionCommand,
) => Promise<SceneResult>;

// Resumes a lesson after the player unmounts; preview has no server copy, so
// its navigation hook keeps this snapshot in memory instead.
export interface LessonSessionSnapshot {
  sceneIndex: number;
  sessionSP: number;
  completedSceneIds: string[];
  pendingSubmissions: Record<string, PendingSceneSubmission>;
}

export interface LessonProgressionContext {
  sceneIds: string[];
  scenePlayModes: Record<string, ScenePlayMode>;
  sceneIndex: number;
  pendingSubmissions: Record<string, PendingSceneSubmission>;
  completedSceneIdsInSession: Record<string, true>;
  sessionSP: number;
  pendingRequest: SceneSubmissionCommand | null;
  submissionError: string | null;
  retryCount: number;
  showExitConfirm: boolean;
  showMenu: boolean;
  lastEarnedSP: number;
  showSPAnimation: boolean;
  completionSP: number | null;
  isReadOnly: boolean;
  submitScene: SubmitScene;
  onComplete: (spEarned: number) => void;
}

export function isTransportFailure(error: unknown): boolean {
  return !(typeof error === "object" && error !== null && "code" in error);
}

export const MAX_AUTO_RETRIES = 3;

const RETRY_BASE_DELAY_MS = 40;

export interface RetryDelayInput {
  attempt: number;
}

export async function retryBackoff({ attempt }: RetryDelayInput) {
  const delayMs = RETRY_BASE_DELAY_MS * 2 ** attempt;
  await new Promise((resolve) => setTimeout(resolve, delayMs));
}

export interface LessonProgressionInput {
  sceneIds: string[];
  scenePlayModes: Record<string, ScenePlayMode>;
  initialSceneIndex?: number;
  initialPendingSubmissions?: Record<string, PendingSceneSubmission>;
  completedSceneIds?: string[];
  initialSessionSP?: number;
  isReadOnly?: boolean;
  submitScene: SubmitScene;
  onComplete: (spEarned: number) => void;
}

export type LessonProgressionEvent =
  | {
      type: "SUBMIT";
      sceneId: string;
      command: SceneSubmissionCommand;
    }
  | {
      type: "NEXT";
      sceneId: string;
    }
  | {
      type: "FINISH";
      sceneId: string;
    }
  | {
      type: "GO_TO_SCENE";
      sceneId: string;
      index: number;
      snapshot?: PendingSceneSubmission;
    }
  | {
      type: "EXIT";
      action: "show" | "hide" | "toggleMenu";
    }
  | { type: "ANIMATION_FINISHED" };

export interface SubmissionActorInput {
  command: SceneSubmissionCommand;
  submitScene: SubmitScene;
}

export interface SubmissionActorOutput {
  requestId: string;
  result: SceneResult;
}

export type LessonProgressionMachineEvent =
  | LessonProgressionEvent
  | {
      type: "xstate.done.actor.submitScene";
      output: SubmissionActorOutput;
    }
  | {
      type: "xstate.error.actor.submitScene";
      error: unknown;
    };

export function completedSceneIdSet(context: LessonProgressionContext) {
  return new Set(Object.keys(context.completedSceneIdsInSession));
}

export function contiguousCompletedSceneIndex(
  context: LessonProgressionContext,
): number {
  if (context.isReadOnly) return context.sceneIds.length - 1;
  return getContiguousCompletedIndex(
    context.sceneIds,
    completedSceneIdSet(context),
  );
}

export function highestReachableSceneIndex(
  context: LessonProgressionContext,
): number {
  if (context.isReadOnly) return context.sceneIds.length - 1;
  return Math.min(
    contiguousCompletedSceneIndex(context) + 1,
    context.sceneIds.length - 1,
  );
}

function buildScenePlayModesFromIds(
  sceneIds: readonly string[],
  scenePlayModes: Record<string, ScenePlayMode>,
) {
  const map: Record<string, ScenePlayMode> = {};
  for (const sceneId of sceneIds) {
    const kind = scenePlayModes[sceneId];
    if (!kind) {
      throw new Error(`Missing scene kind for "${sceneId}".`);
    }
    map[sceneId] = kind;
  }
  return map;
}

export function currentSceneId(context: LessonProgressionContext) {
  return context.sceneIds[context.sceneIndex];
}

export function currentScenePlayMode(
  context: LessonProgressionContext,
): ScenePlayMode | undefined {
  const sceneId = currentSceneId(context);
  return sceneId ? context.scenePlayModes[sceneId] : undefined;
}

export function hasFeedback(
  context: LessonProgressionContext,
  sceneId = currentSceneId(context),
) {
  return Boolean(
    sceneId &&
    context.pendingSubmissions[sceneId]?.gradedBlocks &&
    context.pendingSubmissions[sceneId].gradedBlocks.length > 0,
  );
}

// An ungraded practice produces no other feedback, so the scene must not auto-advance past it.
export function hasExplanation(
  context: LessonProgressionContext,
  sceneId = currentSceneId(context),
) {
  return Boolean(sceneId && context.pendingSubmissions[sceneId]?.explanation);
}

export function isCompleted(
  context: LessonProgressionContext,
  sceneId = currentSceneId(context),
) {
  return Boolean(sceneId && context.completedSceneIdsInSession[sceneId]);
}

export function isCurrentScene(
  context: LessonProgressionContext,
  event: { sceneId: string },
) {
  return currentSceneId(context) === event.sceneId;
}

export function isFinalScene(context: LessonProgressionContext) {
  return (
    context.sceneIds.length > 0 &&
    context.sceneIndex === context.sceneIds.length - 1
  );
}

export function snapshotAssignment(
  context: LessonProgressionContext,
  event: Extract<LessonProgressionEvent, { type: "GO_TO_SCENE" }>,
) {
  if (!event.snapshot || !isCurrentScene(context, event)) return {};
  const existing = context.pendingSubmissions[event.sceneId];
  if (existing?.gradedBlocks?.length) return {};
  return {
    pendingSubmissions: {
      ...context.pendingSubmissions,
      [event.sceneId]: event.snapshot,
    },
  };
}

export function feedbackFor(
  result: SceneResult,
): SceneFeedbackSummary | undefined {
  if (!result.gradedBlocks?.length) return undefined;
  return buildSceneFeedbackSummary(result.gradedBlocks) ?? undefined;
}

export function applySceneResult(
  context: LessonProgressionContext,
  output: SubmissionActorOutput,
) {
  const request = context.pendingRequest;
  if (!request || request.requestId !== output.requestId) return {};
  const result = output.result;
  const alreadyCompleted = isCompleted(context, request.sceneId);
  const awardedSP = alreadyCompleted ? 0 : result.spEarned;
  const existing = context.pendingSubmissions[request.sceneId];

  return {
    pendingRequest: null,
    submissionError: null,
    retryCount: 0,
    pendingSubmissions: {
      ...context.pendingSubmissions,
      [request.sceneId]: {
        sceneId: request.sceneId,
        blocks: request.blocks ?? existing?.blocks,
        gradedBlocks: result.gradedBlocks ?? undefined,
        feedbackSummary: feedbackFor(result),
        explanation: result.explanation ?? null,
        practiceWork: request.practiceWork ?? existing?.practiceWork,
      },
    },
    completedSceneIdsInSession: alreadyCompleted
      ? context.completedSceneIdsInSession
      : {
          ...context.completedSceneIdsInSession,
          [request.sceneId]: true as const,
        },
    sessionSP: context.sessionSP + awardedSP,
    lastEarnedSP: awardedSP,
    showSPAnimation: awardedSP > 0 || context.showSPAnimation,
  };
}

// Pitches never earn a server-side progress row, so seed one as completed
// only when a completed real scene after it proves a prior session passed it.
function seedPassedPitchScenes(
  sceneIds: readonly string[],
  scenePlayModes: Record<string, ScenePlayMode>,
  completedSceneIds: readonly string[],
): string[] {
  const completed = new Set(completedSceneIds);
  const seeded = [...completedSceneIds];
  let unproven: string[] = [];
  for (const sceneId of sceneIds) {
    if (scenePlayModes[sceneId] === "pitch") {
      unproven.push(sceneId);
    } else if (completed.has(sceneId)) {
      seeded.push(...unproven);
      unproven = [];
    } else {
      break;
    }
  }
  return seeded;
}

export function createLessonProgressionContext(
  input: LessonProgressionInput,
): LessonProgressionContext {
  const scenePlayModes = buildScenePlayModesFromIds(
    input.sceneIds,
    input.scenePlayModes,
  );
  const completedSceneIds = seedPassedPitchScenes(
    input.sceneIds,
    scenePlayModes,
    input.completedSceneIds ?? [],
  );
  const lastSceneIndex = input.sceneIds.length - 1;
  const highestReachableIndex = input.isReadOnly
    ? lastSceneIndex
    : Math.min(
        getContiguousCompletedIndex(
          input.sceneIds,
          new Set(completedSceneIds),
        ) + 1,
        lastSceneIndex,
      );
  const sceneIndex = Math.min(
    Math.max(input.initialSceneIndex ?? 0, 0),
    Math.max(highestReachableIndex, 0),
  );
  return {
    sceneIds: input.sceneIds,
    scenePlayModes,
    sceneIndex,
    pendingSubmissions: input.initialPendingSubmissions ?? {},
    completedSceneIdsInSession: Object.fromEntries(
      completedSceneIds.map((sceneId) => [sceneId, true] as const),
    ),
    sessionSP: input.initialSessionSP ?? 0,
    pendingRequest: null,
    submissionError: null,
    retryCount: 0,
    showExitConfirm: false,
    showMenu: false,
    lastEarnedSP: 0,
    showSPAnimation: false,
    completionSP: null,
    isReadOnly: input.isReadOnly ?? false,
    submitScene: input.submitScene,
    onComplete: input.onComplete,
  };
}
