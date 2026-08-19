import type {
  CourseMutationEvent,
  GroundTruthSourceType,
} from "@scibly/course-content";

export type {
  GroundTruthCourse,
  GroundTruthDemoMeta,
  GroundTruthDemoSource,
  GroundTruthLesson,
  GroundTruthScene,
} from "@scibly/course-content";
export type ShowcaseSourceType = GroundTruthSourceType;

export type ShowcaseSource = {
  id: string;
  name: string;
  type: ShowcaseSourceType;
  status: "READY";
  error: null;
  warning: null;
  fileSize: number | null;
  pageCount: number | null;
  url: null;
  externalId: null;
  externalUrl: null;
  lastSyncedAt: null;
  chunkCount: number;
  createdAt: string;
};

export type ShowcaseScene = {
  id: string;
  lessonId: string;
  title: string;
  order: number;
  previewHtml: string;
  sp: number;
  isOutdated: false;
  sources: readonly never[];
};

export type ShowcaseLesson = {
  id: string;
  courseId: string;
  title: string;
  description: string;
  order: number;
  estimatedTimeToCompleteMinutes: number;
  createdAt: string;
  updatedAt: string;
  scenes: readonly ShowcaseScene[];
};

export type ShowcaseCourse = {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: readonly string[];
  thumbnail: string | null;
  lessons: readonly ShowcaseLesson[];
};

export type ShowcaseGeneratedImage = {
  id: string;
  url: string;
  prompt: string;
  alt: string;
  aspectRatio: "16:9";
  width: number;
  height: number;
  byteSize: number;
  createdAt: string;
  toolCallId: string;
};

export type ShowcaseFixture = {
  notebookId: string;
  orgSlug: string;
  title: string;
  sources: readonly ShowcaseSource[];
  promptOptions: ReadonlyArray<{ label: string; prompt: string }>;
  course: ShowcaseCourse;
  generatedImages: readonly ShowcaseGeneratedImage[];
};

export type ShowcaseTimelineEvent =
  | { type: "notebook-title-updated"; title: string }
  | CourseMutationEvent;

export type ShowcaseSnapshot = {
  title: string;
  sources: readonly ShowcaseSource[];
  linkedCourse: {
    id: string;
    title: string;
    lessons: readonly ShowcaseLesson[];
  } | null;
  generatedImages: readonly ShowcaseGeneratedImage[];
  timelinePlayed: boolean;
  activeLessonId: string | null;
  activeSceneId: string | null;
};
