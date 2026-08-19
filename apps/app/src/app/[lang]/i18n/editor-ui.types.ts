export type EditorUiPage = {
  previewTooltip: string;
  publishTooltip: string;
  publishSuccess: string;
  publishLoading: string;
  hintPlaceholder: string;

  editorTitleUntitled: string;
  multipleChoice: {
    addOption: string;
    optionPlaceholder: string;
    optionalLabel: string;
    allowMultipleLabel: string;
    removeOption: string;
  };
  inputField: {
    startTypingPlaceholder: string;
    optionalLabel: string;
    caseSensitiveLabel: string;
  };
  freeFormInput: {
    optionalLabel: string;
    minLengthLabel: string;
    maxLengthLabel: string;
    placeholderAuthor: string;
    placeholderLearner: string;
    charactersLabel: string;
    minLabel: string;
  };
  clozeText: {
    optionalLabel: string;
    wordBankLabel: string;
    resetLabel: string;
    placeholderLead: string;
    gapPlaceholder: string;
    insertGapLabel: string;
    makeBlankLabel: string;
    tabKeyLabel: string;
    tabHintSelectLabel: string;
    tabHintOrLabel: string;
    tabHintBlankLabel: string;
    removeGapLabel: string;
    distractorsLabel: string;
    distractorPlaceholder: string;
    addDistractorLabel: string;
    removeDistractorLabel: string;
    solutionHintLabel: string;
  };
  matchingPairs: {
    editLabel: string;
    addPairLabel: string;
    leftColumnLabel: string;
    rightColumnLabel: string;
    tapToMatchLabel: string;
    resetLabel: string;
    optionalLabel: string;
    removePairLabel: string;
  };
  qaGradedFeedback: {
    correctAnswer: string;
    belongsIn: string;
  };
  columnsMenu: {
    sidebarLeft: string;
    twoColumns: string;
    sidebarRight: string;
  };
  blockOptions: {
    more: string;
    optional: string;
    alignLeft: string;
    alignCenter: string;
    alignRight: string;
    align: string;
    documentation: string;
    openOriginal: string;
    preventLearnerEdit: string;
    allowLearnerEdit: string;
    settings: string;
    delete: string;
    duplicate: string;
    copiedSuccess: string;
    spLabel: string;
  };
  media: {
    imageType: string;
    videoType: string;
    audioType: string;
    noInternetConnection: string;
    addImage: string;
    addVideo: string;
    addAudio: string;
    mediaLinkPlaceholder: string;
    changeMedia: string;
    addOrEditImageLink: string;
    addOrEditVideoLink: string;
    addOrEditAudioLink: string;
    unexpectedLoadError: string;
    videoExportUnsupported: string;
    uploadNotAvailable: string;
  };
  math: {
    invalidEquationPrefix: string;
    enterFormula: string;
    formulaPlaceholder: string;
  };
  audioPlayer: {
    label: string;
    loading: string;
    playing: string;
    stopped: string;
    restart: string;
    playbackSpeed: string;
    skipBack: string;
    skipForward: string;
  };
  steps: {
    addStep: string;
    removeStep: string;
    labelPlaceholder: string;
    stepFallback: string;
    expandStep: string;
    collapseStep: string;
    lockedStep: string;

    progressLabel: string;
    allDone: string;
    optionalLabel: string;
  };
};
