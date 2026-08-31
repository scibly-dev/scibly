import { auth } from "@scibly/auth/config";
import { oAuthProtectedResourceMetadata } from "better-auth/plugins";
import { connection } from "next/server";

const metadata = oAuthProtectedResourceMetadata(auth);

export async function GET(request: Request) {
  await connection();
  return metadata(request);
}
