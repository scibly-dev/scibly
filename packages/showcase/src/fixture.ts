import type {
  GroundTruthCourse,
  GroundTruthDemoMeta,
  ShowcaseCourse,
  ShowcaseFixture,
  ShowcaseGeneratedImage,
} from "./types";

import {
  CYBER_SAFETY_COURSE_ID,
  cyberSafetyCourse,
  cyberSafetyDemoMeta,
} from "@scibly/course-content";

export const SHOWCASE_NOTEBOOK_ID = "demo" as const;
export const SHOWCASE_ORG_SLUG = "demo" as const;
export const SHOWCASE_COURSE_ID = CYBER_SAFETY_COURSE_ID;

const CREATED_AT = "2026-01-15T10:00:00.000Z";

export const showcaseIds = {
  lesson: (index: number) => `demo-lesson-${index + 1}`,
  scene: (index: number) => `demo-scene-${index + 1}`,
  source: (index: number) => `demo-source-${index + 1}`,
};

function buildCourse(course: GroundTruthCourse): ShowcaseCourse {
  let flatSceneIndex = 0;
  return {
    id: SHOWCASE_COURSE_ID,
    title: course.title,
    description: course.description,
    category: course.category,
    tags: course.tags,
    thumbnail: course.thumbnail ?? null,
    lessons: course.lessons.map((lesson, lessonIndex) => {
      const lessonId = showcaseIds.lesson(lessonIndex);
      return {
        id: lessonId,
        courseId: SHOWCASE_COURSE_ID,
        title: lesson.title,
        description: lesson.description,
        order: lesson.order,
        estimatedTimeToCompleteMinutes: lesson.estimatedTimeToCompleteMinutes,
        createdAt: CREATED_AT,
        updatedAt: CREATED_AT,
        scenes: lesson.scenes.map((scene) => {
          const id = showcaseIds.scene(flatSceneIndex);
          flatSceneIndex += 1;
          return {
            id,
            lessonId,
            title: scene.title,
            order: scene.order,
            previewHtml: scene.html,
            sp: scene.sp ?? 0,
            isOutdated: false,
            sources: [],
          };
        }),
      };
    }),
  };
}

export function buildShowcaseFixture(
  groundTruthCourse: GroundTruthCourse = cyberSafetyCourse,
  meta: GroundTruthDemoMeta = cyberSafetyDemoMeta,
): ShowcaseFixture {
  const course = buildCourse(groundTruthCourse);
  const image: ShowcaseGeneratedImage = {
    id: "demo-image-1",
    url: meta.image.url,
    prompt: meta.image.prompt,
    alt: meta.image.alt,
    aspectRatio: meta.image.aspectRatio,
    width: meta.image.width,
    height: meta.image.height,
    byteSize: meta.image.byteSize,
    createdAt: "2026-01-15T10:05:00.000Z",
    toolCallId: "demo-tool-generate-image",
  };
  return {
    notebookId: SHOWCASE_NOTEBOOK_ID,
    orgSlug: SHOWCASE_ORG_SLUG,
    title: meta.notebookTitle,
    sources: meta.sources.map((source, index) => ({
      id: showcaseIds.source(index),
      name: source.name,
      type: source.type,
      status: "READY",
      error: null,
      warning: null,
      fileSize: source.fileSize ?? null,
      pageCount: source.pageCount ?? null,
      url: null,
      externalId: null,
      externalUrl: null,
      lastSyncedAt: null,
      chunkCount: 12,
      createdAt: CREATED_AT,
    })),
    promptOptions: meta.promptOptions,
    course,
    generatedImages: [image],
  };
}

export const showcaseFixture = buildShowcaseFixture();
