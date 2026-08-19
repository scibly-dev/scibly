import { stripeClient } from "@better-auth/stripe/client";
import { loadPackageEnv } from "@scibly/lib/internal";
import {
  inferAdditionalFields,
  organizationClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import { type auth } from "./auth-config";

const env = loadPackageEnv("@scibly/auth", {
  NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
});

export const authClient = createAuthClient({
  baseURL: env.NEXT_PUBLIC_BASE_URL,
  plugins: [
    inferAdditionalFields<typeof auth>(),
    organizationClient(),
    stripeClient({ subscription: true }),
  ],
});

export const {
  signIn,
  signOut,
  signUp,
  useSession,
  sendVerificationEmail,
  resetPassword,
  requestPasswordReset,
  getSession,
  updateUser,
  deleteUser,
} = authClient;
