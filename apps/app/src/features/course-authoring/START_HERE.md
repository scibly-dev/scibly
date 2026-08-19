# Course Authoring: Start Here

Course Authoring owns draft courses, lessons and scenes, collaboration, previews,
publishing, enrollment administration, and analytics. Read:

1. `courses/admin/course-admin-screen.tsx` — course administration entry.
2. `lessons/builder/lesson-builder-screen.tsx` — loads lesson and scene data.
3. `lessons/builder/components/lesson-builder/index.tsx` — composes scene flow,
   collaborative editor, and settings.
4. `scenes/server/scene-mutations.ts` and `scenes/server/scene-content.ts` —
   authorized draft mutations and document persistence.
5. `publishing/server/publish-course.ts` and
   `publishing/server/publish-course-snapshot.ts` — immutable publication.

## Happy path: edit and publish a lesson

1. `[lang]/profile/org/[orgSlug]/courses/[courseId]/lessons/[lessonId]/page.tsx`
   delegates to `LessonBuilderScreen`.
2. The screen loads `scene.getLessonScenes` and `course.getLesson` in parallel,
   then renders `LessonBuilder`.
3. `LessonBuilder` starts `useCourseSync`, selects the URL-requested scene, and
   mounts `SceneEditorCanvas`, `SceneFlowSidebar`, and `RightSidebar`.
4. Scene structure actions call the feature-owned `scenes/api/scene.router.ts`;
   it delegates authorization and writes to the scene server modules.
5. Editor document changes synchronize through the collaboration document;
   metadata changes use `scene.updateScene`, while source attribution uses
   `scene.setSceneLineage`.
6. From the course admin screen, publish calls the course publishing procedure,
   which reaches `publish-course.ts`.
7. `publish-course-snapshot.ts` validates the draft, creates a versioned course,
   lesson, and scene snapshot in one transaction. Each authoring Yjs document is
   transformed once into solution-sanitized `studentContent` TipTap JSON plus a
   server-only `gradingManifest`; Learning receives the immutable JSON snapshot
   and never joins the authoring collaboration room.

Tests closest to this path: `scenes/server/scene-lineage.test.ts`,
`__test__/e2e/lesson-flow.spec.ts`, and
`__test__/e2e/course-lifecycle.spec.ts`.
