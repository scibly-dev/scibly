/**
 * The slice of tRPC utils the course builder uses — named explicitly (instead
 * of `ReturnType<typeof api.useUtils>`) so tests can provide a fake without a
 * cast.
 */
export interface CourseBuilderQueryClient {
  course: {
    getById: {
      fetch: (input: {
        courseId: string;
      }) => Promise<{ id: string; title: string } | null>;
    };
    getLesson: {
      fetch: (input: {
        courseId: string;
        lessonId: string;
      }) => Promise<{ id: string; title: string }>;
    };
    listLessons: {
      invalidate: (input: { courseId: string }) => Promise<void>;
      /**
       * Read at the same key the lesson navigator renders from — the deletion
       * repair needs the order the author was looking at, not a fresh one.
       */
      getData: (input: {
        courseId: string;
        limit: number;
      }) => { items: { id: string; title: string }[] } | undefined;
    };
    getOutdatedScenes: {
      invalidate: (input: { courseId: string }) => Promise<void>;
    };
  };
  scene: {
    getLessonScenes: {
      invalidate: (input?: { lessonId: string }) => Promise<void>;
      cancel: (input: { lessonId: string }) => Promise<void>;
      getData: (input: {
        lessonId: string;
      }) => { id: string; title: string }[] | undefined;
    };
  };
}
