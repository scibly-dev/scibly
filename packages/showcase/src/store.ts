import type {
  ShowcaseFixture,
  ShowcaseLesson,
  ShowcaseScene,
  ShowcaseSnapshot,
  ShowcaseTimelineEvent,
} from "./types";

export type ShowcaseStore = {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => ShowcaseSnapshot;
  reset: () => void;
  beginTimelineReplay: () => boolean;
  applyTimelineEvent: (event: ShowcaseTimelineEvent) => void;
  updateNotebookTitle: (title: string) => void;
  updateSceneTitle: (sceneId: string, title: string) => void;
  setActiveLesson: (lessonId: string) => void;
  setActiveScene: (sceneId: string) => void;
};

function immutableArray<T>(items: readonly T[]): readonly T[] {
  return Object.freeze([...items]);
}

export function createShowcaseStore(fixture: ShowcaseFixture): ShowcaseStore {
  const listeners = new Set<() => void>();
  const lessonCatalog = new Map(
    fixture.course.lessons.map((lesson) => [lesson.id, lesson] as const),
  );
  const sceneCatalog = new Map(
    fixture.course.lessons.flatMap((lesson) =>
      lesson.scenes.map((scene) => [scene.id, scene] as const),
    ),
  );
  const sceneLessonIds = new Map(
    fixture.course.lessons.flatMap((lesson) =>
      lesson.scenes.map((scene) => [scene.id, lesson.id] as const),
    ),
  );

  let title = fixture.title;
  let courseLinked = false;
  let timelinePlayed = false;
  let revealedLessonIds: string[] = [];
  let revealedSceneIdsByLesson = new Map<string, string[]>();
  let lessonTitleOverrides = new Map<string, string>();
  let sceneTitleOverrides = new Map<string, string>();
  let activeLessonId: string | null = null;
  let activeSceneId: string | null = null;
  let snapshot = buildSnapshot();

  function materializeScene(scene: ShowcaseScene): ShowcaseScene {
    return Object.freeze({
      ...scene,
      title: sceneTitleOverrides.get(scene.id) ?? scene.title,
      sources: immutableArray(scene.sources),
    });
  }

  function materializeLesson(lesson: ShowcaseLesson): ShowcaseLesson {
    const sceneIds = revealedSceneIdsByLesson.get(lesson.id) ?? [];
    const scenes = sceneIds.flatMap((id) => {
      const scene = sceneCatalog.get(id);
      return scene ? [materializeScene(scene)] : [];
    });
    return Object.freeze({
      ...lesson,
      title: lessonTitleOverrides.get(lesson.id) ?? lesson.title,
      scenes: immutableArray(scenes),
    });
  }

  function buildSnapshot(): ShowcaseSnapshot {
    const lessons = revealedLessonIds.flatMap((id) => {
      const lesson = lessonCatalog.get(id);
      return lesson ? [materializeLesson(lesson)] : [];
    });
    const linkedCourse = courseLinked
      ? Object.freeze({
          id: fixture.course.id,
          title: fixture.course.title,
          lessons: immutableArray(lessons),
        })
      : null;

    return Object.freeze({
      title,
      sources: immutableArray(
        fixture.sources.map((source) => Object.freeze({ ...source })),
      ),
      linkedCourse,
      generatedImages: immutableArray(
        fixture.generatedImages.map((image) => Object.freeze({ ...image })),
      ),
      timelinePlayed,
      activeLessonId,
      activeSceneId,
    });
  }

  function publish() {
    snapshot = buildSnapshot();
    listeners.forEach((listener) => listener());
  }

  function reset() {
    title = fixture.title;
    courseLinked = false;
    timelinePlayed = false;
    revealedLessonIds = [];
    revealedSceneIdsByLesson = new Map();
    lessonTitleOverrides = new Map();
    sceneTitleOverrides = new Map();
    activeLessonId = null;
    activeSceneId = null;
    publish();
  }

  function beginTimelineReplay(): boolean {
    if (timelinePlayed) return false;
    timelinePlayed = true;
    publish();
    return true;
  }

  function applyTimelineEvent(event: ShowcaseTimelineEvent) {
    switch (event.type) {
      case "notebook-title-updated":
        title = event.title;
        publish();
        return;
      case "course-created":
        courseLinked = true;
        publish();
        return;
      case "lesson-created":
      case "lesson-updated": {
        if (!lessonCatalog.has(event.lesson.id)) return;
        lessonTitleOverrides.set(event.lesson.id, event.lesson.title);
        if (!revealedLessonIds.includes(event.lesson.id)) {
          revealedLessonIds = [...revealedLessonIds, event.lesson.id];
        }
        activeLessonId ??= event.lesson.id;
        publish();
        return;
      }
      case "lesson-deleted":
        revealedLessonIds = revealedLessonIds.filter(
          (id) => id !== event.lessonId,
        );
        revealedSceneIdsByLesson.delete(event.lessonId);
        if (activeLessonId === event.lessonId) {
          activeLessonId = revealedLessonIds[0] ?? null;
          activeSceneId = activeLessonId
            ? (revealedSceneIdsByLesson.get(activeLessonId)?.[0] ?? null)
            : null;
        }
        publish();
        return;
      case "lessons-reordered":
        revealedLessonIds = event.lessonIds.filter((id) =>
          lessonCatalog.has(id),
        );
        if (!activeLessonId || !revealedLessonIds.includes(activeLessonId)) {
          activeLessonId = revealedLessonIds[0] ?? null;
          activeSceneId = activeLessonId
            ? (revealedSceneIdsByLesson.get(activeLessonId)?.[0] ?? null)
            : null;
        }
        publish();
        return;
      case "scene-created":
      case "scene-updated": {
        if (!sceneCatalog.has(event.scene.id)) return;
        sceneTitleOverrides.set(event.scene.id, event.scene.title);
        const current = revealedSceneIdsByLesson.get(event.lessonId) ?? [];
        if (!current.includes(event.scene.id)) {
          revealedSceneIdsByLesson.set(event.lessonId, [
            ...current,
            event.scene.id,
          ]);
        }
        activeLessonId ??= event.lessonId;
        if (activeLessonId === event.lessonId) {
          activeSceneId ??= event.scene.id;
        }
        publish();
        return;
      }
      case "scene-deleted": {
        const current = revealedSceneIdsByLesson.get(event.lessonId) ?? [];
        revealedSceneIdsByLesson.set(
          event.lessonId,
          current.filter((id) => id !== event.sceneId),
        );
        if (activeSceneId === event.sceneId) {
          activeSceneId =
            revealedSceneIdsByLesson.get(event.lessonId)?.[0] ?? null;
        }
        publish();
        return;
      }
      case "scenes-reordered":
        revealedSceneIdsByLesson.set(
          event.lessonId,
          event.sceneIds.filter((id) => sceneCatalog.has(id)),
        );
        if (
          activeLessonId === event.lessonId &&
          (!activeSceneId || !event.sceneIds.includes(activeSceneId))
        ) {
          activeSceneId =
            revealedSceneIdsByLesson.get(event.lessonId)?.[0] ?? null;
        }
        publish();
        return;
      default:
        return;
    }
  }

  function updateNotebookTitle(nextTitle: string) {
    if (title === nextTitle) return;
    title = nextTitle;
    publish();
  }

  function updateSceneTitle(sceneId: string, nextTitle: string) {
    if (!sceneCatalog.has(sceneId)) return;
    sceneTitleOverrides.set(sceneId, nextTitle);
    publish();
  }

  function setActiveLesson(lessonId: string) {
    if (!revealedLessonIds.includes(lessonId)) return;
    activeLessonId = lessonId;
    activeSceneId = revealedSceneIdsByLesson.get(lessonId)?.[0] ?? null;
    publish();
  }

  function setActiveScene(sceneId: string) {
    const lessonId = sceneLessonIds.get(sceneId);
    if (
      !lessonId ||
      lessonId !== activeLessonId ||
      !revealedSceneIdsByLesson.get(lessonId)?.includes(sceneId)
    ) {
      return;
    }
    activeSceneId = sceneId;
    publish();
  }

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot: () => snapshot,
    reset,
    beginTimelineReplay,
    applyTimelineEvent,
    updateNotebookTitle,
    updateSceneTitle,
    setActiveLesson,
    setActiveScene,
  };
}
