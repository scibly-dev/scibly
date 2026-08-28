export type InterviewDictionary = {
  title: string;
  description: string;
  timer: string;
  aiName: string;
  listeningLabel: string;
  question: string;
};

export type ArtifactsDictionary = {
  title: string;
  description: string;
  slackChannel: string;
  slackTime: string;
  slackAuthor: string;
  slackText: string;
  codeFile: string;
  codeReview: string;
  codeRemoved: string;
  codeAdded: string;
  codeComment: string;
  ticketId: string;
  ticketStatus: string;
  ticketTitle: string;
  ticketCause: string;
};

export type KnowledgeDictionary = {
  eyebrow: string;
  title: string;
  fact1: string;
  fact2: string;
  verifiedLabel: string;
};

export type LessonDictionary = {
  title: string;
  derivedLabel: string;
  description: string;
  lessonEyebrow: string;
  lessonTitle: string;
  quizQuestion: string;
  quizOptionWrong: string;
  quizOptionRight: string;
};

export type KnowledgeSourcesDictionary = {
  eyebrow: string;
  title: string;
  subtitle: string;
  capturedLabel: string;
  interview: InterviewDictionary;
  artifacts: ArtifactsDictionary;
  knowledge: KnowledgeDictionary;
  lesson: LessonDictionary;
};
