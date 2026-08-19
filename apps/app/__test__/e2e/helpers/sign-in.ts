import { expect, type Page } from "@playwright/test";
import { routes } from "@scibly/routes";

import { E2E_EMAIL, E2E_PASSWORD } from "./workspace";

/**
 * Waits for React's internal `__reactFiber$…` key to appear on `#email` — the
 * earliest observable proxy for hydration, since input typed before it lands
 * is silently discarded by the post-hydration rerender and there is no public
 * hydration-complete event to wait on instead.
 */
async function waitForHydration(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    const field = document.getElementById("email");
    return (
      field !== null &&
      Object.keys(field).some((key) => key.startsWith("__reactFiber$"))
    );
  });
}

export async function signIn(page: Page): Promise<void> {
  await page.goto(routes.app.auth.signIn);
  await waitForHydration(page);

  const email = page.locator("#email");
  const password = page.locator("#password");

  await email.fill(E2E_EMAIL);
  await password.fill(E2E_PASSWORD);
  await expect(email).toHaveValue(E2E_EMAIL);
  await expect(password).toHaveValue(E2E_PASSWORD);

  await page.click('button[type="submit"]');
  await page.waitForURL(/profile/, { timeout: 60_000, waitUntil: "commit" });
}
