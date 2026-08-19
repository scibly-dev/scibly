export type Locale = "en" | "de";
export const locales: Locale[] = ["en", "de"];
export const defaultLocale: Locale = "de";
export const localeCookieName = "i18nlang";
const isProduction = process.env.NODE_ENV === "production";
export const localeCookieOptions = {
  path: "/",
  sameSite: "lax" as const,
  secure: isProduction,

  domain: isProduction ? "scibly.com" : undefined,
};

type LanguageItem = {
  code: Locale;
  name: string;
};
export const LanguageOptions = {
  de: [
    { code: "de", name: "Deutsch" },
    { code: "en", name: "Englisch" },
  ],
  en: [
    { code: "de", name: "German" },
    { code: "en", name: "English" },
  ],
} satisfies Record<Locale, LanguageItem[]>;
