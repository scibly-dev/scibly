import { db } from "@scibly/db";
import { generateOrgData } from "@scibly/db/seed/factory";
import { hashCredentialPassword } from "@scibly/db/seed/hash";

export const E2E_ORG_SLUG = "scibly-e2e";
export const E2E_ORG_ID = "org_e2e_id";
export const E2E_OWNER_ID = "e2e_user_1";
export const E2E_USER_PREFIX = "e2e_user";
export const E2E_EMAIL = `${E2E_USER_PREFIX}1@scibly.com`;
export const E2E_PASSWORD = "#Member#1234";

/**
 * The only database these tests may touch is one you can drop — `apps/app/.env`
 * toggles between a local URL and a commented-out PlanetScale one with a single
 * `#`, and getting that wrong seeds `org_e2e_id` and a pile of `e2e_user_*` rows
 * into whatever database is live.
 */
function assertDisposableDatabase(): void {
  const url = process.env.DATABASE_URL ?? "";
  const host = URL.parse(url.replace(/^postgres(ql)?:/, "http:"))?.hostname;

  if (
    host &&
    ["localhost", "127.0.0.1", "::1", "host.docker.internal"].includes(host)
  ) {
    return;
  }
  throw new Error(
    `e2e refuses to seed ${host ?? "an unreadable DATABASE_URL"}: point DATABASE_URL at a local database you can drop.`,
  );
}

interface SeededScene {
  id: string;
  title: string;
  lessonId: string;
  courseId: string;
}

export interface Workspace {
  notebookId: string;
  /** Two scenes, so the test that approves a deletion and the test that
   *  cancels one are not arguing over the same row. */
  scenes: [SeededScene, SeededScene];
}

/**
 * One org on the INTERNAL plan, its owner, a course, and an empty notebook;
 * `generateOrgData` drops the org first, so a suite that died mid-run doesn't
 * leave stale rows for the next one to reason about.
 */
export async function seedWorkspace(): Promise<Workspace> {
  assertDisposableDatabase();

  await generateOrgData(db, {
    orgSlug: E2E_ORG_SLUG,
    orgName: "Scibly E2E",
    orgId: E2E_ORG_ID,
    ownerId: E2E_OWNER_ID,
    userPrefix: E2E_USER_PREFIX,
    numUsers: 1,
    numCourses: 1,
    hashedPassword: await hashCredentialPassword(E2E_PASSWORD),
    createOwnerUser: true,
    isE2E: true,
  });

  const notebook = await db.notebook.create({
    data: {
      title: "Zellbiologie",
      organizationId: E2E_ORG_ID,
      userId: E2E_OWNER_ID,
    },
    select: { id: true },
  });

  const drafts = await db.scene.findMany({
    where: {
      courseVersionId: null,
      lesson: {
        courseVersionId: null,
        course: { organizationId: E2E_ORG_ID },
      },
    },
    orderBy: { id: "asc" },
    select: {
      id: true,
      lessonId: true,
      lesson: { select: { courseId: true } },
    },
  });

  const lessons = [...new Set(drafts.map((scene) => scene.lessonId))];
  const [approved, cancelled] = lessons.map((lessonId) =>
    drafts.find((scene) => scene.lessonId === lessonId),
  );
  if (!approved || !cancelled) {
    throw new Error("the seeded course produced fewer than two draft lessons");
  }

  const name = async (
    scene: (typeof drafts)[number],
    title: string,
  ): Promise<SeededScene> => {
    await db.scene.update({ where: { id: scene.id }, data: { title } });
    return {
      id: scene.id,
      title,
      lessonId: scene.lessonId,
      courseId: scene.lesson.courseId,
    };
  };

  return {
    notebookId: notebook.id,
    scenes: [
      await name(approved, "Aufbau der Zelle"),
      await name(cancelled, "Die Zellmembran"),
    ],
  };
}

export async function sceneExists(sceneId: string): Promise<boolean> {
  return (await db.scene.count({ where: { id: sceneId } })) > 0;
}

export async function clearWorkspace(): Promise<void> {
  assertDisposableDatabase();

  await db.organization
    .delete({ where: { slug: E2E_ORG_SLUG } })
    .catch(() => {});
  await db.user.deleteMany({
    where: { id: { startsWith: `${E2E_USER_PREFIX}` } },
  });
}
