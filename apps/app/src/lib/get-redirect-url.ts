/** Tabs and newlines come out first because the URL parser would strip them after any check of ours. */
export const getRedirectUrl = (
  redirectUrl?: string | null,
  fallback: string = "/",
) => {
  const path = redirectUrl?.replace(/[\t\n\r]/g, "");
  return path && /^\/(?![/\\])/.test(path) ? path : fallback;
};
