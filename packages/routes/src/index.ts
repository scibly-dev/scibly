import { appendLocalePrefix } from "@scibly/i18n";
import { type Locale } from "@scibly/i18n/constants";

import { env } from "./env";

// Query params the product itself names; ones from somebody else's spec (OAuth, oEmbed, Stripe) are not ours.
export const INVITATION_ORG_QUERY_PARAM = "org";
export const REDIRECT_URL_PARAM = "redirect";
export const INITIAL_MESSAGE_QUERY_PARAM = "initialMessage";
export const ONBOARDING_INTENT_QUERY_PARAM = "intent";
export const SEAT_SHORTFALL_QUERY_PARAM = "seats";
export const SCENE_ID_QUERY_PARAM = "sceneId";
export const TOPUP_SESSION_QUERY_PARAM = "topup";
/** Stripe gets the same URL for success and cancel, so this means "reached the success page", not money in the bank — `onStripeEvent` is authoritative. */
export const PLAN_CHECKOUT_QUERY_PARAM = "plan";
export const INTEGRATION_CONNECTED_QUERY_PARAM = "integration_connected";
export const INTEGRATION_ERROR_QUERY_PARAM = "integration_error";
export const DICTIONARY_LOCALE_QUERY_PARAM = "locale";

/** Anchors deep links jump to, paired with the `id` on the section itself. */
export const BILLING_SEATS_ANCHOR = "seats";

export const ONBOARDING_CREATE_ORG_INTENT = "create-org";

const toHomeUrl = (path: string) =>
  env.NEXT_PUBLIC_WEB_URL.concat(path.startsWith("/") ? path : `/${path}`);

const toAppUrl = (path: string) =>
  env.NEXT_PUBLIC_APP_URL.concat(path.startsWith("/") ? path : `/${path}`);

const GITHUB_REPO_URL = "https://github.com/scibly-dev/scibly" as const;

const BASE_AUTH_PATH = "/auth" as const;
const BASE_PROFILE_PATH = "/profile" as const;
const BASE_API_PATH = "/api" as const;
const BASE_PYTHON_BACKEND_PATH = env.NEXT_PUBLIC_PYTHON_BACKEND_BASE_URL;

export const DEMO_INITIAL_MESSAGE_MAX_LENGTH = 1_000;

type DemoInitialMessageQueryValue = string | readonly string[] | undefined;

export function parseDemoInitialMessage(
  value: DemoInitialMessageQueryValue,
): string | undefined {
  if (typeof value !== "string") return undefined;

  const message = value.trim();
  if (
    message.length === 0 ||
    message.length > DEMO_INITIAL_MESSAGE_MAX_LENGTH
  ) {
    return undefined;
  }

  return message;
}

export function demoHrefWithInitialMessage(
  href: string,
  value: DemoInitialMessageQueryValue,
): string {
  const url = new URL(href);
  const message = parseDemoInitialMessage(value);
  url.searchParams.delete(INITIAL_MESSAGE_QUERY_PARAM);
  if (message) {
    url.searchParams.set(INITIAL_MESSAGE_QUERY_PARAM, message);
  }
  return url.toString();
}

