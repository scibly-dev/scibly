export type ChecklistDictionary = {
  title: string;
  description: string;
  windowTitle: string;
  stepCount: string;
  groups: {
    label: string;
    items: { label: string; meta: string; done: boolean }[];
  }[];
};

export type ProgressDictionary = {
  title: string;
  description: string;
  windowTitle: string;
  assignedLabel: string;
  people: {
    name: string;
    initials: string;
    status: string;
    progress: number;
  }[];
};

export type QuestionsDictionary = {
  title: string;
  description: string;
  windowTitle: string;
  learnerName: string;
  learnerInitials: string;
  question: string;
  aiName: string;
  answer: string;
  feedbackLabel: string;
  feedbackText: string;
  improvedLabel: string;
};

export type CourseDictionary = {
  title: string;
  description: string;
  lessonEyebrow: string;
  lessonTitle: string;
  whyLabel: string;
  whyText: string;
  quizQuestion: string;
  quizOptionWrong: string;
  quizOptionRight: string;
};

export type OnboardingFlowDictionary = {
  eyebrow: string;
  title: string;
  subtitle: string;
  checklist: ChecklistDictionary;
  progress: ProgressDictionary;
  questions: QuestionsDictionary;
  course: CourseDictionary;
};
