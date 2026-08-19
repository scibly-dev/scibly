export const getRedirectUrl = (
  redirectUrl?: string | null,
  fallback: string = "/",
) => {
  return redirectUrl && redirectUrl.startsWith("/") ? redirectUrl : fallback;
};
