import type { ComparisonDictionary } from "@/app/[lang]/components/home-page-section/comparison/i18n/comparison.types";
import type { CtaDictionary } from "@/app/[lang]/components/home-page-section/cta/i18n/cta.types";
import type { FaqItem } from "@/components/faq/faq-list";

export type OnboardingOffboardingPage = {
  meta: { title: string; description: string; keywords: string[] };
  hero: {
    headline: string;
    subheadline: string;
    ctaLabel: string;
  };
  featureShowcaseHeader: {
    eyebrow: string;
    title: string;
    subtitle: string;
  };
  comparisonRows: ComparisonDictionary["table"]["rows"];
  knowledgeSources: {
    eyebrow: string;
    title: string;
    subtitle: string;
    capturedLabel: string;
    interview: {
      title: string;
      description: string;
      timer: string;
      aiName: string;
      listeningLabel: string;
      question: string;
    };
    artifacts: {
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
    knowledge: {
      eyebrow: string;
      title: string;
      fact1: string;
      fact2: string;
      verifiedLabel: string;
    };
    lesson: {
      title: string;
      derivedLabel: string;
      description: string;
      lessonEyebrow: string;
      lessonTitle: string;
      quizQuestion: string;
      quizOptionWrong: string;
      quizOptionRight: string;
    };
  };
  problemNumbers: {
    eyebrow: string;
    title: string;
    problemLabel: string;
    problemBody: string;
    stats: { value: string; label: string }[];
  };
  onboardingFlow: {
    eyebrow: string;
    title: string;
    subtitle: string;
    checklist: {
      title: string;
      description: string;
      windowTitle: string;
      stepCount: string;
      groups: {
        label: string;
        items: { label: string; meta: string; done: boolean }[];
      }[];
    };
    progress: {
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
    questions: {
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
    course: {
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
  };
  cta: CtaDictionary;
  faq: { title: string; questions: FaqItem[] };
};

export type KnowledgeSourcesCopy =
  OnboardingOffboardingPage["knowledgeSources"];
export type InterviewCopy = KnowledgeSourcesCopy["interview"];
export type ArtifactsCopy = KnowledgeSourcesCopy["artifacts"];
export type KnowledgeCopy = KnowledgeSourcesCopy["knowledge"];
export type LessonCopy = KnowledgeSourcesCopy["lesson"];

export type ProblemNumbersCopy = OnboardingOffboardingPage["problemNumbers"];

export type OnboardingFlowCopy = OnboardingOffboardingPage["onboardingFlow"];
export type ChecklistCopy = OnboardingFlowCopy["checklist"];
export type ProgressCopy = OnboardingFlowCopy["progress"];
export type QuestionsCopy = OnboardingFlowCopy["questions"];
export type CourseCopy = OnboardingFlowCopy["course"];
