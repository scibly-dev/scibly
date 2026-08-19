import type { Editor } from "@tiptap/core";
import type { SnapshotFrom } from "xstate";
import type { QuestionBlockMap } from "@/shared/content/editor/assessment/parsing/base-parser/types";
import type { PlayerLesson } from "../../utils/player-types";
import type { NavigationTranslations } from "../utils/lesson-progression-helpers";
import type { SceneFeedbackSummary } from "../utils/scene-feedback-summary";
import type { lessonProgressionMachine } from "./lesson-progression.machine";
import type {
  PendingSceneSubmission,
  SceneKind,
} from "./lesson-progression.model";

import { getQuestionBlockIdsFromEditor } from "@/shared/content/editor/assessment/grading/question-block-order";

import {
  collectBlocksFromEditor,
  getButtonLabel,
  getSceneQuestionBlocksForEditor,
} from "../utils/lesson-progression-helpers";

type ProgressionSnapshot = SnapshotFrom<typeof lessonProgressionMachine>;

interface QuestionBlockStoreSnapshot {
  editor: Editor | null;
  questionBlocks: QuestionBlockMap;
  submitAnswers: () => boolean;
  checkIfAllAnswered: (questionBlocks: QuestionBlockMap) => {
    newQuestionBlocks: QuestionBlockMap;
    allAnswered: boolean;
  };
}

export interface SceneAssessment {
  editor: Editor | null;
  currentScene: PlayerLesson["scenes"][number] | undefined;
  manifestKind: SceneKind | undefined;
  sceneQuestionBlocks: QuestionBlockMap;
  sceneBlockIds: string[];
  hasQuestions: boolean;
  hasChecked: boolean;
  allAnswered: boolean;
  questionBlocksRegistered: boolean;
  submitAnswers: () => boolean;
  collectBlocks: () => PendingSceneSubmission["blocks"];
}

export function sceneKindFromManifest(
  scene: PlayerLesson["scenes"][number],
): SceneKind {
  if (
    scene.kind === "assessment" ||
    scene.kind === "content" ||
    scene.kind === "pitch"
  ) {
    return scene.kind;
  }
  throw new Error(`Scene "${scene.id}" is missing a manifest kind.`);
}

export function deriveSceneAssessment(
  store: QuestionBlockStoreSnapshot,
  currentScene: PlayerLesson["scenes"][number] | undefined,
  pendingSubmission: PendingSceneSubmission | undefined,
): SceneAssessment {
  const { editor, questionBlocks, checkIfAllAnswered, submitAnswers } = store;
  const manifestKind = currentScene
    ? sceneKindFromManifest(currentScene)
    : undefined;
  const isManifestAssessment = manifestKind === "assessment";
  const editorReady = Boolean(editor && !editor.isDestroyed);
  const sceneQuestionBlocks = getSceneQuestionBlocksForEditor(
    editor,
    questionBlocks,
  );
  const sceneBlockIds = editorReady
    ? getQuestionBlockIdsFromEditor(editor)
    : [];
  const hasQuestions = sceneBlockIds.length > 0;
  const hasChecked = Boolean(pendingSubmission?.gradedBlocks?.length);
  const questionBlocksRegistered =
    !isManifestAssessment ||
    (editorReady &&
      sceneBlockIds.length > 0 &&
      sceneBlockIds.every((blockId) => sceneQuestionBlocks.has(blockId)));
  const allAnswered =
    !isManifestAssessment ||
    (editorReady &&
      sceneBlockIds.length > 0 &&
      sceneQuestionBlocks.size >= sceneBlockIds.length &&
      checkIfAllAnswered(sceneQuestionBlocks).allAnswered);
  return {
    editor,
    currentScene,
    manifestKind,
    sceneQuestionBlocks,
    sceneBlockIds,
    hasQuestions,
    hasChecked,
    allAnswered,
    questionBlocksRegistered,
    submitAnswers,
    collectBlocks: () => collectBlocksFromEditor(editor, questionBlocks),
  };
}

interface LessonProgressionSceneFacet {
  currentScene: PlayerLesson["scenes"][number] | undefined;
  sceneIndex: number;
  totalScenes: number;
  canGoBack: boolean;
  sceneFeedbackSummary: SceneFeedbackSummary | null;
}

interface LessonProgressionChromeFacet {
  buttonLabel: string;
  canAdvance: boolean;
  showExitConfirm: boolean;
  showMenu: boolean;
  lastEarnedSP: number;
  showSPAnimation: boolean;
  isCelebrating: boolean;
  completedSceneIdsInSession: Record<string, true>;
}

interface LessonProgressionSubmissionFacet {
  isPending: boolean;
  submissionError: string | null;
}

interface DeriveLessonProgressionViewInput {
  snapshot: ProgressionSnapshot;
  assessment: SceneAssessment;
  totalScenes: number;
  isReadOnly: boolean;
  pendingSubmission: PendingSceneSubmission | undefined;
  t?: NavigationTranslations;
}

export interface LessonProgressionView {
  scene: LessonProgressionSceneFacet;
  chrome: LessonProgressionChromeFacet;
  submission: LessonProgressionSubmissionFacet;
}

export function deriveLessonProgressionView(
  input: DeriveLessonProgressionViewInput,
): LessonProgressionView {
  const {
    snapshot,
    assessment,
    totalScenes,
    isReadOnly,
    pendingSubmission,
    t,
  } = input;
  const context = snapshot.context;
  const isPending = snapshot.hasTag("pending");
  const sceneFeedbackSummary =
    assessment.hasChecked && pendingSubmission?.feedbackSummary
      ? pendingSubmission.feedbackSummary
      : null;
  const submissionError = context.submissionError
    ? (t?.submissionError ?? "We couldn't check your answer. Please try again.")
    : null;
  const canAdvance =
    snapshot.hasTag("canAdvance") ||
    snapshot.hasTag("canFinish") ||
    (snapshot.hasTag("canSubmit") &&
      (!snapshot.hasTag("requiresAnswers") ||
        (assessment.allAnswered && assessment.questionBlocksRegistered)));

  return {
    scene: {
      currentScene: assessment.currentScene,
      sceneIndex: context.sceneIndex,
      totalScenes,
      canGoBack: context.sceneIndex > 0,
      sceneFeedbackSummary,
    },
    chrome: {
      buttonLabel: getButtonLabel(
        isPending,
        context.sceneIndex,
        totalScenes,
        snapshot.matches({
          playing: { assessment: "answering" },
        }),
        isReadOnly,
        t,
      ),
      canAdvance,
      showExitConfirm: context.showExitConfirm,
      showMenu: context.showMenu,
      lastEarnedSP: context.lastEarnedSP,
      showSPAnimation: context.showSPAnimation,
      isCelebrating: snapshot.matches("celebrating"),
      completedSceneIdsInSession: context.completedSceneIdsInSession,
    },
    submission: {
      isPending,
      submissionError,
    },
  };
}
