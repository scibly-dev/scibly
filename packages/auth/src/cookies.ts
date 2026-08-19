// Exposed on its own so `@scibly/next-proxy` can check for a session without depending on better-auth or the server-only auth config.
export { getSessionCookie } from "better-auth/cookies";
