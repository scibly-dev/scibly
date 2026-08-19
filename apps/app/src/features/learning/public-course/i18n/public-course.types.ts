export interface PublicCourseTranslations {
  metadata: {
    title: string;
    description: string;
  };
  unavailable: {
    title: string;
    description: string;
  };
  progress: {
    ephemeral: string;
  };
  header: {
    offer: string;
    cta: string;
  };
  footer: {
    message: string;
    cta: string;
  };
  pitch: {
    filename: string;
    demo: {
      question: string;
      optionA: string;
      optionB: string;
    };
    title: string;
    message: string;
    cta: string;
  };
}
