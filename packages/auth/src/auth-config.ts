import { prismaAdapter } from "@better-auth/prisma-adapter";
import { db } from "@scibly/db";
import { provisionOrganizationPlan } from "@scibly/db/provision-organization";
import { stripePlugin } from "@scibly/ee-billing/stripe-plugin";
import {
  getConfirmMailMessages,
  getInvitationMailMessages,
  getResetPasswordMailMessages,
} from "@scibly/email/i18n";
import sendEmail from "@scibly/email/resend";
import ConfirmMail from "@scibly/email/templates/confirm-mail";
import InvitationMail from "@scibly/email/templates/invitation-mail";
import ResetPasswordMail from "@scibly/email/templates/reset-password-mail";
import { resolveLocaleFromHeaders } from "@scibly/i18n/resolve-locale-from-headers";
import { loadPackageEnv } from "@scibly/lib/internal";
import { routes } from "@scibly/routes";
import { updateUserSchema } from "@scibly/schemas/user";
import { betterAuth } from "better-auth";
import { APIError } from "better-auth";
import { createAuthMiddleware } from "better-auth/api";
import { jwt, mcp, organization } from "better-auth/plugins";
import { headers } from "next/headers.js";

const env = loadPackageEnv("@scibly/auth", {
  NEXT_PUBLIC_ENV: process.env.NEXT_PUBLIC_ENV,
  NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
  NEXT_PUBLIC_WEB_URL: process.env.NEXT_PUBLIC_WEB_URL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
});

type UserWithOptionalUsername = {
  name: string;
  username?: string | null;
};

const getMailDisplayName = (user: UserWithOptionalUsername) =>
  user.username ?? user.name;

export const auth = betterAuth({
  baseURL: env.NEXT_PUBLIC_BASE_URL,
  advanced: {
    crossSubDomainCookies: {
      enabled: env.NEXT_PUBLIC_ENV === "production",
      domain: "scibly.com",
    },
  },
  trustedOrigins: [
    env.NEXT_PUBLIC_BASE_URL,
    env.NEXT_PUBLIC_WEB_URL,
    env.NEXT_PUBLIC_APP_URL,
  ],
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/update-user") return;

      const result = updateUserSchema.safeParse(ctx.body);
      if (!result.success) {
        throw new APIError("BAD_REQUEST", {
          code: "INVALID_USER_UPDATE",
          message:
            result.error.issues[0]?.message ?? "Invalid user update payload",
        });
      }

      ctx.body = result.data;
    }),
  },
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      const locale = resolveLocaleFromHeaders(await headers());
      const copy = getConfirmMailMessages(locale);
      await sendEmail({
        from: "noReply",
        to: user.email,
        subject: copy.subject,
        react: ConfirmMail({
          url,
          name: getMailDisplayName(user),
          locale,
        }),
      });
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    async sendResetPassword({ user, url }) {
      const locale = resolveLocaleFromHeaders(await headers());
      const copy = getResetPasswordMailMessages(locale);
      await sendEmail({
        from: "noReply",
        to: user.email,
        subject: copy.subject,
        react: ResetPasswordMail({
          url,
          name: getMailDisplayName(user),
          locale,
        }),
      });
    },
  },
  user: {
    deleteUser: {
      enabled: true,
      // TODO: maybe send a verification email to the user before deleting the account
    },
    additionalFields: {
      username: {
        type: "string",
        required: false,
      },
      marketingNotifications: {
        type: "boolean",
        required: false,
      },
      emailNotifications: {
        type: "boolean",
        required: false,
      },
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 30 * 60,
    },
    additionalFields: {
      activeOrganizationId: {
        type: "string",
        required: false,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          return {
            data: {
              ...user,
              email: user.email.trim().toLowerCase(),
            },
          };
        },
      },
    },
  },
  socialProviders: {
    google: {
      enabled: true,
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },
  plugins: [
    jwt({ jwt: { issuer: env.NEXT_PUBLIC_APP_URL } }),
    // An external agent gets an access token as the author who consented, over
    // the app's own login (ADR 0004).
    mcp({
      loginPage: routes.app.auth.signIn,
      oidcConfig: {
        // Overwritten by the outer `loginPage`, but `OIDCOptions` requires it.
        loginPage: routes.app.auth.signIn,
        consentPage: routes.app.auth.mcpConsent,
        // The plugin leaves PKCE optional, so a code could be redeemed with any
        // verifier at all.
        requirePKCE: true,
      },
    }),
    organization({
      organizationLimit: 1,
      organizationHooks: {
        afterCreateOrganization: async ({ organization: created }) => {
          await provisionOrganizationPlan(db, created.id, "TRIAL");
        },
      },
      sendInvitationEmail: async (data) => {
        const locale = resolveLocaleFromHeaders(await headers());
        const copy = getInvitationMailMessages(locale);
        await sendEmail({
          from: "noReply",
          to: data.email,
          subject: copy.subject,
          react: InvitationMail({
            url: routes.app.profile.invitations(
              data.organization.slug || data.organization.id,
            ),
            inviterName: data.inviter.user.name,
            organizationName: data.organization.name,
            locale,
          }),
        });
      },
    }),
    stripePlugin,
  ],
});
export type Auth = typeof auth;
