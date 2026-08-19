import {
  SHOWCASE_NOTEBOOK_ID,
  SHOWCASE_ORG_SLUG,
  showcaseFixture,
} from "@scibly/showcase";

export const DEMO_NOTEBOOK_ID = SHOWCASE_NOTEBOOK_ID;
export const DEMO_ORG_SLUG = SHOWCASE_ORG_SLUG;
export const demoNotebookFixture = showcaseFixture;
export const DEMO_INITIAL_MESSAGE =
  demoNotebookFixture.promptOptions[0]!.prompt;
