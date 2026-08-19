import { EnrollmentStatus } from "@scibly/db/enums";
import { assertExhaustive } from "@scibly/lib";

import {
  getSequenceViolation,
  type SequenceViolation,
} from "./scene-order-rules";

export function getActiveAttempt(entity: {
  status: EnrollmentStatus;
  triesUsed: number;
}): number {
  return entity.status === EnrollmentStatus.COMPLETED
    ? entity.triesUsed
    : entity.triesUsed + 1;
}

export function computeScorePct(earned: number, possible: number): number {
  if (possible <= 0) return 100;
  return Math.round((earned / possible) * 100);
}

export function passesScore(
  scorePct: number | null,
  passingScorePct: number | null,
): boolean {
  return (
    passingScorePct === null ||
    (scorePct !== null && scorePct >= passingScorePct)
  );
}

export function hasAttemptsRemaining(
  triesUsed: number,
  maxTries: number | null,
): boolean {
  return maxTries === null || triesUsed < maxTries;
}

export function evaluatePassState(params: {
  status: EnrollmentStatus;
  scorePct: number | null;
  passingScorePct: number | null;
}): boolean {
  return (
    params.status === EnrollmentStatus.COMPLETED &&
    passesScore(params.scorePct, params.passingScorePct)
  );
}

export type AttemptState =
  | {
      status: "active";
      completedSceneIds: ReadonlySet<string>;
    }
  | {
      status: "finished";
      completedSceneIds: ReadonlySet<string>;
      passed: boolean;
      triesUsed: number;
      maxTries: number | null;
    };

type AttemptCommand =
  | {
      type: "complete-scene";
      sceneId: string;
      orderedSceneIds: readonly string[];
    }
  | { type: "reopen-failed-attempt" };

export type AttemptTransition =
  | { kind: "accepted"; state: AttemptState }
  | { kind: "idempotent"; state: AttemptState }
  | {
      kind: "rejected";
      reason:
        | "ATTEMPT_FINISHED"
        | "ATTEMPT_ACTIVE"
        | "ATTEMPT_PASSED"
        | "NO_TRIES_REMAINING"
        | SequenceViolation;
    };

export function transitionAttempt(
  state: AttemptState,
  command: AttemptCommand,
): AttemptTransition {
  switch (command.type) {
    case "complete-scene": {
      if (state.status === "finished") {
        return { kind: "rejected", reason: "ATTEMPT_FINISHED" };
      }
      if (state.completedSceneIds.has(command.sceneId)) {
        return { kind: "idempotent", state };
      }
      const violation = getSequenceViolation(
        command.orderedSceneIds,
        state.completedSceneIds,
        command.sceneId,
      );
      if (violation) return { kind: "rejected", reason: violation };
      return {
        kind: "accepted",
        state: {
          status: "active",
          completedSceneIds: new Set([
            ...state.completedSceneIds,
            command.sceneId,
          ]),
        },
      };
    }
    case "reopen-failed-attempt": {
      if (state.status === "active") {
        return { kind: "rejected", reason: "ATTEMPT_ACTIVE" };
      }
      if (state.passed) {
        return { kind: "rejected", reason: "ATTEMPT_PASSED" };
      }
      if (!hasAttemptsRemaining(state.triesUsed, state.maxTries)) {
        return { kind: "rejected", reason: "NO_TRIES_REMAINING" };
      }
      return {
        kind: "accepted",
        state: { status: "active", completedSceneIds: new Set() },
      };
    }
    default: {
      throw assertExhaustive(command);
    }
  }
}
