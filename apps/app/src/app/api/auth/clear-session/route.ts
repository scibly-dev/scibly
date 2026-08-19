import { clearSessionCookies } from "@scibly/auth/session";
import { routes } from "@scibly/routes";
import { redirect } from "next/navigation";

export async function GET() {
  await clearSessionCookies();
  redirect(routes.app.auth.default);
}
