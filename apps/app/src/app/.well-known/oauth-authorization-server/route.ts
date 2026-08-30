import { auth } from "@scibly/auth/config";
import { oAuthDiscoveryMetadata } from "better-auth/plugins";

// MCP clients look for this at the site root, but better-auth serves it under
// its own base path; this re-publishes it where the spec says to look.
export const GET = oAuthDiscoveryMetadata(auth);
