import { expect, type Page, test } from "@playwright/test";
import { routes } from "@scibly/routes";

import {
  asksToDeleteScene,
  compaction,
  FINISH,
  says,
  scriptTurn,
  START,
  type TurnStep,
} from "./helpers/scripted-turn";
import { signIn } from "./helpers/sign-in";
import {
  clearWorkspace,
  E2E_ORG_SLUG,
  sceneExists,
  seedWorkspace,
  type Workspace,
} from "./helpers/workspace";

const ASK = "Fasse meine Quellen zusammen.";
const ANSWER = "Beginne mit einer Lektion über den Zellaufbau.";
const SUMMARIZING = "Fasse den bisherigen Verlauf zusammen…";
const CONFIRM_DELETE = "Löschen";
const CANCEL = "Abbrechen";
const CANCELLED = "Löschen abgebrochen.";

const ACKNOWLEDGED = "Verstanden.";

const FOLD_MS = 3_000;

let workspace: Workspace;

test.beforeAll(async () => {
  workspace = await seedWorkspace();
});

test.afterAll(async () => {
  await clearWorkspace();
});

async function ask(page: Page, ...turns: TurnStep[][]): Promise<void> {
  await signIn(page);
  await scriptTurn(page, ...turns);

  await page.goto(
    routes.app.profile.org(E2E_ORG_SLUG).notebook.detail(workspace.notebookId),
  );

  const composer = page.locator("textarea").first();
  await composer.waitFor({ state: "visible", timeout: 30_000 });
  await composer.click();
  await composer.pressSequentially(ASK, { delay: 10 });
  await composer.press("Enter");
}

test.describe("a notebook conversation in the browser", () => {
  test("E2: while the history is folded the author is told so, and then reads the answer", async ({
    page,
  }) => {
    await ask(page, [
      START,
      compaction("summarizing"),
      { pauseMs: FOLD_MS },
      compaction("done"),
      ...says(ANSWER),
      FINISH,
    ]);

    await expect(page.getByText(SUMMARIZING)).toBeVisible();
    await expect(page.getByText(ANSWER)).toBeVisible();
    await expect(page.getByText(SUMMARIZING)).toBeHidden();
  });

  test("E3: a proposed deletion waits for the author, and runs when they approve", async ({
    page,
  }) => {
    const scene = workspace.scenes[0];
    await ask(
      page,
      [START, ...asksToDeleteScene(scene), FINISH],
      [START, ...says(ACKNOWLEDGED), FINISH],
    );

    const confirm = page.getByRole("button", { name: CONFIRM_DELETE });
    await expect(confirm).toBeVisible();
    await expect(page.getByText(scene.title)).toBeVisible();

    expect(await sceneExists(scene.id)).toBe(true);

    await confirm.click();

    await expect
      .poll(() => sceneExists(scene.id), { timeout: 15_000 })
      .toBe(false);
  });

  test("E4: a proposed deletion the author cancels deletes nothing", async ({
    page,
  }) => {
    const scene = workspace.scenes[1];
    await ask(
      page,
      [START, ...asksToDeleteScene(scene), FINISH],
      [START, ...says(ACKNOWLEDGED), FINISH],
    );

    await page.getByRole("button", { name: CANCEL }).click();

    await expect(page.getByText(CANCELLED)).toBeVisible();
    expect(await sceneExists(scene.id)).toBe(true);
  });
});
