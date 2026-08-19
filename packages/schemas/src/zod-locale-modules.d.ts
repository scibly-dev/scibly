declare module "zod/v4/locales/de" {
  import type { ZodIssue } from "zod";

  const de: () => { localeError: (issue: ZodIssue) => string };
  export default de;
}

declare module "zod/v4/locales/en" {
  import type { ZodIssue } from "zod";

  const en: () => { localeError: (issue: ZodIssue) => string };
  export default en;
}
