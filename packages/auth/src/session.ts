import { cookies } from "next/headers";
import { headers as nextHeaders } from "next/headers.js";
import { cache } from "react";

import "server-only";

import { auth } from "./auth-config";

export type Session = typeof auth.$Infer.Session;

export const getSession = cache(
  async (
    headers?: Headers,
    options: { disableCookies: boolean } = { disableCookies: false },
  ): Promise<Session | null> => {
    const { disableCookies } = options;
    return await auth.api.getSession({
      query: {
        disableCookieCache: disableCookies,
      },
      headers: headers ?? (await nextHeaders()),
    });
  },
);

const SESSION_COOKIE_NAMES = [
  "better-auth.session_token",
  "__Secure-better-auth.session_token",
] as const;

export async function clearSessionCookies() {
  const cookieStore = await cookies();
  for (const name of SESSION_COOKIE_NAMES) {
    cookieStore.delete(name);
  }
}
