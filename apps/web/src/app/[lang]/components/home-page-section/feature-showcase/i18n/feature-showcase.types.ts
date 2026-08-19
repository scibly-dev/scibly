export type FeatureDetailCopy = {
  body: string;
  highlights: string[];
};

type ProviderCopy = {
  name: string;
  detail: string;
};

type SeriesPoint = {
  label: string;
  rate: number;
};

export type FeatureShowcaseDictionary = {
  eyebrow: string;
  title: string;
  subtitle: string;
  journeyLabel: string;
  expandAriaLabel: string;
  closeLabel: string;
  ctaPrimary: string;
  ctaSecondary: string;
  import: {
    phase: string;
    title: string;
    stageLabel: string;
    detail: FeatureDetailCopy;
    source1Label: string;
    source1Sub: string;
    source2Label: string;
    source2Sub: string;
    source3Label: string;
    source3Sub: string;
    source4Label: string;
    source4Sub: string;
    source5Label: string;
    source5Sub: string;
    modelLabel: string;
    courseLabel: string;
    lessonCount: string;
    syncBadge: string;
    syncedLabel: string;
    lessons: string[];
  };
  channels: {
    phase: string;
    title: string;
    stageLabel: string;
    detail: FeatureDetailCopy;
    channel: string;
    botName: string;
    chat1Author: string;
    chat1Text: string;
    chat2Author: string;
    chat2Text: string;
    lessonLabel: string;
    quizQ: string;
    optCorrect: string;
    optWrong: string;
    correct: string;
  };
  learner: {
    phase: string;
    title: string;
    stageLabel: string;
    detail: FeatureDetailCopy;
    question: string;
    optA: string;
    optB: string;
    optC: string;
    spValue: string;
    earnedLabel: string;
    comboLabel: string;
    streakValue: string;
    streakLabel: string;
    levelValue: string;
    levelLabel: string;
    xpLabel: string;
    feedback: string;
    nextLabel: string;
    clozeBefore: string;
    clozeMid: string;
    clozeAfter: string;
    clozeGapOne: string;
    clozeGapTwo: string;
    clozeBankLabel: string;
    clozeReset: string;
    clozeBank: string[];
  };
  analytics: {
    phase: string;
    title: string;
    stageLabel: string;
    detail: FeatureDetailCopy;
    youLabel: string;
    query: string;
    replyLabel: string;
    chartLabel: string;
    peakLabel: string;
    eventLabel: string;
    gapBody: string;

    series: SeriesPoint[];
  };
  byoai: {
    phase: string;
    title: string;
    stageLabel: string;
    detail: FeatureDetailCopy;
    panelLabel: string;
    inputPlaceholder: string;
    youLabel: string;
    query: string;
    replyLabel: string;
    reply: string;
    viaLabel: string;
    trustChips: string[];

    providers: ProviderCopy[];
    yoursLabel: string;
    yoursDetail: string;
  };
};
