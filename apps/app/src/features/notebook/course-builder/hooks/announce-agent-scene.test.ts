import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  INITIAL_STATE,
  useCourseBuilderStore,
} from "@/features/notebook/course-builder/course-builder-store";
import { announceAgentScene } from "@/features/notebook/course-builder/hooks/announce-agent-scene";

const COURSE_A = { id: "course-a", title: "Cyber Safety" };
const COURSE_B = { id: "course-b", title: "Onboarding" };
const LESSON_A1 = { id: "lesson-a1", title: "Spotting phishing" };
const LESSON_B1 = { id: "lesson-b1", title: "Your first week" };
const SCENE_A1 = { id: "scene-a1", title: "Introduction" };
const SCENE_B1 = { id: "scene-b1", title: "Where to ask" };

const LOCATION_B1 = { scene: SCENE_B1, lesson: LESSON_B1, course: COURSE_B };

const store = () => useCourseBuilderStore.getState();

function createClient(
  locations: Record<string, typeof LOCATION_B1 | null> = {
    [SCENE_B1.id]: LOCATION_B1,
  },
) {
  return {
    scene: {
      getSceneLocation: {
        fetch: vi.fn(
          async ({ sceneId }: { sceneId: string }) =>
            locations[sceneId] ?? null,
        ),
      },
    },
  };
}

beforeEach(() => {
  useCourseBuilderStore.setState(INITIAL_STATE);
});

describe("announcing the scene a content write is about to land in", () => {
  it("JF5: the panel moves onto the scene, and onto the lesson and course holding it", async () => {
    const client = createClient();

    await announceAgentScene(SCENE_B1.id, client);

    expect(store().course).toEqual(COURSE_B);
    expect(store().activeLesson).toEqual(LESSON_B1);
    expect(store().activeScene).toEqual(SCENE_B1);
  });

  it("JF7: the panel is on the scene by the time the announcement resolves", async () => {
    const client = createClient();

    const announced = announceAgentScene(SCENE_B1.id, client);
    expect(store().activeScene).toBeUndefined();
    await announced;

    expect(store().activeScene).toEqual(SCENE_B1);
  });

  it("JF5: a write into the scene already on screen costs no round trip", async () => {
    const client = createClient();
    store().agentTouched({
      course: COURSE_B,
      lesson: LESSON_B1,
      scene: SCENE_B1,
    });

    await announceAgentScene(SCENE_B1.id, client);

    expect(client.scene.getSceneLocation.fetch).not.toHaveBeenCalled();
    expect(store().activeScene).toEqual(SCENE_B1);
  });

  it("JD1: an author driving keeps their scene", async () => {
    const client = createClient();
    store().openCourse({ course: COURSE_A });
    store().setActiveLesson(LESSON_A1);
    store().setActiveScene(SCENE_A1);

    await announceAgentScene(SCENE_B1.id, client);

    expect(store().course).toEqual(COURSE_A);
    expect(store().activeLesson).toEqual(LESSON_A1);
    expect(store().activeScene).toEqual(SCENE_A1);
  });

  it("JD4: and is still told where the agent is writing", async () => {
    const client = createClient();
    store().openCourse({ course: COURSE_A });

    await announceAgentScene(SCENE_B1.id, client);

    expect(store().agentTarget).toEqual({
      course: COURSE_B,
      lesson: LESSON_B1,
      scene: SCENE_B1,
    });
  });

  it("JF5: a scene nobody can place moves nothing", async () => {
    const client = createClient({ [SCENE_B1.id]: null });

    await announceAgentScene(SCENE_B1.id, client);

    expect(store().activeScene).toBeUndefined();
    expect(store().agentTarget).toBeUndefined();
  });

  it("JF5: a lookup that fails does not take the write down with it", async () => {
    const client = {
      scene: {
        getSceneLocation: {
          fetch: vi.fn(async (_input: { sceneId: string }) => {
            throw new Error("offline");
          }),
        },
      },
    };

    await expect(
      announceAgentScene(SCENE_B1.id, client),
    ).resolves.toBeUndefined();
  });
});
