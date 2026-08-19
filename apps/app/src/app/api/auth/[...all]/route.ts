import { auth } from "@scibly/auth/config";
import { toNextJsHandler } from "better-auth/next-js";

import { corsPreflightResponse, withCorsHeaders } from "@/features/auth/server";

const betterAuthHandler = toNextJsHandler(auth);

async function wrappedHandler(req: Request) {
  const response = await (req.method === "GET"
    ? betterAuthHandler.GET(req)
    : betterAuthHandler.POST(req));
  return withCorsHeaders(response, req);
}

export const OPTIONS = corsPreflightResponse;

export { wrappedHandler as GET, wrappedHandler as POST };
