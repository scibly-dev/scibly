export type GroundTruthScene = {
  key: string;
  title: string;
  order: number;
  html: string;
  sp?: number;
};

export type GroundTruthLesson = {
  key: string;
  title: string;
  description: string;
  order: number;
  estimatedTimeToCompleteMinutes: number;
  scenes: GroundTruthScene[];
};

export type GroundTruthCourse = {
  key: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  thumbnail?: string;
  lessons: GroundTruthLesson[];
};

export type GroundTruthSourceType =
  | "PDF"
  | "TEXT"
  | "NOTION_PAGE";

export type GroundTruthDemoSource = {
  key: string;
  name: string;
  type: GroundTruthSourceType;
  fileSize?: number;
  pageCount?: number;
};

export type GroundTruthDemoMeta = {
  notebookTitle: string;
  sources: GroundTruthDemoSource[];
  promptOptions: ReadonlyArray<{ label: string; prompt: string }>;
  image: {
    key: string;
    url: string;
    prompt: string;
    alt: string;
    aspectRatio: "16:9";
    width: number;
    height: number;
    byteSize: number;
  };
  searchExcerpt: {
    query: string;
    results: Array<{
      sourceKey: string;
      excerpt: string;
    }>;
  };
};