export const routes = {
  web: {
    base: {
      home: toHomeUrl("/"),
    },

    blog: {
      root: toHomeUrl("/blog"),
      detail: (slug: string) => toHomeUrl(`/blog/${slug}`),
    },

    glossary: {
      root: toHomeUrl("/glossary"),
      detail: (slug: string) => toHomeUrl(`/glossary/${slug}`),
    },

    legal: {
      impressum: toHomeUrl("/impressum"),
      datenschutz: toHomeUrl("/datenschutz"),
    },
  },

  app: {
    public: {
      course: (courseId: string) => toAppUrl(`/public/courses/${courseId}`),
      embedCourse: (courseId: string) => toAppUrl(`/embed/courses/${courseId}`),
      demo: toAppUrl("/demo"),
    },

    auth: {
      root: toAppUrl(BASE_AUTH_PATH),
      default: toAppUrl(`${BASE_AUTH_PATH}/login`),
      signIn: toAppUrl(`${BASE_AUTH_PATH}/login`),
      signUp: toAppUrl(`${BASE_AUTH_PATH}/register`),
      resetPassword: toAppUrl(`${BASE_AUTH_PATH}/reset-password`),
      clearSession: toAppUrl(
        `${BASE_API_PATH}/${BASE_AUTH_PATH}/clear-session`,
      ),
      jwks: toAppUrl(`${BASE_API_PATH}/${BASE_AUTH_PATH}/jwks`),
      callback: {
        login: {
          // Every authenticated arrival lands on onboarding, which sends
          // anyone already past it straight onward.
          success: toAppUrl(`${BASE_PROFILE_PATH}/onboarding`),
        },
      },
    },

    profile: {
      root: toAppUrl(BASE_PROFILE_PATH),
      default: toAppUrl(`${BASE_PROFILE_PATH}/user-settings`),
      userSettings: toAppUrl(`${BASE_PROFILE_PATH}/user-settings`),
      onboarding: (intent?: typeof ONBOARDING_CREATE_ORG_INTENT) =>
        intent
          ? toAppUrl(
              `${BASE_PROFILE_PATH}/onboarding?${ONBOARDING_INTENT_QUERY_PARAM}=${intent}`,
            )
          : toAppUrl(`${BASE_PROFILE_PATH}/onboarding`),
      invitations: (org?: string) =>
        org
          ? toAppUrl(
              `${BASE_PROFILE_PATH}/invitations?${INVITATION_ORG_QUERY_PARAM}=${org}`,
            )
          : toAppUrl(`${BASE_PROFILE_PATH}/invitations`),
      org: (slug: string) => {
        const baseOrgRoute = `${BASE_PROFILE_PATH}/org/${slug}`;
        return {
          root: toAppUrl(baseOrgRoute),
          default: (role?: string) =>
            role === "owner" || role === "admin"
              ? toAppUrl(`${baseOrgRoute}/settings`)
              : toAppUrl(`${baseOrgRoute}/learn`),
          dashboard: toAppUrl(`${baseOrgRoute}/learn`),
          learn: {
            root: toAppUrl(`${baseOrgRoute}/learn`),
            courses: toAppUrl(`${baseOrgRoute}/learn/courses`),
            certificates: toAppUrl(`${baseOrgRoute}/learn/certificates`),
            course: (courseId: string) =>
              toAppUrl(`${baseOrgRoute}/learn/${courseId}`),
          },
          worksheets: {
            root: toAppUrl(`${baseOrgRoute}/worksheets`),
          },
          courses: {
            root: toAppUrl(`${baseOrgRoute}/courses`),
            detail: (courseId: string) =>
              toAppUrl(`${baseOrgRoute}/courses/${courseId}`),
            lesson: (courseId: string, lessonId: string, sceneId?: string) =>
              toAppUrl(
                sceneId
                  ? `${baseOrgRoute}/courses/${courseId}/lessons/${lessonId}?${SCENE_ID_QUERY_PARAM}=${sceneId}`
                  : `${baseOrgRoute}/courses/${courseId}/lessons/${lessonId}`,
              ),
            preview: (courseId: string) =>
              toAppUrl(`${baseOrgRoute}/courses/${courseId}/preview`),
          },
          notebook: {
            root: toAppUrl(`${baseOrgRoute}/notebooks`),
            history: toAppUrl(`${baseOrgRoute}/notebooks/history`),
            detail: (notebookId: string, initialMessage?: string) =>
              initialMessage
                ? toAppUrl(
                    `${baseOrgRoute}/notebooks/${notebookId}?${INITIAL_MESSAGE_QUERY_PARAM}=${encodeURIComponent(initialMessage)}`,
                  )
                : toAppUrl(`${baseOrgRoute}/notebooks/${notebookId}`),
          },
          templates: {
            root: toAppUrl(`${baseOrgRoute}/templates`),
          },
          members: {
            root: toAppUrl(`${baseOrgRoute}/members`),
          },
          settings: toAppUrl(`${baseOrgRoute}/settings`),
          billing: toAppUrl(`${baseOrgRoute}/billing`),
          buySeats: (quantity: number) =>
            toAppUrl(
              `${baseOrgRoute}/billing?${SEAT_SHORTFALL_QUERY_PARAM}=${quantity}#${BILLING_SEATS_ANCHOR}`,
            ),
        };
      },
    },

    api: {
      oembed: toAppUrl(`${BASE_API_PATH}/oembed`),
    },
  },

  api: {
    root: BASE_API_PATH,
    dictionaries: {
      getTranslations: (locale: Locale) =>
        `${BASE_API_PATH}/dictionaries?${DICTIONARY_LOCALE_QUERY_PARAM}=${locale}` as const,
    },
  },

  external: {
    docs: env.NEXT_PUBLIC_DOCS_URL,

    github: {
      repo: GITHUB_REPO_URL,
      issues: `${GITHUB_REPO_URL}/issues` as const,
      file: (path: string) => `${GITHUB_REPO_URL}/blob/main/${path}` as const,
    },
  },

  pythonBackend: {
    root: BASE_PYTHON_BACKEND_PATH,
    pdfToMarkdown: `${BASE_PYTHON_BACKEND_PATH}/pdf-to-md` as const,
  },
} as const;

/** For links that cross apps and so cannot leave the locale prefix to middleware. */
export function localizedUrl(locale: Locale, route: string): string {
  const url = new URL(route);
  url.pathname = appendLocalePrefix(locale, url.pathname);
  return url.toString();
}

function withCampaign(url: URL, campaign: string): string {
  url.searchParams.set("utm_source", "website");
  url.searchParams.set("utm_medium", "homepage");
  url.searchParams.set("utm_campaign", campaign);
  return url.toString();
}

export function marketingDemoHref(locale: Locale, campaign: string): string {
  return withCampaign(
    new URL(localizedUrl(locale, routes.app.public.demo)),
    campaign,
  );
}

export function marketingCourseHref(
  locale: Locale,
  courseId: string,
  campaign: string,
): string {
  return withCampaign(
    new URL(localizedUrl(locale, routes.app.public.course(courseId))),
    campaign,
  );
}

export function marketingCtaHref(locale: Locale): string {
  const url = new URL(localizedUrl(locale, routes.web.base.home));
  url.hash = "cta-section";
  return url.toString();
}

export const webRoutesPathnames = [routes.web.base.home].map(
  (url) => new URL(url).pathname,
);

export const APP_ORIGIN = new URL(env.NEXT_PUBLIC_APP_URL).origin;

const coursePrefix = (url: string) => new URL(url).pathname.replace(/\/+$/, "");

export const EMBED_ROUTE_PATHNAME = coursePrefix(
  routes.app.public.embedCourse(""),
);

export const PUBLIC_COURSE_ROUTE_PATHNAME = coursePrefix(
  routes.app.public.course(""),
);

export const appRoutesPathnames = [
  routes.app.auth.root,
  routes.app.profile.root,
  routes.app.public.course(""),
  routes.app.public.embedCourse(""),
  routes.app.public.demo,
].map((url) => new URL(url).pathname);

export const protectedRoutePathnames = [routes.app.profile.root].map(
  (protectedPath) => new URL(protectedPath).pathname,
);
