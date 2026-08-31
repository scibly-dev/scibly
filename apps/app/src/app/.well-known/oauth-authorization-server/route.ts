import { auth } from "@scibly/auth/config";
import { oAuthDiscoveryMetadata } from "better-auth/plugins";
import { connection } from "next/server";

const metadata = oAuthDiscoveryMetadata(auth);

// MCP clients look for this at the site root, but better-auth serves it under
// its own base path; this re-publishes it where the spec says to look.
export async function GET(request: Request) {
  // Serve per request, never prerender: better-auth refuses to run in a build
  // that has no BETTER_AUTH_SECRET, and the metadata names the live origin.
  await connection();
  return metadata(request);
}
