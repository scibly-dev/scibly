type ProductPreviewPoint = { label: string; text: string };

export const SLASH_COMMAND_IDS = [
  "hint",
  "flashcard",
  "character",
  "input",
  "multipleChoice",
  "cloze",
  "dragDrop",
  "freeForm",
  "matching",
] as const;

export type SlashCommandId = (typeof SLASH_COMMAND_IDS)[number];

export const toSlashCommandId = (id: string): SlashCommandId | undefined =>
  SLASH_COMMAND_IDS.find((known) => known === id);

export type SlashCommandGroup = "interactive" | "question";

export type ProductPreviewTabCopy = {
  label: string;
  description: string;

  points: ProductPreviewPoint[];
};

export type HeroDictionary = {
  eyebrow: string;
  title: string;
  titleHighlight: string;
  titleSuffix: string;
  subtitle: string;
  complianceBadges: Array<{
    kind: string;
    label: string;
    detail: string;
  }>;
  video: {
    label: string;
    play: string;
    title: string;
  };
  previewSection: {
    eyebrow: string;
    title: string;
    demoCta: string;
  };
  productAlt: string;
  tabs: {
    notebook: ProductPreviewTabCopy;
    courseBuilder: ProductPreviewTabCopy;
    gamification: ProductPreviewTabCopy;
  };
  notebook: {
    brand: string;
    leave: string;
    newNotebook: string;
    history: string;
    historyActive: string;
    historyItemTwo: string;
    historyItemThree: string;
    chatTitle: string;
    userMessage: string;
    aiReply: string;
    aiFollowUp: string;
    thinking: string;
    studioBuilding: string;
    studioSceneOne: string;
    studioSceneTwo: string;
    studioSceneThree: string;
    questionTitle: string;
    questionStep: string;
    optBeginner: string;
    optAdvanced: string;
    optMixed: string;
    skip: string;
    inputPlaceholder: string;
    tabSources: string;
    tabMedia: string;
    tabStudio: string;
    sourcesLabel: string;
    sourceReady: string;
    sourceOne: string;
    sourceOneMeta: string;
    sourceTwo: string;
    sourceTwoMeta: string;
    sourceThree: string;
    sourceThreeMeta: string;
  };
  courseBuilder: {
    title: string;
    courseTitle: string;
    previewCta: string;
    lessonOne: string;
    lessonTwo: string;
    lessonThree: string;
    estTime: string;
    scenes: string;
    sceneCount: string;
    sceneOne: string;
    sceneTwo: string;
    sceneThree: string;
    sceneFour: string;
    addScene: string;
    sceneLabel: string;
    heading: string;
    slashHint: string;
    bodyParagraph: string;
    slashInteractiveTitle: string;
    slashQuestionTitle: string;

    slashCommands: {
      id: string;

      group: string;
      label: string;
      description: string;
    }[];
    mcLabel: string;
    optOne: string;
    optTwo: string;
    optThree: string;
    addOption: string;
    tabScene: string;
    tabDesign: string;
    tabPreview: string;
    livePreview: string;
    replay: string;
    checkAnswer: string;
    deviceLabel: string;
  };
  gamification: {
    courseTitle: string;
    comboChip: string;
    streakChip: string;
    nextUp: string;

    pathStops: string[];
    lockedLabel: string;
    lessonProgress: string;
    sceneProgress: string;
    guideTip: string;
    question: string;
    optWrong: string;
    optCorrect: string;
    spValue: string;
    earnedLabel: string;
    feedback: string;
    backLabel: string;
    finishLabel: string;
    sceneTypeQuiz: string;
    sceneTypeCloze: string;
    sceneTypeSort: string;
    clozePrompt: string;
    clozeBefore: string;
    clozeMid: string;
    clozeAfter: string;
    clozeGapOne: string;
    clozeGapTwo: string;
    clozeBankLabel: string;
    clozeReset: string;
    clozeBank: string[];
    dndPrompt: string;
    dndAvailableLabel: string;

    dndItems: string[];
    dndZones: string[];
    dndPlacedItem: string;
  };
};
