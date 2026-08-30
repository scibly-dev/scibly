import { auth } from "@scibly/auth/config";
import { oAuthProtectedResourceMetadata } from "better-auth/plugins";

export const GET = oAuthProtectedResourceMetadata(auth);
