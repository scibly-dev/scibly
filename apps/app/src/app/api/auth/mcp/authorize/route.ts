import { auth } from "@scibly/auth/config";
import { REDIRECT_URL_PARAM, routes } from "@scibly/routes";

/**
 * Shadows better-auth's own `/api/auth/mcp/authorize`: the plugin prompts for
 * consent only when the client asks, and its own login redirect drops the
 * authorization request.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);

  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    const resume = encodeURIComponent(`${url.pathname}${url.search}`);
    return Response.redirect(
      `${routes.app.auth.signIn}?${REDIRECT_URL_PARAM}=${resume}`,
    );
  }

  url.searchParams.set("prompt", "consent");
  return auth.handler(new Request(url, request));
}
