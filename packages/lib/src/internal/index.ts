// CI's `pnpm build` runs with no real secrets (SKIP_ENV_VALIDATION=true) just to
// verify the app compiles — a URL-shaped placeholder keeps `new URL(...)` and
// `.concat(...)` call sites (routes, metadata) from crashing on `undefined`.
const SKIP_ENV_VALIDATION_PLACEHOLDER = "https://skip-env-validation.invalid";

export const loadPackageEnv = <
  const T extends Record<string, string | undefined>,
>(
  packageName: string,
  source: T,
): { [K in keyof T]: string } => {
  if (process.env.SKIP_ENV_VALIDATION) {
    // SAFETY: we set a placeholder for each missing env.
    return Object.fromEntries(
      Object.entries(source).map(([k, v]) => [
        k,
        v ?? SKIP_ENV_VALIDATION_PLACEHOLDER,
      ]),
    ) as { [K in keyof T]: string };
  }

  const missing = Object.entries(source)
    .filter(([, v]) => !v)
    .map(([k]) => k);
  if (missing.length > 0) {
    throw new Error(`${packageName} missing envs: ${missing.join(", ")}`);
  }
  // SAFETY: the throw above leaves no falsy value behind.
  return source as { [K in keyof T]: string };
};
