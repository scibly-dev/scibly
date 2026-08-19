export type CourseEntity = {
  id: string;
  title: string;
};

export type CourseMutationEvent =
  | { type: "course-created"; course: CourseEntity }
  | {
      type: "lesson-created";
      lesson: CourseEntity;
      courseId: string;
      scene?: CourseEntity;
    }
  | { type: "lesson-updated"; lesson: CourseEntity; courseId: string }
  | { type: "lesson-deleted"; lessonId: string; courseId: string }
  | { type: "lessons-reordered"; lessonIds: string[]; courseId: string }
  | {
      type: "scene-created";
      scene: CourseEntity;
      lessonId: string;
      courseId: string;
    }
  | {
      type: "scene-updated";
      scene: CourseEntity;
      lessonId: string;
      courseId: string;
    }
  | {
      type: "scene-deleted";
      sceneId: string;
      lessonId: string;
      courseId: string;
    }
  | {
      type: "scenes-reordered";
      sceneIds: string[];
      lessonId: string;
      courseId: string;
    };

const COURSE_MUTATION_EVENT_TYPES = new Set<string>([
  "course-created",
  "lesson-created",
  "lesson-updated",
  "lesson-deleted",
  "lessons-reordered",
  "scene-created",
  "scene-updated",
  "scene-deleted",
  "scenes-reordered",
]);

export function isCourseMutationEvent(event: {
  type: string;
}): event is CourseMutationEvent {
  return COURSE_MUTATION_EVENT_TYPES.has(event.type);
}
